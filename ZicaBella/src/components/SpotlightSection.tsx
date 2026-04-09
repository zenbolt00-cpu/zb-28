import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useCollectionByHandle } from '../hooks/useProducts';
import { useColors } from '../constants/colors';
import { useAdminSettings } from '../hooks/useAdminFeatures';
import { Typography } from './Typography';
import { useThemeStore } from '../store/themeStore';

const { width } = Dimensions.get('window');
const GRID_PADDING = 8; // Reduced for bigger cards
const GRID_SPACING = 4; // Reduced for tighter grid
const ITEM_WIDTH = (width - (GRID_PADDING * 2) - (GRID_SPACING * 2)) / 3;

interface Props {
  title?: string;
  subtitle?: string;
  collectionHandle?: string;
}

export default function SpotlightSection({ 
  title,
  subtitle,
  collectionHandle
}: Props) {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const theme = useThemeStore(state => state.theme);
  const isDark = theme === 'dark';
  const { settings } = useAdminSettings();

  const resolvedTitle = title || settings?.spotlight?.title || "AUTHENTIC STREETWEAR";
  const resolvedSubtitle = subtitle || settings?.spotlight?.subtitle || "Luxury Indian streetwear for modern men. Redefining bold everyday style.";
  const resolvedCollectionHandle = collectionHandle || settings?.spotlight?.collection || "tshirts";

  const { products, loading } = useCollectionByHandle(resolvedCollectionHandle);

  if (loading && products.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonHeader} />
        <View style={styles.grid}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonItem} />
          ))}
        </View>
      </View>
    );
  }

  const displayProducts = products.slice(0, 6);

  return (
    <View style={styles.container}>
      {/* Centered Header - Parity with web */}
      <View style={styles.header}>
        <Typography size={18} weight="600" color={colors.text} style={styles.title} numberOfLines={1}>
          {resolvedTitle.toUpperCase()}
        </Typography>
        <Typography size={7.5} color={colors.textExtraLight} weight="300" style={styles.subtitle} numberOfLines={2}>
          {resolvedSubtitle.toUpperCase()}
        </Typography>
      </View>

      {/* Grid - 3 columns, 3/4 aspect ratio */}
      <View style={styles.grid}>
        {(displayProducts.length > 0 ? displayProducts : Array(3).fill(null)).map((product, idx) => (
          <TouchableOpacity 
            key={product?.id || idx}
            style={styles.item}
            onPress={() => product && navigation.navigate('ProductDetail', { handle: product.handle })}
            activeOpacity={0.8}
          >
            <View style={[styles.imageContainer, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
              {product ? (
                <Image 
                  source={{ uri: product.featuredImage }} 
                  style={styles.image}
                  contentFit="cover"
                  transition={500}
                />
              ) : (
                <View style={styles.emptyImage}>
                  <Typography size={6} color={colors.textExtraLight} style={{ letterSpacing: 2 }}>ZB STUDIO</Typography>
                </View>
              )}
            </View>
            <View style={styles.itemInfo}>
              <Typography size={7} weight="700" color={colors.textLight} numberOfLines={1} style={styles.itemTitle}>
                {(product?.title || "ZICA BELLA").toUpperCase()}
              </Typography>
              <View style={[styles.titleLine, { backgroundColor: colors.borderLight }]} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 64,
    marginBottom: 60,
    paddingHorizontal: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    letterSpacing: 4,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    letterSpacing: 2.2,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 14,
    opacity: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  item: {
    width: (width - 24 - 16) / 3, // 3 columns
    alignItems: 'center',
    marginBottom: 24,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 4, // Matches web spotlight
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: 'rgba(128,128,128,0.02)',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emptyImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  itemTitle: {
    letterSpacing: 1.5,
    opacity: 0.8,
  },
  titleLine: {
    width: 0, // Animates on web, we can leave as 0 for now or fixed width
    height: 1,
  },
  skeletonHeader: {
    height: 40,
    width: 200,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignSelf: 'center',
    marginBottom: 32,
    borderRadius: 8,
  },
  skeletonItem: {
    width: (width - 24 - 16) / 3,
    aspectRatio: 3 / 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
  },
});

