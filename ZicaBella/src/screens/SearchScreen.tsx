import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, colors as staticColors } from '../constants/colors';
import { config } from '../constants/config';
import { useSearchProducts, useCollections } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import { useRecentStore } from '../store/recentStore';
import { useThemeStore } from '../store/themeStore';
import { useUIStore } from '../store/uiStore';
import GlassHeader from '../components/GlassHeader';
import { Typography } from '../components/Typography';

const { width } = Dimensions.get('window');

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const [query, setQuery] = useState('');
  const { results, loading, search } = useSearchProducts();
  const { collections, loading: collectionsLoading, refetch } = useCollections(20, 'menu');
  const { recentProducts } = useRecentStore();
  const theme = useThemeStore(state => state.theme);
  const isDark = theme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(text);
    }, 300);
  }, [search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    if (query) await search(query);
    setRefreshing(false);
  }, [refetch, search, query]);

  const setTabBarVisible = useUIStore(s => s.setTabBarVisible);
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

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
      }
      keyboardShouldPersistTaps="handled"
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {/* ── Search Bar ── */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={16} color={colors.textExtraLight} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={handleSearch}
          placeholder="Search Zica Bella…"
          placeholderTextColor={colors.textExtraLight}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); search(''); }} style={styles.clearButton}>
          <Typography weight="300" size={8} color="rgba(5,5,6,0.4)" style={styles.clearText}>Clear</Typography>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Results header ── */}
      {query.length > 0 && (
        <View style={styles.resultsHeader}>
          <Typography weight="300" size={10} color="rgba(5,5,6,0.8)" style={styles.queryLabel}>"{query}"</Typography>
          <Typography weight="300" size={8} color="rgba(5,5,6,0.4)" style={styles.countLabel}>
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </Typography>
        </View>
      )}

      {/* ── Search Results ── */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.text} />
        </View>
      )}

      {query.length > 0 && results.length > 0 && (
        <View style={styles.productGrid}>
          {results.map((product) => (
            <View key={product.id} style={styles.cardWrapper}>
              <ProductCard product={product} />
            </View>
          ))}
        </View>
      )}

      {query.length > 0 && !loading && results.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="search-outline" size={20} color={colors.textExtraLight} />
          </View>
          <Typography heading weight="300" size={11} color="rgba(5,5,6,0.5)" style={styles.emptyTitle}>No results for "{query}"</Typography>
          <Typography weight="300" size={9} color="rgba(5,5,6,0.3)" style={styles.emptySubtitle}>Try a different term or browse below</Typography>
        </View>
      )}

      {/* ── Empty state: trending + collections ── */}
      {query.length === 0 && (
        <>
          {/* Trending */}
          <View style={styles.section}>
            <Typography weight="300" size={7} color="rgba(5,5,6,0.4)" style={styles.sectionLabel}>Trending</Typography>
            <View style={styles.trendingContainer}>
              {config.trending.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={styles.trendingPill}
                  onPress={() => handleSearch(term)}
                  activeOpacity={0.7}
                >
                  <Typography weight="300" size={9} color="rgba(5,5,6,0.6)" style={styles.trendingText}>{term}</Typography>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recently Viewed */}
          {recentProducts.length > 0 && (
            <View style={styles.section}>
              <Typography weight="300" size={7} color="rgba(5,5,6,0.4)" style={styles.sectionLabel}>Recently Viewed</Typography>
              <View style={styles.productGrid}>
                {recentProducts.slice(0, 4).map((product) => (
                  <View key={product.id} style={styles.cardWrapper}>
                    <ProductCard product={product} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Collections */}
          {collections.length > 0 && (
            <View style={styles.section}>
              <Typography weight="400" size={7} color={colors.textExtraLight} style={styles.sectionLabel}>COLLECTIONS</Typography>
              {collections.slice(0, 10).map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.collectionRow}
                  onPress={() => navigation.navigate('Collection', { handle: c.handle })}
                  activeOpacity={0.7}
                >
                  <Typography heading weight="400" size={11} color={colors.text} style={styles.collectionTitle}>{c.title}</Typography>
                  <Ionicons name="chevron-forward" size={14} color={colors.textExtraLight} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      <View style={{ height: 160 + insets.bottom }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.05)',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(128,128,128,0.1)',
    marginBottom: 24,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: staticColors.text,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearText: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(5,5,6,0.4)',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  queryLabel: {
    fontSize: 10,
    fontWeight: '300',
    color: 'rgba(5,5,6,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  countLabel: {
    fontSize: 8,
    color: 'rgba(5,5,6,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '300',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 32,
  },
  cardWrapper: {
    width: (width - 32 - 12) / 2,
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  emptyTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: 'rgba(5,5,6,0.5)',
    fontWeight: '300',
  },
  emptySubtitle: {
    fontSize: 9,
    color: 'rgba(5,5,6,0.3)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '300',
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 7,
    fontWeight: '300',
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: 'rgba(5,5,6,0.4)',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  trendingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
  },
  trendingPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  trendingText: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(5,5,6,0.6)',
    fontWeight: '300',
  },
  collectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 20,
  },
  collectionTitle: {
    fontSize: 12,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(5,5,6,0.7)',
  },
});
