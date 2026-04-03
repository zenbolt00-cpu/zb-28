import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
  FlatList,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import FastImage, { FastImagePriority } from '../components/FastImage';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { haptics } from '../utils/haptics';
import { useProductByHandle, useProducts } from '../hooks/useProducts';
import { useCartStore } from '../store/cartStore';
import { RootStackParamList } from '../navigation/RootNavigator';
import ProductCard from '../components/ProductCard';
import QuickAddModal from '../components/QuickAddModal';
import { FlatProduct, Media } from '../api/types';
import { useRecentStore } from '../store/recentStore';
import { useBookmarkStore } from '../store/bookmarkStore';
import { useUIStore } from '../store/uiStore';
import { Typography } from '../components/Typography';
import ImageGalleryModal from '../components/ImageGalleryModal';
import { WebView } from 'react-native-webview';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_H * 0.72;
const THUMB_SIZE = 100;
const THUMB_RADIUS = 20;
const NAV_PILL_H = 48;
const SIZE_GAP = 8;

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'ProductDetail'>>();
  const { handle } = route.params;
  const colors = useColors();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  const { product, loading, error } = useProductByHandle(handle);
  const { products: allProducts } = useProducts(10);
  const { addItem } = useCartStore();
  const cartCount = useCartStore(s => s.itemCount());

  const [selectedProduct, setSelectedProduct] = useState<FlatProduct | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'DESCRIPTION' | 'DETAILS' | 'CARE' | 'BRAND'>('DESCRIPTION');
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarkStore();
  const bookmarked = isBookmarked(product?.id || '');
  const { addProduct, recentProducts } = useRecentStore();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const [isSizeGuideVisible, setIsSizeGuideVisible] = useState(false);

  const setTabBarVisible = useUIStore(s => s.setTabBarVisible);
  const lastScrollY = useRef(0);
  const heroRef = useRef<FlatList<any> | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  // ---- Stable derived values (must be above early returns) ----
  const sizes = useMemo(() => ['XS', 'S', 'M', 'L', 'XL', 'XXL'], []);

  const variantBySize = useMemo(() => {
    const map = new Map<string, any>();
    for (const v of (product?.variants || []) as any[]) {
      if (!v?.size) continue;
      map.set(String(v.size).toUpperCase(), v);
    }
    return map;
  }, [product?.variants]);

  const productMedia: Media[] = useMemo(() => {
    if (!product) return [];
    if ((product as any).allMedia && (product as any).allMedia.length > 0) return (product as any).allMedia as Media[];
    return (product.images || []).map((img: string) => ({
      mediaContentType: 'IMAGE' as const,
      image: { url: img, altText: null },
      alt: null,
    }));
  }, [product]);

  const heroImages = useMemo(
    () =>
      productMedia
        .filter(m => m.mediaContentType !== 'VIDEO')
        .map(m => m.image?.url || (m as any).url || (m as any).src)
        .filter(Boolean),
    [productMedia],
  );

  const imageOnlyMedia = useMemo(() => productMedia.filter(m => m.mediaContentType !== 'VIDEO'), [productMedia]);

  const priceNumber = useMemo(() => {
    const raw = (product as any)?.price;
    const n = Number(String(raw || '0').replace(/[^0-9.]/g, '')) || 0;
    return n;
  }, [product]);

  const formattedPrice = useMemo(() => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(priceNumber);
    } catch {
      return `₹${Math.round(priceNumber).toLocaleString('en-IN')}`;
    }
  }, [priceNumber]);

  const recommended = useMemo(
    () => allProducts.filter((p: FlatProduct) => p.id !== (product?.id || '')).slice(0, 6),
    [allProducts, product?.id],
  );

  const recentFiltered = useMemo(
    () => recentProducts.filter((p: FlatProduct) => p.id !== (product?.id || '')).slice(0, 4),
    [recentProducts, product?.id],
  );

  useEffect(() => {
    if (product) addProduct(product);
  }, [product, addProduct]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 650, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  const handleScroll = (event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;
    if (Math.abs(diff) > 5) {
      const isVisible = useUIStore.getState().isTabBarVisible;
      if (diff > 0 && currentY > 100) {
        if (isVisible) setTabBarVisible(false);
      } else {
        if (!isVisible) setTabBarVisible(true);
      }
    }
    lastScrollY.current = currentY;
  };

  const handleSizeSelect = useCallback((size: string) => {
    setSelectedSize(size);
    haptics.buttonTap(); // impactLight
  }, []);

  const handleQuickAdd = (p: FlatProduct) => {
    setSelectedProduct(p);
    setModalVisible(true);
  };

  const resolveVariant = () => {
    if (!product) return null;
    if (product.variants.length > 1 && !selectedSize) return null;
    return selectedSize
      ? product.variants.find(v => v.size === selectedSize)
      : product.variants[0];
  };

  const handleAddToCart = () => {
    if (!product) return;
    const variant = resolveVariant();
    if (!variant) {
      Alert.alert('Select Size', 'Please select a size first');
      return;
    }
    if (!variant.availableForSale) {
      Alert.alert('Sold Out', 'Selected size is currently sold out.');
      return;
    }
    addItem({
      productId: product.id,
      variantId: variant.id,
      title: product.title,
      size: selectedSize,
      handle: product.handle,
      price: variant.price,
      image: product.images[0] || product.featuredImage || '',
    });
    haptics.addToCart();
  };

  const handleBuyNow = () => {
    if (!product) return;
    const variant = resolveVariant();
    if (!variant) {
      Alert.alert('Select Size', 'Please select a size first');
      return;
    }
    if (!variant.availableForSale) {
      Alert.alert('Sold Out', 'Selected size is currently sold out.');
      return;
    }
    addItem({
      productId: product.id,
      variantId: variant.id,
      title: product.title,
      size: selectedSize,
      handle: product.handle,
      price: variant.price,
      image: product.images[0] || product.featuredImage || '',
    });
    haptics.success();
    navigation.navigate('Checkout');
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.textExtraLight} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Product not found</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.goBackBtn, { backgroundColor: colors.text }]}
        >
          <Text style={[styles.goBackBtnText, { color: colors.background }]}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // NOTE: derived values are computed above (before early returns) to keep hook order stable.

  const selectedSizeVariant = selectedSize
    ? product.variants.find(v => v.size === selectedSize)
    : product.variants[0];
  const selectedVariantSoldOut = selectedSizeVariant
    ? !selectedSizeVariant.availableForSale
    : product.isSoldOut;

  const sizeChartValue = product.sizeChart?.trim();
  const sizeChartIsUrl = Boolean(sizeChartValue && /^https?:\/\//i.test(sizeChartValue));
  const sizeChartIsImageUrl = Boolean(
    sizeChartValue && /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(sizeChartValue),
  );
  const showGuideButton = Boolean(sizeChartValue);

  const borderLight = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const borderUltra = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const glassBg = 'rgba(255,255,255,0.18)'; // spec
  const glassInner = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
  const sizeBoxW = Math.floor((SCREEN_W - 40 - SIZE_GAP * 5) / 6);

  // formattedPrice comes from the stable memo above.

  const goCart = () => {
    haptics.buttonTap();
    useUIStore.getState().setCartOpen(true);
  };

  const onThumbPress = (idx: number) => {
    setCurrentImageIndex(idx);
    heroRef.current?.scrollToIndex({ index: idx, animated: true });
    haptics.buttonTap();
  };

  // heroImages comes from the stable memo above.

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Full-bleed hero (behind nav) */}
      <View style={styles.heroWrap}>
        <FlatList
          ref={(r) => {
            heroRef.current = r;
          }}
          data={heroImages}
          keyExtractor={(uri, idx) => `${idx}_${uri}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            setCurrentImageIndex(idx);
          }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => {
                setCurrentImageIndex(index);
                setIsGalleryVisible(true);
              }}
              style={{ width: SCREEN_W, height: HERO_HEIGHT }}
            >
              <FastImage
                source={{ uri: item || undefined }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={250}
                priority={FastImagePriority.high}
              />
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Floating frosted nav pill */}
      <View style={[styles.navWrap, { top: insets.top + 8 }]}>
        <View style={styles.navPill}>
          <BlurView intensity={16} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: glassBg }]} />

          <TouchableOpacity
            onPress={() => {
              haptics.buttonTap();
              navigation.goBack();
            }}
            style={styles.navCircleBtn}
            activeOpacity={0.75}
          >
            <BlurView intensity={16} tint="light" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: glassBg }]} />
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>

          <Text numberOfLines={1} style={styles.navTitle}>
            {product.title.toUpperCase()}
          </Text>

          <View style={styles.navIcons}>
            <TouchableOpacity
              onPress={() => {
                haptics.buttonTap();
                toggleTheme();
              }}
              activeOpacity={0.75}
            >
              <Ionicons name={isDark ? 'moon' : 'moon-outline'} size={22} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (bookmarked) removeBookmark(product.id);
                else addBookmark(product);
                haptics.buttonTap();
              }}
              activeOpacity={0.75}
            >
              <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={goCart} activeOpacity={0.75} style={{ paddingRight: 2 }}>
              <View>
                <Ionicons name="cart-outline" size={22} color="#fff" />
                {cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : String(cartCount)}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom, paddingTop: HERO_HEIGHT }}
      >
        {/* Thumbnail strip */}
        {heroImages.length > 1 && (
          <View
            style={[
              styles.thumbStrip,
              { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' },
            ]}
          >
            <BlurView intensity={isDark ? 28 : 18} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.72)' },
              ]}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbStripContent}
            >
              {heroImages.map((uri, idx) => {
                const active = idx === currentImageIndex;
                return (
                  <TouchableOpacity
                    key={`${idx}_${uri}`}
                    activeOpacity={0.8}
                    onPress={() => onThumbPress(idx)}
                    style={[
                      styles.thumbItem,
                      {
                        borderColor: active ? '#ffffff' : 'transparent',
                        borderWidth: active ? 1.5 : 0,
                      },
                    ]}
                  >
                    <FastImage
                      source={{ uri: uri || undefined }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={200}
                      priority={FastImagePriority.normal}
                    />
                    {!active && (
                      <View
                        style={[
                          StyleSheet.absoluteFill,
                          { backgroundColor: isDark ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.08)' },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Gap between thumbnails and details */}
        <View style={{ height: 14 }} />

        {/* Info card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.88)',
              marginTop: 0,
              borderColor: borderLight,
            },
          ]}
        >
          <BlurView intensity={isDark ? 52 : 24} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={styles.infoRow1}>
            <Text style={[styles.pdpTitle, { color: colors.text }]} numberOfLines={2}>
              {product.title.toUpperCase()}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (bookmarked) removeBookmark(product.id);
                else addBookmark(product);
                haptics.buttonTap();
              }}
              activeOpacity={0.75}
              style={[
                styles.bookmarkBtn,
                { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' },
              ]}
            >
              <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.pdpPrice, { color: colors.textSecondary }]}>{formattedPrice}</Text>

          {/* Size selector */}
          <View style={styles.sizeHeader}>
            <Text style={[styles.mutedLabel, { color: colors.textLight }]}>SELECT SIZE</Text>
            {showGuideButton && (
              <TouchableOpacity onPress={() => setIsSizeGuideVisible(true)} activeOpacity={0.8}>
                <Text style={[styles.mutedLabel, { color: colors.textLight, textDecorationLine: 'underline' }]}>
                  GUIDE
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sizePillsRow}>
            {sizes.map((s) => {
              const v = variantBySize.get(s);
              const out = !v || !v.availableForSale;
              const selected = selectedSize === s;
              const pillBorder = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)';

              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => (!out ? handleSizeSelect(s) : undefined)}
                  activeOpacity={out ? 1 : 0.8}
                  style={[
                    styles.sizePill2,
                    selected && styles.sizePillSelected,
                    {
                      width: sizeBoxW,
                      borderColor: selected ? (isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)') : pillBorder,
                      backgroundColor: selected
                        ? (isDark ? '#ffffff' : '#000000')
                        : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'),
                      opacity: out ? 0.45 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.sizeText, { color: selected ? (isDark ? '#000' : '#fff') : colors.text }]}>
                    {s}
                  </Text>
                  {out && (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.diagonalStrike,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.28)' },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action buttons */}
          <View style={styles.actions2}>
            <TouchableOpacity
              onPress={() => {
                haptics.buttonTap();
                handleAddToCart();
              }}
              activeOpacity={0.85}
              style={[
                styles.actionBtnOutline,
                {
                  borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
                },
              ]}
            >
              <BlurView intensity={isDark ? 20 : 14} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
              <Text style={[styles.actionBtnText, { color: isDark ? '#fff' : '#0a0a0a' }]}>
                ADD TO BAG
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                haptics.buttonTap();
                handleBuyNow();
              }}
              activeOpacity={0.85}
              style={[
                styles.actionBtnSolid,
                {
                  backgroundColor: isDark ? '#ffffff' : '#000000',
                },
              ]}
            >
              <Text style={[styles.actionBtnText, { color: isDark ? '#000' : '#fff' }]}>
                BUY NOW
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsRow}>
            {(['DESCRIPTION', 'DETAILS', 'CARE', 'BRAND'] as const).map((t) => {
              const active = activeTab === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setActiveTab(t)}
                  activeOpacity={0.85}
                  style={[
                    styles.tabItem,
                    active && {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText2,
                      { color: active ? colors.text : colors.textLight },
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description body */}
          <View style={styles.descBody}>
            <Text
              style={[
                styles.descText,
                { color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.72)' },
              ]}
              numberOfLines={showFullDescription ? undefined : 3}
            >
              {(activeTab === 'DESCRIPTION'
                ? product.description
                : activeTab === 'DETAILS'
                  ? product.details || product.description
                  : activeTab === 'CARE'
                    ? product.care || product.description
                    : 'ZICA BELLA')?.toUpperCase()}
            </Text>

            {activeTab === 'DESCRIPTION' && (
              <TouchableOpacity
                onPress={() => setShowFullDescription(!showFullDescription)}
                activeOpacity={0.85}
                style={[
                  styles.viewMoreBtn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                ]}
              >
                <Text style={[styles.viewMoreText, { color: colors.textSecondary }]}>
                  {showFullDescription ? 'VIEW LESS' : 'VIEW MORE'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Curated pairs */}
        {recommended.length > 0 && (
          <View style={styles.curatedWrap}>
            <View style={styles.curatedHeader}>
              <Text style={[styles.curatedTitle, { color: colors.text }]}>CURATED PAIRS</Text>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <TouchableOpacity activeOpacity={0.8} onPress={() => onThumbPress(Math.max(0, currentImageIndex - 1))}>
                  <Ionicons name="arrow-back-outline" size={18} color={colors.textLight} />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} onPress={() => onThumbPress(Math.min(heroImages.length - 1, currentImageIndex + 1))}>
                  <Ionicons name="arrow-forward-outline" size={18} color={colors.textLight} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.curatedList2}
              snapToInterval={SCREEN_W * 0.85 + 14}
              decelerationRate="fast"
            >
              {recommended.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.9}
                  onPress={() => navigation.push('ProductDetail', { handle: p.handle })}
                  style={styles.curatedCard}
                >
                  <View style={styles.curatedImg}>
                    <FastImage source={{ uri: p.featuredImage || undefined }} style={StyleSheet.absoluteFill} contentFit="cover" priority={FastImagePriority.normal} />
                  </View>
                  <View style={[styles.curatedMetaBar, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                    <BlurView intensity={isDark ? 30 : 20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.curatedName, { color: colors.text }]} numberOfLines={1}>
                        {p.title.toUpperCase()}
                      </Text>
                      <Text style={[styles.curatedPrice, { color: colors.textSecondary }]}>
                        {(() => {
                          const n = Number(String(p.price || '0').replace(/[^0-9.]/g, '')) || 0;
                          try {
                            return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
                          } catch {
                            return `₹${Math.round(n).toLocaleString('en-IN')}`;
                          }
                        })()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleQuickAdd(p);
                      }}
                      style={styles.curatedQuickAdd}
                    >
                      <Ionicons name="add" size={18} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
              <View style={{ width: SCREEN_W * 0.15 }} />
            </ScrollView>
          </View>
        )}

        {/* Recently viewed (keep existing) */}
        {recentFiltered.length > 0 && (
          <View style={[styles.recentSection, { backgroundColor: colors.background }]}>
            <View
              style={[
                styles.sectionHeaderRow,
                {
                  paddingHorizontal: 16,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  paddingBottom: 12,
                },
              ]}
            >
              <Typography
                heading
                size={7.5}
                color={colors.textLight}
                style={[styles.sectionLabel, { opacity: 0.8 }]}
              >
                RECENTLY VIEWED
              </Typography>
            </View>
            <View style={styles.recentGrid}>
              {recentFiltered.map((p: FlatProduct) => (
                <View key={p.id} style={styles.recentCard}>
                  <ProductCard product={p} onQuickAdd={handleQuickAdd} />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ───── Modals ───── */}
      <QuickAddModal
        visible={modalVisible}
        product={selectedProduct}
        onClose={() => setModalVisible(false)}
      />

      <ImageGalleryModal
        visible={isGalleryVisible}
        media={imageOnlyMedia}
        initialIndex={Math.max(
          0,
          imageOnlyMedia.findIndex((media: any) => {
            const mediaUrl = media?.image?.url || media?.url || media?.src;
            const currentUrl =
              productMedia[currentImageIndex]?.image?.url ||
              (productMedia[currentImageIndex] as any)?.url ||
              (productMedia[currentImageIndex] as any)?.src;
            return mediaUrl && mediaUrl === currentUrl;
          }),
        )}
        onClose={() => setIsGalleryVisible(false)}
      />

      {/* Size Guide Modal */}
      <Modal
        visible={isSizeGuideVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSizeGuideVisible(false)}
      >
        <View style={styles.guideBackdrop}>
          <BlurView intensity={95} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View
            style={[
              styles.guideCard,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)',
                borderColor: borderLight,
              },
            ]}
          >
            <View style={styles.guideHeader}>
              <Typography size={7} weight="600" color={colors.text} letterSpacing={1.2}>
                SIZE GUIDE
              </Typography>
              <TouchableOpacity
                style={[
                  styles.guideClose,
                  { backgroundColor: glassInner, borderColor: borderLight },
                ]}
                onPress={() => setIsSizeGuideVisible(false)}
              >
                <Ionicons name="close" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            {sizeChartIsImageUrl && sizeChartValue ? (
              <FastImage
                source={{ uri: sizeChartValue }}
                style={styles.guideImage}
                contentFit="contain"
                priority={FastImagePriority.high}
              />
            ) : sizeChartIsUrl && sizeChartValue ? (
              <WebView source={{ uri: sizeChartValue }} style={styles.guideWebView} />
            ) : sizeChartValue ? (
              <WebView source={{ html: sizeChartValue }} style={styles.guideWebView} />
            ) : (
              <View style={styles.guideEmpty}>
                <Typography size={8} color={colors.textSecondary}>
                  Size chart is unavailable for this product.
                </Typography>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  heroWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
    backgroundColor: '#000',
  },
  navWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
  },
  navPill: {
    height: NAV_PILL_H,
    borderRadius: 999,
    overflow: 'hidden',
    paddingLeft: 6,
    paddingRight: 10,
    alignItems: 'center',
    flexDirection: 'row',
  },
  navCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  navTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  navIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  thumbStrip: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  thumbStripContent: {
    paddingHorizontal: 6,
  },
  thumbItem: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_RADIUS,
    overflow: 'hidden',
    marginHorizontal: 6,
  },

  infoCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderWidth: 0.5,
  },
  infoRow1: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  pdpTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  bookmarkBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdpPrice: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 6,
  },
  sizeHeader: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mutedLabel: {
    fontSize: 8,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sizePillsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: SIZE_GAP,
    marginTop: 10,
    justifyContent: 'space-between',
  },
  sizePill2: {
    height: 44,
    borderRadius: 12,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sizePillSelected: {
    backgroundColor: '#000000',
  },
  sizeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  diagonalStrike: {
    position: 'absolute',
    width: '160%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    transform: [{ rotate: '-25deg' }],
  },
  actions2: {
    paddingTop: 14,
    gap: 10,
  },
  actionBtnOutline: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  actionBtnSolid: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    paddingTop: 14,
  },
  tabItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tabText2: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  descBody: {
    paddingBottom: 6,
  },
  descText: {
    fontSize: 8,
    lineHeight: 13,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  viewMoreBtn: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 10,
  },
  viewMoreText: {
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  curatedWrap: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  curatedHeader: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  curatedTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  curatedList2: {
    paddingLeft: 20,
    paddingRight: 4,
    gap: 14,
  },
  curatedCard: {
    width: SCREEN_W * 0.85,
  },
  curatedImg: {
    width: '100%',
    height: SCREEN_H * 0.64,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  curatedMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    overflow: 'hidden',
  },
  curatedQuickAdd: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  curatedName: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  curatedPrice: {
    fontSize: 8,
    fontWeight: '500',
    marginTop: 3,
  },

  /* ── Recently Viewed ── */
  recentSection: {
    marginTop: 12,
    marginBottom: 24,
  },
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    gap: 2,
  },
  recentCard: {
    width: '49.6%',
    marginBottom: 2,
  },

  /* ── Size Guide Modal ── */
  guideBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  guideCard: {
    width: '100%',
    maxHeight: '82%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  guideClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideImage: {
    width: '100%',
    height: 480,
    backgroundColor: 'transparent',
  },
  guideWebView: {
    width: '100%',
    height: 480,
    backgroundColor: 'transparent',
  },
  guideEmpty: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: 'center',
  },

  /* ── Error State ── */
  errorText: {
    fontSize: 14,
    marginBottom: 20,
    fontWeight: '300',
    letterSpacing: 2,
  },
  goBackBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 99,
  },
  goBackBtnText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
  },

  /* shared */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 7,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.4,
  },
});
