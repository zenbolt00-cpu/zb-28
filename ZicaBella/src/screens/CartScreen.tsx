import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/colors';
import { formatPrice } from '../utils/formatPrice';
import { useCart } from '../hooks/useCart';
import CartItem from '../components/CartItem';
import { useUIStore } from '../store/uiStore';
import { Typography } from '../components/Typography';
import { useRef } from 'react';


export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const { items, total, count, update, remove, clear } = useCart();

  const isTabBarVisible = useUIStore(s => s.isTabBarVisible);
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

  const discounts = 0;
  const totalAfterDiscount = useMemo(() => total - discounts, [total, discounts]);

  const handleCheckout = useCallback(() => {
    navigation.navigate('Checkout');
  }, [navigation]);

  const handleGoHome = useCallback(() => {
    navigation.navigate('HomeTab' as never);
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom, backgroundColor: colors.background }]}>
      {/* Page Title */}
      <View style={styles.titleContainer}>
        <Typography size={7} weight="300" color={colors.textLight} style={styles.titleTag}>YOUR</Typography>
        <View style={styles.titleRow}>
          <Typography heading size={14} color={colors.text} style={styles.title}>CART</Typography>
          {count > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.borderLight }]}>
              <Typography size={8} weight="600" color={colors.textMuted}>{count}</Typography>
            </View>
          )}
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bag-outline" size={56} color={colors.borderLight} />
          <Text style={[styles.emptyTitle, { color: colors.textLight }]}>Your Cart is Empty</Text>
          <TouchableOpacity style={[styles.emptyCta, { backgroundColor: colors.foreground }]} onPress={handleGoHome} activeOpacity={0.9}>
            <Text style={[styles.emptyCtaText, { color: colors.background }]}>SHOP NOW</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CartItem
                item={item}
                onUpdateQuantity={update}
                onRemove={remove}
                onPress={() => navigation.navigate('ProductDetail', { handle: item.handle })}
              />
            )}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            onScroll={onScroll}
            scrollEventThrottle={16}
          />


          {/* Bottom: order summary + sticky checkout */}
          <View style={[
            styles.bottom, 
            { paddingBottom: isTabBarVisible ? 94 : 12 }
          ]}>
            <View style={[styles.summaryCard, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
              <View style={styles.summaryRow}>
                <Typography size={8} weight="300" color={colors.textMuted} style={styles.summaryLabel}>SUBTOTAL</Typography>
                <Typography size={9} weight="600" color={colors.text}>{formatPrice(total)}</Typography>
              </View>
              <View style={styles.summaryRow}>
                <Typography size={8} weight="300" color={colors.textMuted} style={styles.summaryLabel}>DISCOUNTS</Typography>
                <Typography size={8} weight="300" color={colors.textLight}>{formatPrice(-discounts)}</Typography>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.borderExtraLight }]} />
              <View style={styles.summaryRow}>
                <Typography size={10} weight="600" color={colors.text} style={styles.totalLabel}>TOTAL</Typography>
                <Typography size={11} weight="700" color={colors.text}>{formatPrice(totalAfterDiscount)}</Typography>
              </View>
            </View>

            <TouchableOpacity style={[styles.checkoutButton, { backgroundColor: colors.foreground }]} onPress={handleCheckout} activeOpacity={0.95}>
              <Typography size={9} weight="700" color={colors.background} style={styles.checkoutText}>Proceed to Checkout</Typography>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Alert.alert('Clear Cart', 'Remove all items?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: clear },
                ])
              }
            >
              <Text style={[styles.clearText, { color: colors.textLight }]}>Clear Cart</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  titleContainer: {
    marginBottom: 24,
  },
  titleTag: {
    fontSize: 7,
    fontWeight: '200',
    textTransform: 'uppercase',
    letterSpacing: 4.4,
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countText: {
    fontSize: 8,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  emptyCta: {
    marginTop: 10,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyCtaText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: 14,
  },
  list: {
    flex: 1,
  },
  bottom: {
    paddingTop: 12,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: '200',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
  },
  shippingText: {
    fontSize: 8,
    fontWeight: '200',
  },
  divider: {
    height: 0.5,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  checkoutButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  checkoutText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2.8,
  },
  clearText: {
    textAlign: 'center',
    fontSize: 8,
    fontWeight: '200',
    textTransform: 'uppercase',
    letterSpacing: 3,
    paddingVertical: 10,
  },
});
