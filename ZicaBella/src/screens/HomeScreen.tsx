import React, { useCallback, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
  RefreshControl, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { config } from '../constants/config';
import ProductCard from '../components/ProductCard';
import CollectionCarousel from '../components/CollectionCarousel';
import HeroVideo from '../components/HeroVideo';
import GlassHeader from '../components/GlassHeader';
import QuickAddModal from '../components/QuickAddModal';
import RingCarouselSection from '../components/RingCarouselSection';
import { useProducts, useCollections, useCollectionByHandle } from '../hooks/useProducts';
import { FlatProduct } from '../api/types';
import MenuDrawer from '../components/MenuDrawer';
import BookmarkDrawer from '../components/BookmarkDrawer';
import SpotlightSection from '../components/SpotlightSection';
import FlipbookSection from '../components/FlipbookSection';
import CommunitySection from '../components/CommunitySection';
import { useAdminSettings } from '../hooks/useAdminFeatures';
import { useUIStore } from '../store/uiStore';
import { Typography } from '../components/Typography';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const { settings, loading: settingsLoading } = useAdminSettings();
  
  const ringHandle = settings?.ringCarousel?.collection || 'accessories';
  const ringTitle = settings?.ringCarousel?.title || 'RING COLLECTION';

  const heroVideoSrc = settings?.hero?.video || config.heroVideoUrl;
  const heroImageSrc = settings?.hero?.image;
  const heroTitle = settings?.hero?.title || 'ZICA BELLA';
  const heroSubtitle = settings?.hero?.subtitle || 'ARCHIVAL VISION';
  const showHeroText = settings?.hero?.showText ?? true;

  const latestCurationTitle = settings?.latestCuration?.title || 'LATEST CURATION';
  const latestCurationSubtitle = settings?.latestCuration?.subtitle || 'SEASON DROP';

  const { products, loading, error, refetch } = useProducts(24);
  const { collections, refetch: refetchCollections } = useCollections(20, 'page');
  const { products: accessories } = useCollectionByHandle(ringHandle);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<FlatProduct | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [bookmarksVisible, setBookmarksVisible] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchCollections()]);
    setRefreshing(false);
  }, [refetch, refetchCollections]);

  const setTabBarVisible = useUIStore(s => s.setTabBarVisible);
  const lastScrollY = useRef(0);

  const onScroll = (event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;
    
    // Only toggle if scrolled significantly to avoid flickering on micro-jitters
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

  const handleQuickAdd = useCallback((product: FlatProduct) => {
    setSelectedProduct(product);
    setModalVisible(true);
  }, []);

  const renderProductGrid = (items: FlatProduct[]) => (
    <View style={styles.gridContainer}>
      {items.map((product) => (
        <View key={product.id} style={styles.gridItem}>
          <ProductCard 
            product={product} 
            onQuickAdd={handleQuickAdd}
          />
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader 
        onPressMenu={() => setMenuVisible(true)}
        onPressBookmarks={() => setBookmarksVisible(true)}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.text} 
            colors={[colors.text]}
          />
        }
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* ═══ HERO VIDEO ═══ */}
        <View style={{ position: 'relative' }}>
          <HeroVideo source={heroVideoSrc} />
          {showHeroText && (
            <View style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 100 }]} pointerEvents="none">
              <Typography size={46} color="#fff" style={{ textAlign: 'center', textTransform: 'uppercase', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 8, fontFamily: 'Rocaston', lineHeight: 46 }}>{heroTitle}</Typography>
              {heroSubtitle ? (
                <Typography size={10} color="#fff" weight="400" style={{ textAlign: 'center', textTransform: 'uppercase', letterSpacing: 4, marginTop: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 4 }}>{heroSubtitle}</Typography>
              ) : null}
            </View>
          )}
        </View>

        {/* ═══ CONTENT BELOW HERO ═══ */}
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {loading && products.length === 0 && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.textExtraLight} />
            </View>
          )}

          {!loading && (products.length === 0 || error) && (
            <View style={styles.errorContainer}>
              <Typography size={10} color={colors.textSecondary} style={styles.errorText}>
                {error || "Unable to load products. Please check your connection."}
              </Typography>
              <TouchableOpacity onPress={refetch} style={[styles.retryBtn, { borderColor: colors.borderLight }]}>
                <Typography size={9} color={colors.text} weight="600" style={styles.retryText}>RETRY</Typography>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.sectionHeader}>
            <View style={styles.headerLeft}>
              <Typography size={7} color={colors.textExtraLight} weight="300" style={styles.sectionTag}>{latestCurationSubtitle}</Typography>
            </View>
            <View style={styles.headerCenter}>
              <Typography size={8} color={colors.text} weight="600" style={styles.sectionTitle}>{latestCurationTitle}</Typography>
            </View>
            <TouchableOpacity style={styles.headerRight} onPress={() => navigation.navigate('SearchTab')}>
              <Typography size={6.5} color={colors.textExtraLight} weight="400">VIEW ALL</Typography>
            </TouchableOpacity>
          </View>
          
          <View style={styles.gridContainer}>
            {products.slice(0, 4).map((product) => (
              <View key={product.id} style={styles.gridItem}>
                <ProductCard product={product} onQuickAdd={handleQuickAdd} />
              </View>
            ))}
          </View>

          {/* ═══ RING COLLECTION CAROUSEL ═══ */}
          <RingCarouselSection 
            title={ringTitle} 
            products={accessories.length > 0 ? accessories : products.slice(12, 20)} 
          />

          {/* ═══ FLIPBOOK SECTION ═══ */}
          <FlipbookSection />

          <View style={styles.collectionsSection}>
            <View style={styles.archiveLabel}>
              <Typography size={8} color={colors.textExtraLight} weight="300" style={styles.archiveLabelText}>— THE WARDROBE —</Typography>
            </View>

            <CollectionCarousel collections={collections} />

            <View style={styles.archiveLabel}>
              <Typography size={7} color={colors.textExtraLight} weight="300" style={styles.archiveSubtext}>SUSTAINABLE EVOLUTION</Typography>
            </View>
          </View>

          {/* ═══ PRODUCT GRID 2 ═══ */}
          {renderProductGrid(products.slice(4, 8))}

          {/* ═══ SPOTLIGHT SECTION ═══ */}
          <SpotlightSection 
            collectionHandle="dystra-summer26" 
            title="AUTHENTIC STREETWEAR" 
            subtitle="Luxury Indian streetwear for modern men." 
          />

          {/* ═══ PRODUCT GRID 3 ═══ */}
          {products.length > 12 && renderProductGrid(products.slice(12, 16))}

          {/* ═══ COMMUNITY SECTION ═══ */}
          <CommunitySection />

          {/* ═══ PRODUCT GRID 4 ═══ */}
          {products.length > 16 && renderProductGrid(products.slice(16, 20))}

          {/* ═══ FOOTER ═══ */}
          <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
            <Typography heading size={13} color={colors.textMuted} style={styles.footerBrand}>ZICA BELLA</Typography>
            <Typography size={7.5} color={colors.textExtraLight} weight="300" style={styles.footerTag}>LUXURY INDIAN STREETWEAR</Typography>

            <View style={styles.policyLinks}>
              {[
                { label: 'Privacy Policy', url: config.policies.privacy },
                { label: 'Refund Policy', url: config.policies.refund },
                { label: 'Shipping Policy', url: config.policies.shipping },
                { label: 'Terms of Service', url: config.policies.terms },
              ].map((policy) => (
                <TouchableOpacity
                  key={policy.label}
                  onPress={() => navigation.navigate('Policy', { url: policy.url, title: policy.label })}
                >
                  <Typography size={8} color={colors.textMuted} weight="300" style={styles.policyLink}>{policy.label}</Typography>
                </TouchableOpacity>
              ))}
            </View>

            <Typography size={7} color={colors.textExtraLight} weight="300" style={styles.copyright}>© 2024 Zica Bella. All rights reserved.</Typography>
          </View>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 120 + insets.bottom }} />
      </ScrollView>

      {/* Drawers */}
      <MenuDrawer 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
      />
      <BookmarkDrawer 
        visible={bookmarksVisible} 
        onClose={() => setBookmarksVisible(false)} 
      />

      {/* Quick Add Modal */}
      <QuickAddModal 
        visible={modalVisible}
        product={selectedProduct}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 0,
    paddingTop: 32,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8, // Reduced for minimalism
    marginTop: 8, // Reduced for minimalism
    height: 32, // More compact
    position: 'relative',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Ensure it's on top
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    zIndex: 2,
  },
  sectionTag: {
    fontSize: 6, // Smaller tag
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  sectionTitle: {
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 2,
  },
  viewAllText: {
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '300',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 2,
    gap: 2,
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '49.6%', // Beautiful minimal sliver of gap in center
    marginBottom: 6,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    gap: 4,
  },
  gridItem: {
    width: (width - 12) / 2, // 4px padding each side + 4px gap = 12px
    marginBottom: 8,
  },
  collectionsSection: {
    paddingVertical: 32,
    marginHorizontal: 0,
  },
  archiveLabel: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  archiveLabelText: {
    fontSize: 8.5,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 8,
  },
  archiveSubtext: {
    fontSize: 7.5,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 5,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
    marginTop: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 5,
    marginBottom: 6,
  },
  footerTag: {
    fontSize: 8,
    fontWeight: '300',
    letterSpacing: 3,
    marginBottom: 32,
  },
  policyLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  policyLink: {
    fontSize: 8,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  copyright: {
    fontSize: 7,
    fontWeight: '300',
    letterSpacing: 1,
  },
  loadingContainer: {
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    paddingVertical: 100,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
    lineHeight: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
