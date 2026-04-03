import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { useCollectionByHandle } from '../hooks/useProducts';
import { RootStackParamList } from '../navigation/RootNavigator';
import ProductCard from '../components/ProductCard';
import GlassHeader from '../components/GlassHeader';
import CollectionFilters from '../components/CollectionFilters';
import QuickAddModal from '../components/QuickAddModal';
import { useUIStore } from '../store/uiStore';
import { FlatProduct } from '../api/types';


export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'Collection'>>();
  const { handle } = route.params;
  const colors = useColors();
  const theme = useThemeStore(state => state.theme);
  const isDark = theme === 'dark';

  const { collection, products, loading, refetch } = useCollectionByHandle(handle);
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'large' | 'list'>('grid');

  const [selectedProduct, setSelectedProduct] = useState<FlatProduct | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleQuickAdd = useCallback((product: FlatProduct) => {
    setSelectedProduct(product);
    setModalVisible(true);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const setTabBarVisible = useUIStore(s => s.setTabBarVisible);
  const isTabBarVisible = useUIStore(s => s.isTabBarVisible);
  const lastScrollY = useRef(0);

  const onScroll = (event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;
    
    if (Math.abs(diff) > 5) {
      if (diff > 0 && currentY > 100) {
        setTabBarVisible(false);
      } else {
        setTabBarVisible(true);
      }
    }
    lastScrollY.current = currentY;
  };

  const { width: screenWidth } = Dimensions.get('window');


  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.textExtraLight} />
      </View>
    );
  }

  // Extract all unique sizes
  const allSizes = Array.from(new Set(
    products.flatMap(p => p.variants.map(v => v.size).filter(s => s && s !== 'Default Title'))
  )).sort();

  // Filter and Sort Logic
  let filteredProducts = [...products];
  if (selectedSize) {
    filteredProducts = filteredProducts.filter(p => 
      p.variants.some(v => v.size === selectedSize)
    );
  }

  if (sortBy === 'newest') {
    filteredProducts.sort((a, b) => b.id.localeCompare(a.id));
  } else if (sortBy === 'price-asc') {
    filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  } else if (sortBy === 'price-desc') {
    filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  }

  const toggleView = () => {
    const modes: ('grid' | 'large' | 'list')[] = ['grid', 'large', 'list'];
    setViewMode(modes[(modes.indexOf(viewMode) + 1) % modes.length]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader title={collection?.title || 'Collection'} showBack={true} hideRightIsland={!isTabBarVisible} />
      
      <ScrollView
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={isDark ? '#FFF' : '#000'} 
            progressViewOffset={insets.top + 50} 
          />
        }
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View style={{ height: insets.top + 60 }} />
        
        {/* Filters Sticky Section */}
        <View style={[styles.filterSection, { backgroundColor: colors.background }]}>
          <CollectionFilters 
            allSizes={allSizes as string[]}
            selectedSize={selectedSize}
            onSelectSize={setSelectedSize}
            sortBy={sortBy}
            onSelectSort={setSortBy}
            viewMode={viewMode}
            onToggleView={toggleView}
            isTabBarVisible={isTabBarVisible}
          />
        </View>

        <View style={styles.content}>
          <Text style={[styles.count, { color: colors.textExtraLight }]}>{filteredProducts.length} Products</Text>
          <View style={[
            styles.grid,
            viewMode === 'list' && styles.listGrid
          ]}>
            {filteredProducts.map((p) => (
              <View 
                key={p.id} 
                style={[
                  styles.cardWrapper,
                  viewMode === 'grid' && styles.gridWrapper,
                  viewMode === 'large' && styles.largeWrapper,
                  viewMode === 'list' && styles.listWrapper
                ]}
              >
                <ProductCard 
                  product={p} 
                  onQuickAdd={handleQuickAdd}
                  style={(viewMode === 'large' || viewMode === 'list') ? { width: '100%' } : undefined}
                />
              </View>
            ))}
          </View>
          <View style={{ height: 160 + insets.bottom }} />
        </View>
      </ScrollView>

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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    paddingTop: 10,
  },
  content: {
    paddingHorizontal: 0,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  count: {
    fontSize: 8,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 20,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 1,
  },
  listGrid: {
    flexDirection: 'column',
  },
  cardWrapper: {
    marginBottom: 16,
  },
  gridWrapper: {
    width: (Math.min(Dimensions.get('window').width, 600) - 3) / 2,
  },
  largeWrapper: {
    width: '100%',
  },
  listWrapper: {
    width: '100%',
  },
});
