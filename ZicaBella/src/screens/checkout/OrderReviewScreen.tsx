import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../constants/colors';
import { Typography } from '../../components/Typography';
import CheckoutSummaryBar from '../../components/CheckoutSummaryBar';
import { useCartStore } from '../../store/cartStore';
import { formatPrice } from '../../utils/formatPrice';
import { haptics } from '../../utils/haptics';
import { config } from '../../constants/config';
import { useAuth } from '../../hooks/useAuth';

export default function OrderReviewScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const { total, items, clearCart } = useCartStore();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);

  const subtotal = total();
  const shipping = 0;
  const grandTotal = subtotal + shipping;

  const handlePlaceOrder = async () => {
    setLoading(true);
    haptics.buttonTap();

    try {
      // API call to /api/orders
      const res = await fetch(`${config.appUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user?.id,
          customerName: user?.name,
          customerEmail: user?.email,
          items: items.map(i => ({ 
            id: i.id, 
            productId: i.productId, 
            quantity: i.quantity, 
            price: i.price,
            title: i.title,
            image: i.image,
            variantId: i.variantId
          })),
          total: grandTotal,
          subtotal: subtotal,
          shippingAddress: {
            // In a real app, these would come from the previous step state
            street: '12B Archive Street',
            city: 'New Delhi',
            zip: '110001',
            country: 'India'
          },
          paymentStatus: 'PAID',
          paymentMethod: 'STRIPE'
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to place order');

      haptics.success();
      clearCart();
      navigation.reset({
        index: 0,
        routes: [{ name: 'OrderConfirmation', params: { orderId: json.order_id || 'ZB-89241' } }],
      });
    } catch (e: any) {
      haptics.error();
      Alert.alert('Order Failed', e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: colors.surface }]}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Typography size={7} color={colors.textExtraLight} weight="600" style={styles.stepTag}>STEP 5 OF 5</Typography>
          <Typography size={14} color={colors.text} weight="700">REVIEW ORDER</Typography>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Typography size={22} weight="700" color={colors.text} style={styles.title}>Final glance before dispatch.</Typography>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography size={7} weight="700" color={colors.textExtraLight} style={styles.sectionLabel}>DELIVERY</Typography>
            <TouchableOpacity onPress={() => navigation.navigate('DeliveryAddress')}><Typography size={7} weight="600" color={colors.foreground}>EDIT</Typography></TouchableOpacity>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
             <Typography size={12} weight="600" color={colors.text}>{user?.name}</Typography>
             <Typography size={10} color={colors.textSecondary} style={{ marginTop: 4 }}>12B Archive Street, New Delhi, 110001, India</Typography>
             <Typography size={10} color={colors.textSecondary} style={{ marginTop: 4 }}>{user?.phone || '+91 91100 00000'}</Typography>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography size={7} weight="700" color={colors.textExtraLight} style={styles.sectionLabel}>PAYMENT</Typography>
            <TouchableOpacity onPress={() => navigation.navigate('Payment')}><Typography size={7} weight="600" color={colors.foreground}>EDIT</Typography></TouchableOpacity>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight, flexDirection: 'row', alignItems: 'center' }]}>
             <Ionicons name="logo-apple" size={20} color={colors.text} />
             <Typography size={12} weight="600" color={colors.text} style={{ marginLeft: 12 }}>APPLE PAY</Typography>
          </View>
        </View>

        <View style={styles.section}>
          <Typography size={7} weight="700" color={colors.textExtraLight} style={styles.sectionLabel}>SUMMARY</Typography>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
             <View style={styles.row}>
               <Typography size={12} color={colors.textSecondary}>Subtotal</Typography>
               <Typography size={12} weight="600" color={colors.text}>{formatPrice(subtotal)}</Typography>
             </View>
             <View style={styles.row}>
               <Typography size={12} color={colors.textSecondary}>Shipping</Typography>
               <Typography size={12} weight="600" color={colors.success}>FREE</Typography>
             </View>
             <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
             <View style={styles.row}>
               <Typography size={14} weight="700" color={colors.text}>Estimated Total</Typography>
               <Typography size={18} weight="800" color={colors.text}>{formatPrice(grandTotal)}</Typography>
             </View>
          </View>
        </View>

        <View style={styles.legalBox}>
          <Typography size={8} color={colors.textMuted} style={{ textAlign: 'center', lineHeight: 14 }}>
            By placing this order, you authorize Zica Bella to charge your payment method and agree to our Refund Policy.
          </Typography>
        </View>
      </ScrollView>

      {/* Summary Bar */}
      <CheckoutSummaryBar 
        itemCount={items.length}
        total={grandTotal}
        primaryLabel={loading ? "PLACING ORDER..." : "PLACE ORDER"}
        onPrimaryPress={handlePlaceOrder}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  back: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { alignItems: 'center' },
  stepTag: { letterSpacing: 2, marginBottom: 2 },
  scroll: { paddingHorizontal: 24, paddingTop: 20 },
  title: { letterSpacing: -0.5, marginBottom: 32 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { letterSpacing: 2 },
  card: { padding: 24, borderRadius: 28, borderWidth: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  divider: { height: 1, marginVertical: 12 },
  legalBox: { marginTop: 12, paddingHorizontal: 20 },
});
