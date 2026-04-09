import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Animated,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { haptics } from '../utils/haptics';
import { useProductByHandle, useProducts } from '../hooks/useProducts';
import { useCartStore } from '../store/cartStore';
import { RootStackParamList } from '../navigation/types';
import { Typography } from '../components/Typography';
import { formatPrice } from '../utils/formatPrice';
import { useUIStore } from '../store/uiStore';
import ProductCard from '../components/ProductCard';
import { useRecentStore } from '../store/recentStore';
import StorefrontFooter from '../components/StorefrontFooter';
import { SizeChartModal } from '../components/SizeChartModal';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'ProductDetail'>>();
  const { handle } = route.params;
  const colors = useColors();
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const { product, loading } = useProductByHandle(handle);
  const { products: recommended } = useProducts(8);
  const { addItem } = useCartStore();
  const cartCount = useCartStore(s => s.itemCount());

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'DESCRIPTION' | 'DETAILS' | 'CARE' | 'BRAND'>('DESCRIPTION');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [sizeChartVisible, setSizeChartVisible] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const [showMinimalSticky, setShowMinimalSticky] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      // Threshold where large buttons are roughly scrolled past
      if (value > 480 && !showMinimalSticky) setShowMinimalSticky(true);
      if (value <= 480 && showMinimalSticky) setShowMinimalSticky(false);
    });
    return () => scrollY.removeListener(id);
  }, [showMinimalSticky]);

  const stickyOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(stickyOpacity, {
      toValue: showMinimalSticky ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showMinimalSticky]);
  const toggleTheme = useThemeStore(s => s.toggleTheme);
  const setCartOpen = useUIStore(s => s.setCartOpen);
  const setBookmarkOpen = useUIStore(s => s.setBookmarkOpen);
  const { addProduct: recordVisit, recentProducts } = useRecentStore();

  const player = useVideoPlayer(product?.productVideo ?? null, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const options = useMemo(() => {
    if (!product) return { sizes: [], colors: [] };
    const sizes = new Set<string>();
    product.variants.forEach(v => {
      if (v.size) sizes.add(v.size);
    });
    return { 
      sizes: Array.from(sizes), 
      colors: ['BLACK', 'CREAM', 'SLATE'] 
    };
  }, [product]);

  useEffect(() => {
    if (options.sizes.length === 1) setSelectedSize(options.sizes[0]);
    if (options.colors.length > 0) setSelectedColor(options.colors[0]);
    if (product) recordVisit(product);
  }, [options, product, recordVisit]);

  const handleAddToCart = () => {
    if (!product) return;
    const variant = product.variants.find(v => v.size === selectedSize) || product.variants[0];
    addItem({
      productId: product.id,
      variantId: variant.id,
      title: product.title,
      size: selectedSize,
      handle: product.handle,
      price: variant.price,
      image: product.featuredImage,
    });
    haptics.addToCart();
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => {
      navigation.navigate('CheckoutFlow');
    }, 400);
  };

  if (loading || !product) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.textExtraLight} />
      </View>
    );
  }

  const images = product.images.length > 0 ? product.images : [product.featuredImage];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── TOP NAV ACTIONS: Header Parity ── */}
      <View style={[styles.topActions, { top: insets.top + 10 }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}
        >
          <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.topRightActions}>
          <TouchableOpacity 
            onPress={() => { haptics.buttonTap(); setBookmarkOpen(true); }} 
            style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}
          >
            <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            <Ionicons name="bookmark-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => { haptics.buttonTap(); setCartOpen(true); }} 
            style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}
          >
            <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            <Ionicons name="bag-outline" size={16} color={colors.textSecondary} />
            {cartCount > 0 && <View style={[styles.cartBadge, { backgroundColor: colors.text }]} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 220 + insets.bottom }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* ── HERO GALLERY: Rounded "Apple" Card ── */}
        <View style={[styles.heroWrapper, { paddingTop: insets.top + 70 }]}>
          <View style={styles.heroContainer}>
            <Image 
              source={images[activeImageIndex]} 
              style={styles.heroImage} 
              contentFit="cover"
              transition={800}
            />
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.thumbnailScroll}
          style={{ marginTop: 24 }}
        >
          {images.map((img, idx) => (
            <TouchableOpacity 
              key={idx} 
              onPress={() => { haptics.buttonTap(); setActiveImageIndex(idx); }}
              style={[
                styles.thumbnail, 
                { 
                  borderColor: activeImageIndex === idx ? colors.text : 'rgba(0,0,0,0.05)',
                  borderWidth: activeImageIndex === idx ? 1.5 : 1,
                  opacity: activeImageIndex === idx ? 1 : 0.6
                }
              ]}
            >
              <Image source={img} style={StyleSheet.absoluteFill} contentFit="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── PRODUCT INFO ── */}
        <View style={styles.infoSection}>
           <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Typography rocaston size={24} color={colors.textSecondary} style={styles.title}>
                  {product.title.toUpperCase()}
                </Typography>
                <Typography size={12} weight="300" color={colors.textExtraLight} style={styles.price}>
                  {formatPrice(product.price)}
                </Typography>
              </View>
              <TouchableOpacity 
                style={[styles.bookmarkToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}
                onPress={() => { haptics.buttonTap(); setIsBookmarked(!isBookmarked); }}
              >
                <Ionicons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
           </View>

           {/* SIZE SELECTOR: Modern Pill Grid */}
           <View style={styles.selectorSection}>
              <View style={styles.selectorHeader}>
                <Typography size={7} weight="400" color={colors.textExtraLight} style={styles.selectorLabel}>SELECT SIZE</Typography>
                <TouchableOpacity onPress={() => { haptics.buttonTap(); setSizeChartVisible(true); }}>
                   <Typography size={7} weight="600" color={colors.textExtraLight} style={{ textDecorationLine: 'underline', opacity: 0.4 }}>SIZE GUIDE</Typography>
                </TouchableOpacity>
              </View>
               <View style={styles.sizeGrid}>
                {options.sizes.map(s => {
                  const variant = product.variants.find(v => v.size === s);
                  const isOutOfStock = variant?.quantityAvailable === 0;
                  return (
                    <TouchableOpacity 
                      key={s} 
                      onPress={() => { haptics.buttonTap(); setSelectedSize(s); }}
                      disabled={isOutOfStock}
                      style={[
                        styles.sizeOption, 
                        { 
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', 
                          backgroundColor: selectedSize === s ? colors.text : 'transparent'
                        },
                        isOutOfStock && { opacity: 0.25 }
                      ]}
                    >
                      <Typography 
                        size={8.5} 
                        weight="500" 
                        color={selectedSize === s ? colors.background : colors.textSecondary}
                      >
                        {s.toUpperCase()}
                      </Typography>
                      {isOutOfStock && (
                        <View style={[styles.diagonalLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
           </View>

           {/* PRIMARY ACTIONS: Inline as per iPhone reference */}
           <View style={styles.inlineActions}>
              <TouchableOpacity 
                style={[styles.ghostBtn, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', marginBottom: 12 }]}
                onPress={handleAddToCart}
                activeOpacity={0.8}
              >
                <Typography size={9} weight="700" color={colors.textSecondary} style={{ letterSpacing: 4 }}>ADD TO BAG</Typography>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: colors.foreground }]}
                onPress={handleBuyNow}
                activeOpacity={0.8}
              >
                <Typography size={9} weight="800" color={colors.background} style={{ letterSpacing: 5 }}>BUY NOW</Typography>
              </TouchableOpacity>
           </View>

            {/* INFO ACCORDION: Liquid Glass Style */}
           <View style={[styles.tabsBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <View style={[styles.tabsPillContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                {(['DESCRIPTION', 'DETAILS', 'CARE', 'BRAND'] as const).map(tab => (
                  <TouchableOpacity 
                    key={tab} 
                    onPress={() => { haptics.buttonTap(); setActiveTab(tab); }}
                    style={[styles.tabBtn, activeTab === tab && { backgroundColor: isDark ? 'white' : 'white' }]}
                  >
                    <Typography size={6.5} weight="700" color={activeTab === tab ? '#000' : colors.textExtraLight} style={{ opacity: activeTab === tab ? 1 : 0.4 }}>
                      {tab}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.tabContentArea}>
                <Typography 
                  size={9} 
                  color={colors.textSecondary} 
                  numberOfLines={activeTab === 'DESCRIPTION' && !isDescriptionExpanded ? 3 : undefined}
                  style={{ lineHeight: 18, fontWeight: '300', opacity: 0.8 }}
                >
                  {activeTab === 'DESCRIPTION' ? product.description : 
                   activeTab === 'DETAILS' ? (product.details || "High-density weight. Signature Zica Bella custom cut. Reinforced seams for architectural durability.") :
                   activeTab === 'CARE' ? (product.care || "Dry clean only recommended. Hand wash cold if necessary. Lay flat to dry away from direct sunlight.") :
                   "Founded on the principle of 'Liquid Architecture'. Each piece is a curated artifact of modern luxury."}
                </Typography>
                {activeTab === 'DESCRIPTION' && !isDescriptionExpanded && (
                  <TouchableOpacity 
                    onPress={() => { haptics.buttonTap(); setIsDescriptionExpanded(true); }}
                    style={[styles.viewMorePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                  >
                     <Typography size={6.5} weight="700" color={colors.textSecondary}>VIEW MORE</Typography>
                  </TouchableOpacity>
                )}
              </View>
           </View>

           {/* PRODUCT VIDEO: Emotive Section */}
           {product.productVideo && (
             <View style={styles.videoSection}>
                <Typography size={7.5} color={colors.textExtraLight} weight="700" style={styles.sectionTag}>EXPERIMENTAL REFERENCE</Typography>
                <View style={styles.videoWrapper}>
                  <VideoView
                    player={player}
                    style={StyleSheet.absoluteFill}
                    nativeControls={false}
                    contentFit="cover"
                  />
                  <View style={styles.videoOverlay} />
                </View>
             </View>
           )}

            {/* CURATED PAIRS: Minimal UI Grid */}
            {recommended.length > 0 && (
             <View style={styles.curatedSection}>
                <View style={[styles.curatedHeaderFixed, { paddingBottom: 16 }]}>
                  <Typography rocaston size={13} color={colors.textSecondary} style={{ letterSpacing: 4 }}>CURATED PAIRS</Typography>
                  <View style={styles.headerArrows}>
                    <TouchableOpacity onPress={() => haptics.buttonTap()} style={{ opacity: 0.4 }}><Ionicons name="arrow-back" size={16} color={colors.textSecondary} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => haptics.buttonTap()} style={{ opacity: 0.4, marginLeft: 20 }}><Ionicons name="arrow-forward" size={16} color={colors.textSecondary} /></TouchableOpacity>
                  </View>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.curatedScroll}
                  snapToInterval={SCREEN_W * 0.85}
                  decelerationRate="fast"
                >
                  {recommended.slice(0, 6).map((p, idx) => (
                    <TouchableOpacity 
                      key={p.id} 
                      style={[
                        styles.curatedItem,
                        { borderRightWidth: 1, borderRightColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                      ]}
                      onPress={() => navigation.push('ProductDetail', { handle: p.handle })}
                    >
                      <View style={styles.curatedCard}>
                        <Image source={{ uri: p.featuredImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      </View>
                      <View style={styles.curatedMeta}>
                         <View style={{ flex: 1 }}>
                           <Typography size={8} weight="400" color={colors.textSecondary} numberOfLines={1} style={{ letterSpacing: 1.5, marginBottom: 2 }}>{p.title.toUpperCase()}</Typography>
                           <Typography size={8} weight="300" color={colors.textExtraLight}>{formatPrice(p.price)}</Typography>
                         </View>
                         <TouchableOpacity 
                           onPress={(e) => { e.stopPropagation(); haptics.addToCart(); }}
                           style={styles.plusBtn}
                         >
                            <Ionicons name="add" size={18} color={colors.textSecondary} style={{ opacity: 0.6 }} />
                         </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
             </View>
            )}

           {/* RECENTLY VIEWED */}
           {recentProducts.length > 1 && (
              <View style={styles.recentSection}>
                <Typography size={7} color={colors.textExtraLight} weight="400" style={styles.sectionTag}>RECENTLY VIEWED</Typography>
                <View style={styles.recentGrid}>
                  {recentProducts.filter(p => p.id !== product.id).slice(0, 4).map(p => (
                    <View key={p.id} style={styles.recentCardWrapper}>
                      <ProductCard product={p} />
                    </View>
                  ))}
                </View>
              </View>
           )}

           <StorefrontFooter />
        </View>
      </ScrollView>

      {/* ── MINIMAL STICKY ACTION: iPhone Scroll Sync Parity ── */}
      <Animated.View style={[styles.minimalStickyFooter, { paddingBottom: insets.bottom + 12, opacity: stickyOpacity, transform: [{ translateY: stickyOpacity.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
         <BlurView intensity={isDark ? 60 : 80} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
         <View style={[styles.footerDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)' }]} />
         
         <TouchableOpacity 
           style={[styles.minimalAddBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
           onPress={handleAddToCart}
           activeOpacity={0.9}
         >
           <Typography size={8} weight="800" color={colors.text} style={{ letterSpacing: 3 }}>ADD TO BAG</Typography>
           <View style={{ width: 1, height: 12, backgroundColor: colors.text, opacity: 0.2, marginHorizontal: 16 }} />
           <Typography size={8} weight="300" color={colors.text}>{formatPrice(product.price)}</Typography>
         </TouchableOpacity>
      </Animated.View>

      <SizeChartModal 
        visible={sizeChartVisible} 
        onClose={() => setSizeChartVisible(false)}
        imageUrl={product.sizeChart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topActions: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
  },
  videoSection: {
    marginBottom: 48,
  },
  sectionTag: {
    letterSpacing: 4,
    marginBottom: 16,
    opacity: 0.35,
    paddingHorizontal: 24,
  },
  videoWrapper: {
    width: SCREEN_W - 40,
    alignSelf: 'center',
    aspectRatio: 9 / 16,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  heroWrapper: {
    paddingHorizontal: 20,
  },
  heroContainer: {
    width: '100%',
    aspectRatio: 3 / 4.2, // Closer to 85dvh feel on mobile
    borderRadius: 44,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 10,
  },
  heroImage: { flex: 1 },
  thumbnailScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  thumbnail: {
    width: 112, // Exact w-28 parity
    height: 112,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  infoSection: {
    paddingHorizontal: 24,
    paddingTop: 36,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  title: { letterSpacing: 1, marginBottom: 6, lineHeight: 32 },
  price: { letterSpacing: 2, opacity: 0.6 },
  bookmarkToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorSection: {
    marginBottom: 24,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectorLabel: { letterSpacing: 3, opacity: 0.35, fontWeight: '500' },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeOption: {
    width: (SCREEN_W - 48 - 40) / 6, 
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  diagonalLine: {
    position: 'absolute',
    width: '140%',
    height: 1,
    transform: [{ rotate: '150deg' }],
  },
  tabsBox: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 32,
  },
  tabsPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 20,
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  tabContentArea: {
    paddingHorizontal: 4,
  },
  viewMorePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 16,
  },
  curatedSection: {
    marginBottom: 48,
    marginHorizontal: -24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  curatedHeaderFixed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 8,
  },
  headerArrows: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  curatedScroll: {
    paddingLeft: 0,
  },
  curatedItem: {
    width: SCREEN_W * 0.85,
  },
  curatedCard: {
    aspectRatio: 3 / 4.8, 
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  curatedMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentSection: {
    marginBottom: 64,
    paddingHorizontal: 20,
  },
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 16,
    marginTop: 12,
  },
  recentCardWrapper: {
    width: (SCREEN_W - 40 - 12) / 2,
    marginBottom: 16,
  },
  inlineActions: {
    marginBottom: 32,
    marginTop: 8,
  },
  minimalStickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2000,
    paddingHorizontal: 24,
    paddingTop: 16,
    overflow: 'hidden',
  },
  footerDivider: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  ghostBtn: {
    width: '100%',
    height: 58,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  primaryBtn: {
    width: '100%',
    height: 58,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalAddBtn: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderWidth: 1,
  },
});

