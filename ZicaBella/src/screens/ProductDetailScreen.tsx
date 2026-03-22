import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Share, ActivityIndicator, Dimensions, Alert, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import GlassHeader from '../components/GlassHeader';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { formatPrice } from '../utils/formatPrice';
import { haptics } from '../utils/haptics';
import { useProductByHandle, useProducts } from '../hooks/useProducts';
import { useCartStore } from '../store/cartStore';
import { RootStackParamList } from '../navigation/RootNavigator';
import ImageCarousel from '../components/ImageCarousel';
import ProductCard from '../components/ProductCard';
import QuickAddModal from '../components/QuickAddModal';
import { FlatProduct } from '../api/types';
import { useRecentStore } from '../store/recentStore';
import { useBookmarkStore } from '../store/bookmarkStore';
import { useUIStore } from '../store/uiStore';
import { Typography } from '../components/Typography';
import ImageGalleryModal from '../components/ImageGalleryModal';

const { width, height } = Dimensions.get('window');

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

  const [selectedProduct, setSelectedProduct] = useState<FlatProduct | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Description');
  const [isAdding, setIsAdding] = useState(false);
  const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useBookmarkStore();
  const bookmarked = isBookmarked(product?.id || '');
  const { addProduct, recentProducts } = useRecentStore();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isScrollLocked, setIsScrollLocked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  
  useEffect(() => {
    if (product) {
      addProduct(product);
    }
  }, [product, addProduct]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const setTabBarVisible = useUIStore(s => s.setTabBarVisible);
  const lastScrollY = useRef(0);

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
    
    // Lock image carousel if we've scrolled down a bit
    const shouldLock = currentY > 20;
    if (shouldLock !== isScrollLocked) {
      setIsScrollLocked(shouldLock);
    }

    lastScrollY.current = currentY;

    // Also update the Animated value for header effects
    scrollY.setValue(currentY);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    haptics.buttonTap();
  };

  const handleQuickAdd = (product: FlatProduct) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.variants.length > 1 && !selectedSize) {
      Alert.alert('Select Size', 'Please select a size first');
      return;
    }

    const variant = selectedSize 
      ? product.variants.find(v => v.size === selectedSize)
      : product.variants[0];

    if (!variant) return;

    setIsAdding(true);
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
    setTimeout(() => setIsAdding(false), 800);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (product.variants.length > 1 && !selectedSize) {
      Alert.alert('Select Size', 'Please select a size first');
      return;
    }

    const variant = selectedSize 
      ? product.variants.find(v => v.size === selectedSize)
      : product.variants[0];

    if (!variant) return;

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
    navigation.navigate('Cart');
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.textExtraLight} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Product not found</Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[styles.backBtn, { backgroundColor: colors.text }]}
        >
          <Text style={[styles.backBtnText, { color: colors.background }]}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sizes = product.variants
    ?.map(v => v.size)
    .filter((v, i, a) => v && a.indexOf(v) === i) || [];

  const recommended = allProducts.filter((p: FlatProduct) => p.id !== product.id).slice(0, 6);

  // Background Parallax
  const bgTranslateY = scrollY.interpolate({
    inputRange: [0, height],
    outputRange: [0, height * 0.4],
    extrapolate: 'clamp',
  });

  const bgScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.1, 1],
    extrapolate: 'clamp',
  });

  const blurIntensity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 50],
    extrapolate: 'clamp',
  });

  const bgOpacity = scrollY.interpolate({
    inputRange: [height * 0.4, height * 0.7],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Scrollable Content starts here, carousel will be its first (sticky) child */}

      <GlassHeader 
        title={product.title}
        showBack={true}
        isBookmarked={bookmarked}
        onPressBookmarks={() => {
          if (bookmarked) removeBookmark(product.id);
          else addBookmark(product);
          haptics.buttonTap();
        }}
      />

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <Animated.ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}

        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* PARALLAX GALLERY BACKGROUND INSIDE SCROLLVIEW */}
        <Animated.View style={[
          styles.stickyBackgroundInside,
          { 
            height: height * 0.85,
            opacity: bgOpacity,
            transform: [
              { translateY: scrollY }, // Keep it sticky at the top
              { scale: scrollY.interpolate({
                  inputRange: [-200, 0],
                  outputRange: [1.3, 1],
                  extrapolate: 'clamp'
                })
              }
            ]
          }
        ]}>
          <ImageCarousel 
            media={product.allMedia || []} 
            height={height * 0.85}
            showThumbnails={false}
            scrollEnabled={!isScrollLocked}
            externalActiveIndex={currentImageIndex}
            onIndexChange={setCurrentImageIndex}
            onPress={(index: number) => {
              setCurrentImageIndex(index);
              setIsGalleryVisible(true);
            }}
          />

          {/* Parallax Blur Overlay */}
          <AnimatedBlurView 
            intensity={blurIntensity} 
            tint={isDark ? 'dark' : 'light'} 
            style={StyleSheet.absoluteFill} 
          />
        </Animated.View>

        <View style={styles.heroSpacer} pointerEvents="none" />

        {/* Thumbnails Row - Now in the scrolling layer */}
        {(product.allMedia?.length || 0) > 1 && (
          <View style={styles.thumbnailSection}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbScrollContent}
              style={styles.thumbRow}
            >
              {product.allMedia?.map((item: any, idx: number) => {
                const isSelected = currentImageIndex === idx;
                return (
                  <TouchableOpacity 
                    key={idx}
                    onPress={() => {
                      setCurrentImageIndex(idx);
                      haptics.buttonTap();
                    }}
                    style={[
                      styles.appleThumb,
                      { 
                        borderColor: isSelected ? (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.15)') : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                        borderWidth: isSelected ? 2 : 1,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                      }
                    ]}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={{ uri: item.image?.url || item.url || item.src }} 
                      style={styles.appleThumbImage}
                      contentFit="cover"
                    />
                    {!isSelected && <View style={[styles.thumbOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)' }]} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Details Card */}
        <View style={[styles.detailsCard, { 
          backgroundColor: isDark ? 'rgba(5,7,12,0.6)' : 'rgba(255,255,255,0.7)',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          marginTop: 1, // Strict 1px gap from thumbnails
        }]}>
          <BlurView 
            intensity={95} 
            tint={isDark ? 'dark' : 'light'} 
            style={[StyleSheet.absoluteFill, { borderRadius: 32 }]} 
          />
          <View style={[styles.cardIndicator, { backgroundColor: colors.borderLight }]} />

          <View style={styles.mainInfo}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Typography heading size={14} color={colors.text} style={styles.title}>
                  {product.title}
                </Typography>
                <View style={styles.priceRow}>
                  <Typography size={12} weight="400" color={colors.textSecondary}>
                    {formatPrice(product.price)}
                  </Typography>
                  {product.compareAtPrice && (
                    <Typography size={10} weight="300" color={colors.textExtraLight} style={styles.comparePrice}>
                      {formatPrice(product.compareAtPrice)}
                    </Typography>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (bookmarked) removeBookmark(product.id);
                  else addBookmark(product);
                  haptics.buttonTap();
                }}
                style={[styles.bookmarkCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
              >
                <Ionicons 
                  name={bookmarked ? "bookmark" : "bookmark-outline"} 
                  size={18} 
                  color={colors.text} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Size Selection Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Typography size={7} color={colors.textExtraLight} style={styles.sectionLabel}>SELECT SIZE</Typography>
              <TouchableOpacity>
                <Typography size={7} color={colors.textExtraLight} style={styles.guideBtn}>GUIDE</Typography>
              </TouchableOpacity>
            </View>
            
            <View style={styles.sizeSectionContainer}>
              <View style={styles.sizeRow}>
                {sizes.map((s, i) => {
                  const isSelected = selectedSize === s;
                  return (
                    <TouchableOpacity 
                      key={i} 
                      style={[
                        styles.sizeBox, 
                        { 
                          borderColor: isSelected ? colors.text : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                          backgroundColor: isSelected ? colors.foreground : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                          borderWidth: isSelected ? 1.5 : 1,
                        }
                      ]}
                      onPress={() => s && setSelectedSize(s)}
                    >
                      <Typography size={8} weight="600" color={isSelected ? colors.background : colors.textSecondary}>
                        {s?.toUpperCase()}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Action Buttons - High Contrast */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[
                styles.addBtn, 
                { 
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                },
                (product.isSoldOut) && styles.addBtnDisabled
              ]} 
              onPress={handleAddToCart}
            >
              <Typography heading size={8} color={colors.text} weight="700">
                {product.isSoldOut ? 'SOLD OUT' : 'ADD TO BAG'}
              </Typography>
            </TouchableOpacity>

            {!product.isSoldOut && (
              <TouchableOpacity 
                style={[
                  styles.buyNowBtn, 
                  { 
                    backgroundColor: colors.foreground,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderWidth: 1 
                  }
                ]} 
                onPress={handleBuyNow}
                activeOpacity={0.8}
              >
                <Typography heading size={8} color={colors.background} weight="700">
                  BUY NOW
                </Typography>
              </TouchableOpacity>
            )}
          </View>

          {/* Description & Tabs Section */}
          <View style={styles.tabsSection}>
            <View style={{ height: 44, paddingBottom: 8 }}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabBarScroll}
              >
                {['Description', 'Details', 'Care', 'Brand'].map((t) => {
                  const isActive = activeTab === t;
                  return (
                    <TouchableOpacity 
                      key={t} 
                      onPress={() => setActiveTab(t)}
                      style={[
                        styles.pillTab, 
                        { 
                          backgroundColor: isActive ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)') : 'transparent',
                          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                          borderWidth: 1
                        }
                      ]}
                    >
                      <Typography size={6.5} color={isActive ? colors.text : colors.textLight} weight="600">
                        {t.toUpperCase()}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            
            <View style={[styles.tabContentBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' }]}>
              {activeTab === 'Description' && (
                <View style={styles.contentInside}>
                  <Typography size={8} color={colors.textSecondary} style={styles.tabPaneText} numberOfLines={showFullDescription ? undefined : 3}>
                    {product.description}
                  </Typography>
                  <TouchableOpacity 
                    onPress={() => setShowFullDescription(!showFullDescription)} 
                    style={[styles.viewMorePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)' }]}
                  >
                    <Typography size={6.5} color={colors.textSecondary} weight="600">
                      {showFullDescription ? 'VIEW LESS' : 'VIEW MORE'}
                    </Typography>
                  </TouchableOpacity>
                </View>
              )}
              {activeTab === 'Details' && (
                <View style={styles.contentInside}>
                  <Typography size={8} color={colors.textSecondary} style={styles.tabPaneText}>
                    {product.details || "Premium craftsmanship and high-quality materials tailored for modern comfort."}
                  </Typography>
                </View>
              )}
              {activeTab === 'Care' && (
                <View style={styles.contentInside}>
                  <Typography size={8} color={colors.textSecondary} style={styles.tabPaneText}>
                    {product.care || "Dry clean only. Hand wash with cold water. Do not bleach. Iron at low temperature."}
                  </Typography>
                </View>
              )}
              {activeTab === 'Brand' && (
                <View style={styles.contentInside}>
                  <Typography size={8} color={colors.textSecondary} style={styles.tabPaneText}>
                    ZICA BELLA creates limited-edition streetwear pieces that blend architectural geometry with casual luxury, designed in London and crafted globally.
                  </Typography>
                </View>
              )}
            </View>
          </View>

          {/* Lifestyle Video Section (Above Curated Pairs) */}
          {product.productVideo && (
            <View style={styles.lifestyleSection}>
              <Typography heading size={7.5} color={colors.textLight} style={[styles.sectionLabel, { paddingHorizontal: 24, marginBottom: 12 }]}>THE MOVEMENTS</Typography>
              <View style={styles.videoCard}>
                 <ImageCarousel 
                   media={[{ 
                     mediaContentType: 'VIDEO', 
                     sources: [{ url: product.productVideo, mimeType: 'video/mp4' }] 
                   } as any]} 
                   height={600}
                   muted={isMuted}
                   onPress={() => {
                     setIsMuted(!isMuted);
                     haptics.buttonTap();
                   }}
                 />
                 <TouchableOpacity 
                   style={styles.muteBtn}
                   onPress={() => {
                     setIsMuted(!isMuted);
                     haptics.buttonTap();
                   }}
                 >
                    <Ionicons 
                      name={isMuted ? "volume-mute" : "volume-high"} 
                      size={14} 
                      color="#FFF" 
                    />
                 </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Curated Pairs Section */}
          <View style={[styles.curatedSection, { paddingHorizontal: 0 }]}>
            <View style={[styles.sectionHeader, { paddingHorizontal: 16, marginBottom: 16 }]}>
              <Typography heading size={7.5} color={colors.textLight} style={styles.sectionLabel}>CURATED PAIRS</Typography>
              <View style={{ flexDirection: 'row' }}>
                <Ionicons name="arrow-back-outline" size={16} color={colors.textExtraLight} style={{ marginRight: 24 }} />
                <Ionicons name="arrow-forward-outline" size={16} color={colors.textExtraLight} />
              </View>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.curatedList}
              snapToInterval={(width * 0.85) + 2} // width + gap
              decelerationRate="fast"
            >
              {recommended.map((p: FlatProduct) => (
                <TouchableOpacity 
                  key={p.id} 
                  style={styles.curatedItem}
                  onPress={() => navigation.push('ProductDetail', { handle: p.handle })}
                >
                  <View style={[styles.curatedImageContainer, { backgroundColor: colors.surface }]}>
                    <Image source={{ uri: p.featuredImage || undefined }} style={styles.curatedImage} contentFit="cover" />
                  </View>
                  <View style={styles.curatedInfo}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Typography heading size={8} color={colors.textSecondary} numberOfLines={1}>{p.title}</Typography>
                      <Typography size={8} color={colors.textExtraLight}>{formatPrice(p.price)}</Typography>
                    </View>
                    <TouchableOpacity 
                      onPress={() => handleQuickAdd(p)}
                      activeOpacity={0.7}
                      style={styles.curatedQuickAdd}
                    >
                      <Ionicons name="add-outline" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

        </View>

        {/* Recently Viewed (Premium Edge-To-Edge Grid) */}
        {recentProducts.length > 1 && (
          <View style={[styles.recentSection, { backgroundColor: colors.background }]}>
            <View style={[styles.sectionHeader, { paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: 12 }]}>
              <Typography heading size={7.5} color={colors.textLight} style={[styles.sectionLabel, { opacity: 0.8 }]}>RECENTLY VIEWED</Typography>
            </View>
            <View style={styles.recentGrid}>
              {recentProducts.filter((p: FlatProduct) => p.id !== product.id).slice(0, 4).map((p: FlatProduct) => (
                <View key={p.id} style={[styles.recentCardWrapper, { borderColor: colors.borderLight }]}>
                  <ProductCard 
                    product={p} 
                    onQuickAdd={handleQuickAdd} 
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 160 + insets.bottom }} />
      </Animated.ScrollView>
      <QuickAddModal visible={modalVisible} product={selectedProduct} onClose={() => setModalVisible(false)} />
      <ImageGalleryModal 
        visible={isGalleryVisible} 
        media={product.allMedia || []} 
        initialIndex={currentImageIndex} 
        onClose={() => setIsGalleryVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stickyBackgroundInside: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: -1 
  },
  headerActions: { position: 'absolute', left: 12, right: 12, zIndex: 100, flexDirection: 'row', justifyContent: 'space-between' },
  headerBtn: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1 },
  scrollContent: { paddingTop: 0 },
  heroSpacer: { height: height * 0.85 },
  detailsCard: { 
    borderTopLeftRadius: 36, 
    borderTopRightRadius: 36, 
    paddingTop: 8, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderTopWidth: 1, 
    borderBottomWidth: 0,
    marginTop: 1, 
  },
  cardIndicator: { width: 36, height: 3, borderRadius: 1.5, alignSelf: 'center', marginBottom: 12, opacity: 0.15 },
  mainInfo: { paddingHorizontal: 24, marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  title: { flex: 1, textTransform: 'uppercase', letterSpacing: 2 },
  saleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  saleBadgeText: { color: '#FFF', fontSize: 7, fontWeight: '700', textTransform: 'uppercase' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 4 },
  price: { fontSize: 12, fontWeight: '400' },
  comparePrice: { fontSize: 10, fontWeight: '300', textDecorationLine: 'line-through' },
  section: { paddingHorizontal: 24, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 7, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.4 },
  guideBtn: { fontSize: 7, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.4, textDecorationLine: 'underline' },
  sizeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizeBtn: { width: (width - 48 - 40) / 6, aspectRatio: 1, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  sizeBtnSoldOut: { opacity: 0.3 },
  sizeBtnText: { fontSize: 8, fontWeight: '500' },
  actions: { paddingHorizontal: 24, gap: 10, marginBottom: 16 },
  addBtn: { width: '100%', height: 50, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  buyNowBtn: { width: '100%', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10, overflow: 'hidden' },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
  buyNowBtnText: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
  description: { fontSize: 13, lineHeight: 20, marginBottom: 12, fontWeight: '300' },
  viewMore: { fontSize: 8, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  tabsSection: { marginTop: 4, paddingHorizontal: 24 },
  tabBar: { flexDirection: 'row', gap: 20, paddingBottom: 12 },
  tabItem: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  tabItemActive: { backgroundColor: 'rgba(0,0,0,0.05)' },
  tabText: { fontSize: 7, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  bookmarkCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabContent: { paddingTop: 20 },
  tabPaneText: { fontSize: 8.5, lineHeight: 14, fontWeight: '400' },
  sizeRow: { flexDirection: 'row', gap: 8, width: '100%' },
  sizeSectionContainer: { marginTop: 8 },
  sizeBox: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  sizeBoxText: { fontSize: 8, fontWeight: '600' },
  lifestyleSection: { marginTop: 16, marginBottom: 16 },
  videoCard: { width: '100%', height: 600, overflow: 'hidden', position: 'relative' },
  muteBtn: { position: 'absolute', bottom: 20, right: 20, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  curatedSection: { marginTop: 8, marginBottom: 16 },
  curatedList: { paddingHorizontal: 0, gap: 2 },
  curatedItem: { width: width * 0.85 },
  curatedImageContainer: { width: '100%', aspectRatio: 3 / 4.4, borderRadius: 0, overflow: 'hidden', marginBottom: 12 },
  curatedImage: { width: '100%', height: '100%' },
  curatedInfo: { paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  curatedTitle: { fontSize: 10, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  curatedPrice: { fontSize: 9, fontWeight: '300', letterSpacing: 2 },
  curatedQuickAdd: { marginTop: 0, opacity: 0.6 },
  recentSection: { marginTop: 12, marginBottom: 24 },
  recentGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    paddingHorizontal: 2,
    gap: 2,
  },
  recentCardWrapper: {
    width: '49.6%',
    marginBottom: 2,
  },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  badgeText: { color: '#FFF', fontSize: 7, fontWeight: '700' },
  errorText: { fontSize: 14, marginBottom: 20, fontWeight: '300', letterSpacing: 2 },
  backBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 99 },
  backBtnText: { fontSize: 10, fontWeight: '600', letterSpacing: 4 },
  
  // Header Additions
  headerTitleContainer: {
    flex: 1,
    height: 38,
    marginHorizontal: 12,
    borderRadius: 19,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    paddingHorizontal: 16,
  },
  headerRight: {
    flexDirection: 'row',
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 4,
  },
  pillTabText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  viewMoreBtn: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  viewMoreText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  soldOutLine: {
    position: 'absolute',
    width: '140%',
    height: 1,
    transform: [{ rotate: '45deg' }],
  },
  thumbRow: { 
    width: '100%', 
    paddingTop: 16,
    paddingBottom: 0,
  },
  thumbScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  appleThumb: {
    width: 90,
    height: 90,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  appleThumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  thumbnailSection: {
    paddingBottom: 0,
  },
  tabBarScroll: {
    paddingRight: 40,
    gap: 12,
  },
  tabContentBox: {
    borderRadius: 16,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 0,
  },
  contentInside: {
    padding: 20,
    gap: 12,
  },
  boxTitle: {
    fontSize: 7.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  viewMorePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginTop: 8,
  },
  viewMorePillText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  experimentalSection: {
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  experimentalImageContainer: {
    width: '100%',
    height: 500,
    borderRadius: 32,
    overflow: 'hidden',
    marginTop: 10,
  },
  experimentalImage: {
    width: '100%',
    height: '100%',
  },
  backBtnCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#58CCCD',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
