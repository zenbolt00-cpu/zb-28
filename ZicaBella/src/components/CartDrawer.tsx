import React, { useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  Dimensions, Pressable, FlatList, ActivityIndicator
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useCartStore } from '../store/cartStore';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { formatPrice } from '../utils/formatPrice';
import CartItem from './CartItem';
import { Typography } from './Typography';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.9, 380);

interface Props {
  visible: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ visible, onClose, onCheckout }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const theme = useThemeStore(state => state.theme);
  const isDark = theme === 'dark';
  const { items, total, updateQuantity, removeItem, itemCount } = useCartStore();

  const translateX = useSharedValue(DRAWER_WIDTH);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateX.value = withSpring(0, { damping: 30, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 250 });
      translateX.value = withTiming(DRAWER_WIDTH, { duration: 250 });
    }
  }, [visible]);

  const animatedDrawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Modal visible={visible} transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            <BlurView intensity={isDark ? 30 : 20} tint={isDark ? 'dark' : 'default'} style={StyleSheet.absoluteFill} />
          </Pressable>
        </Animated.View>

        <Animated.View style={[
          styles.drawer, 
          animatedDrawerStyle,
          { 
            backgroundColor: isDark ? 'rgba(8, 8, 8, 0.72)' : 'rgba(255, 255, 255, 0.72)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            top: insets.top + 12,
            bottom: insets.bottom + 12,
          }
        ]}>
          <BlurView intensity={isDark ? 80 : 100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="bag-outline" size={14} color={colors.textExtraLight} style={{ opacity: 0.6 }} />
              <Typography rocaston size={10} weight="400" color={colors.textSecondary} style={styles.drawerTitle}>ZICA BELLA</Typography>
              {itemCount() > 0 && (
                <View style={[styles.countBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                  <Typography size={8} weight="600" color={colors.textExtraLight}>{itemCount()}</Typography>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Ionicons name="close" size={16} color={colors.textExtraLight} />
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bag-outline" size={40} color={colors.textExtraLight} style={{ opacity: 0.1 }} />
              <Typography size={9} weight="400" color={colors.textExtraLight} style={styles.emptyText}>YOUR BAG IS EMPTY</Typography>
              <TouchableOpacity onPress={onClose} style={styles.shopBtn}>
                <Typography size={8} weight="600" color={colors.textSecondary} style={styles.shopBtnText}>START SHOPPING</Typography>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.itemWrapper}>
                    <CartItem 
                      item={item} 
                      onUpdateQuantity={(id, q) => updateQuantity(id, q)}
                      onRemove={(id) => removeItem(id)}
                      onPress={() => {
                        onClose();
                        setTimeout(() => navigation.navigate('ProductDetail', { handle: item.handle }), 300);
                      }}
                    />
                  </View>
                )}
              />

              <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={[styles.footerBlur, { backgroundColor: isDark ? 'rgba(8, 8, 8, 0.3)' : 'rgba(255, 255, 255, 0.3)' }]}>
                  <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                  
                  <View style={styles.totalRow}>
                    <Typography size={8} weight="200" color={colors.textExtraLight} style={styles.totalLabel}>ESTIMATED TOTAL</Typography>
                    <Typography size={16} weight="400" color={colors.textSecondary}>{formatPrice(total())}</Typography>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.checkoutBtn, { backgroundColor: colors.text }]} 
                    onPress={onCheckout}
                    activeOpacity={0.9}
                  >
                    <Typography size={9} weight="700" color={colors.background} style={styles.checkoutBtnText}>CHECKOUT</Typography>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  drawer: {
    position: 'absolute',
    right: 12,
    width: DRAWER_WIDTH,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: -20, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 80,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drawerTitle: {
    letterSpacing: 4,
    opacity: 0.8,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 160,
  },
  itemWrapper: {
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    letterSpacing: 4,
    opacity: 0.4,
    marginTop: 16,
    marginBottom: 24,
  },
  shopBtn: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 2,
  },
  shopBtnText: {
    letterSpacing: 3,
    opacity: 0.6,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  footerBlur: {
    padding: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    letterSpacing: 3,
  },
  checkoutBtn: {
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  checkoutBtnText: {
    letterSpacing: 5,
  },
});

