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
  const { settings } = useAdminSettings();
  const shopData = settings?.shop || settings || {};

  const resolvedTitle = title || settings?.spotlight?.title || "AUTHENTIC STREETWEAR";
  const rawSubtitle =
    subtitle ||
    settings?.spotlight?.subtitle ||
    "Luxury Indian streetwear for modern men.|Redefining bold everyday style.";
  const subtitleParts = rawSubtitle.split("|").map((s: string) => s.trim()).filter(Boolean);
  const subtitleLine1 = subtitleParts[0] || "";
  const subtitleLine2 = subtitleParts[1] || "";
  const resolvedCollectionHandle = collectionHandle || settings?.spotlight?.collection || "tshirts";

  const { products, loading } = useCollectionByHandle(resolvedCollectionHandle);
  const theme = useThemeStore(s => s.theme);
  const isDark = theme === 'dark';

  if (loading && products.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonHeader} />
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.skeletonItem} />
          ))}
        </View>
      </View>
    );
  }

  const displayProducts = products.slice(0, 6);

  // Split title for stacked typographic effect
  const words = resolvedTitle.split(' ');
  const firstWord = words[0];
  const remainingWords = words.slice(1).join(' ');

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => navigation.navigate('Collection', { handle: resolvedCollectionHandle, title: resolvedTitle })}
        activeOpacity={0.7}
      >
        <Typography rocaston size={48} color={colors.text} style={styles.titleTop}>{firstWord}</Typography>
        {remainingWords ? <Typography rocaston size={44} color={colors.text} style={styles.titleBottom}>{remainingWords}</Typography> : null}
        <Typography size={8} color="rgba(160,160,160,0.55)" weight="300" style={styles.subtitleLine}>
          {subtitleLine1}
        </Typography>
        {subtitleLine2 ? (
          <Typography size={8} color="rgba(160,160,160,0.45)" weight="300" style={styles.subtitleLine2}>
            {subtitleLine2}
          </Typography>
        ) : null}
      </TouchableOpacity>

      <View style={styles.grid}>
        {displayProducts.map((product) => (
          <TouchableOpacity 
            key={product.id}
            style={styles.item}
            onPress={() => navigation.navigate('ProductDetail', { handle: product.handle })}
            activeOpacity={0.8}
          >
            <View style={styles.imageShadowContainer}>
              <View style={[styles.imageContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
                <Image 
                  source={{ uri: product.featuredImage || undefined }} 
                  style={styles.image}
                  contentFit="cover"
                  transition={400}
                />
              </View>
            </View>
            <Typography heading size={8} color={colors.textSecondary} style={styles.itemTitle} numberOfLines={1}>{product.title}</Typography>
          </TouchableOpacity>
        ))}
        {/* Fill empty slots if less than 6 products */}
        {displayProducts.length < 6 && [...Array(6 - displayProducts.length)].map((_, i) => (
          <View key={`empty-${i}`} style={styles.item}>
             <View style={styles.imageShadowContainer}>
               <View style={[styles.imageContainer, styles.emptyImage, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                  <Typography size={6} color={colors.textLight} style={styles.emptyText}>ZB Studio</Typography>
               </View>
             </View>
             <Typography size={8} color={colors.textSecondary} style={styles.itemTitle}>ZICA BELLA</Typography>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 64,
    marginBottom: 60,
    paddingHorizontal: GRID_PADDING,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleTop: {
    fontFamily: 'Rocaston',
    fontSize: 48,
    fontWeight: '400', // Rocaston is typically used at its base weight
    letterSpacing: -1,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 46,
    zIndex: 2,
  },
  titleBottom: {
    fontFamily: 'Rocaston',
    fontSize: 44,
    fontWeight: '400',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 42,
    marginTop: 0,
    marginBottom: 24,
  },
  subtitleLine: {
    fontSize: 8,
    fontWeight: '300',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 18,
    marginTop: 4,
  },
  subtitleLine2: {
    fontSize: 8,
    fontWeight: '300',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 18,
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_SPACING,
    justifyContent: 'flex-start',
  },
  item: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    marginBottom: 32,
  },
  imageShadowContainer: {
    width: ITEM_WIDTH,
    aspectRatio: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 6,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emptyImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 6,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  itemTitle: {
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  skeletonHeader: {
    height: 60,
    width: 240,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignSelf: 'center',
    marginBottom: 48,
    borderRadius: 8,
  },
  skeletonItem: {
    width: ITEM_WIDTH,
    aspectRatio: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 26,
    marginBottom: 32,
  },
});
