import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { formatPrice } from '../utils/formatPrice';
import { FlatProduct } from '../api/types';
import { haptics } from '../utils/haptics';
import { BlurView } from 'expo-blur';
import { Typography } from './Typography';

const { width } = Dimensions.get('window');

interface Props {
  product: FlatProduct;
  onQuickAdd?: (product: FlatProduct) => void;
  style?: any;
}

export default function ProductCard({ product, onQuickAdd, style }: Props) {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const theme = useThemeStore(state => state.theme);
  const isDark = theme === 'dark';
  const [isLoading, setIsLoading] = React.useState(false);

  const handlePress = () => {
    navigation.navigate('ProductDetail', { handle: product.handle });
  };

  const handleQuickAdd = async () => {
    if (!onQuickAdd) return;
    setIsLoading(true);
    haptics.buttonTap();
    // Simulate a brief loading state for "premium" feel
    await new Promise(resolve => setTimeout(resolve, 400));
    onQuickAdd(product);
    setIsLoading(false);
  };

  return (
    <View
      style={[
        styles.container,
        product.isSoldOut && styles.soldOut,
        style,
        isDark
          ? {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: StyleSheet.hairlineWidth,
            }
          : {
              backgroundColor: '#FFFFFF',
              borderWidth: 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            },
      ]}
    >
      {/* Dark mode: true black-glass. Light mode: clean white card. */}
      {isDark ? (
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
      
      {/* Badges */}
      <View style={styles.badgeContainer}>
        {product.isSoldOut ? (
          <View style={[styles.soldOutBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)' }]}>
            <Text style={[styles.soldOutText, { color: isDark ? '#000' : '#FFF' }]}>Sold Out</Text>
          </View>
        ) : product.isOnSale ? (
          <View style={styles.saleBadge}>
            <Text style={styles.saleText}>Sale</Text>
          </View>
        ) : null}
      </View>

      {/* Image - Flush with top/sides */}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={styles.imageTapArea}>
        <Image
          source={{ uri: product.featuredImage || undefined }}
          style={[
            styles.image,
            product.isSoldOut && { opacity: 0.6 },
          ]}
          contentFit="cover"
          transition={300}
        />
        
        {/* Floating Quick Add Button Overlay */}
        {!product.isSoldOut && onQuickAdd && (
          <TouchableOpacity
            onPress={handleQuickAdd}
            style={styles.floatingAddButton}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <BlurView intensity={isDark ? 50 : 80} tint={isDark ? 'dark' : 'light'} style={styles.floatingAddBlur}>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Ionicons name="add" size={16} color={colors.text} />
              )}
            </BlurView>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Info row */}
      <View style={styles.infoRow}>
        <View style={styles.textContainer}>
          <Typography size={5.5} weight="500" color={colors.text} numberOfLines={1} style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {product.title}
          </Typography>
          <View style={styles.priceRow}>
            <Typography size={7} weight="500" color={colors.textSecondary} style={product.isOnSale ? { color: colors.sale } : undefined}>
              {formatPrice(product.price)}
            </Typography>
            {product.isOnSale && product.compareAtPrice && (
              <Typography size={6} weight="300" color={colors.textExtraLight} style={{ textDecorationLine: 'line-through' }}>
                {formatPrice(product.compareAtPrice)}
              </Typography>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  soldOut: {
    opacity: 0.8,
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  soldOutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldOutText: {
    fontSize: 7,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  saleBadge: {
    backgroundColor: '#FF453A', // System red
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saleText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  imageTapArea: {
    width: '100%',
    aspectRatio: 3 / 4.6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  textContainer: {
    flex: 1,
    marginRight: 6,
    gap: 2,
  },
  title: {
    fontSize: 8,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 9,
    fontWeight: '300',
    letterSpacing: 1,
  },
  comparePrice: {
    fontSize: 8,
    fontWeight: '300',
    letterSpacing: 0.5,
    textDecorationLine: 'line-through',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingAddBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
