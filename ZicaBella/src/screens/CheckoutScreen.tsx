import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useColors } from '../constants/colors';
import { config } from '../constants/config';
import { formatPrice } from '../utils/formatPrice';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../hooks/useAuth';

type Address = {
  name: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

const fields = [
  'Full name',
  'Phone number',
  'Address line 1',
  'Address line 2 (optional)',
  'City',
  'State',
  'Pincode',
] as const;

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();

  const cartItems = useCartStore((s) => s.items);
  const cartTotal = useCartStore((s) => s.total());
  const clearCart = useCartStore((s) => s.clearCart);

  const codFee = 99;
  const subtotal = cartTotal;
  const { user, updateUser } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('ONLINE');

  const [address, setAddress] = useState<Address>({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
  } as any);

  const shippingOk = useMemo(() => {
    const required: (keyof Address)[] = ['name', 'phone', 'address1', 'city', 'state', 'zip'];
    return required.every((k) => String(address[k] ?? '').trim().length > 0);
  }, [address]);

  const handleValidateShipping = () => {
    if (!shippingOk) {
      Alert.alert('Missing details', 'Please fill all required delivery fields.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
    return true;
  };

  const completeShopifyCheckout = async (payment?: any) => {
    const res = await fetch(`${config.appUrl}/api/checkout/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: {
          name: address.name,
          phone: address.phone,
          email: (address as any).email,
          street: address.address1,
          city: address.city,
          state: address.state,
          zip: address.zip,
          country: address.country,
        },
        paymentMethod: paymentMethod === 'COD' ? 'COD' : 'UPI',
        items: cartItems.map((i) => ({
          id: i.id,
          productId: i.productId,
          title: i.title,
          quantity: i.quantity,
          variantId: i.variantId,
          price: i.price,
        })),
        total: paymentMethod === 'COD' ? cartTotal + codFee : cartTotal,
        subtotal,
        codFee: paymentMethod === 'COD' ? codFee : 0,
        razorpay: payment,
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Checkout failed');
    return json.orderId as string;
  };

  const handlePay = async () => {
    try {
      if (!shippingOk) {
        Alert.alert('Missing details', 'Please complete the delivery form first.');
        return;
      }

      setLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      if (paymentMethod === 'COD') {
        const orderId = await completeShopifyCheckout();
        
        // Update local user record
        updateUser({
          name: address.name,
          phone: address.phone,
          email: (address as any).email,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clearCart();
        navigation.replace('OrderConfirmation', { orderId });
        return;
      }

      const amountPaise = Math.round(cartTotal * 100);

      let RazorpayCheckout: any;
      try {
        RazorpayCheckout = require('react-native-razorpay').default;
      } catch (e) {
        Alert.alert('Payment unavailable', 'Razorpay is not available in this environment. Use a native build.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      const paymentData = await RazorpayCheckout.open({
        description: 'Zica Bella Order',
        currency: 'INR',
        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: amountPaise,
        name: 'ZICA BELLA',
        prefill: { contact: address.phone, name: address.name, email: (address as any).email },
        theme: { color: '#000000' },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const orderId = await completeShopifyCheckout(paymentData);
      
      // Update local user record
      updateUser({
        name: address.name,
        phone: address.phone,
        email: (address as any).email,
      });

      clearCart();
      navigation.replace('OrderConfirmation', { orderId });
    } catch (err: any) {
      if (err?.code === 2) {
        // User cancelled
        return;
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Payment Failed', err.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const inputBg = colors.surface;

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: colors.surface }]}>
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={[styles.titleTag, { color: colors.textLight }]}>Checkout</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Step {step}/3
          </Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.progress}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              s <= step
                ? [styles.progressActive, { backgroundColor: colors.foreground }]
                : [styles.progressInactive, { backgroundColor: colors.borderLight }],
            ]}
          />
        ))}
      </View>

      {step === 1 && (
        <View style={styles.form}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Delivery</Text>
          <Text style={[styles.formSub, { color: colors.textMuted }]}>Where should we send your pieces?</Text>

          <TextInput
            value={address.name}
            onChangeText={(v) => setAddress((a) => ({ ...a, name: v }))}
            placeholder="Full name"
            placeholderTextColor={colors.textExtraLight}
            style={[styles.input, { backgroundColor: inputBg, color: colors.text }]}
          />
          <TextInput
            value={address.phone}
            onChangeText={(v) => setAddress((a) => ({ ...a, phone: v }))}
            placeholder="Phone number"
            placeholderTextColor={colors.textExtraLight}
            style={[styles.input, { backgroundColor: inputBg, color: colors.text }]}
            keyboardType="phone-pad"
          />
          <TextInput
            value={address.address1}
            onChangeText={(v) => setAddress((a) => ({ ...a, address1: v }))}
            placeholder="Address line 1"
            placeholderTextColor={colors.textExtraLight}
            style={[styles.input, { backgroundColor: inputBg, color: colors.text }]}
          />
          <TextInput
            value={address.address2 ?? ''}
            onChangeText={(v) => setAddress((a) => ({ ...a, address2: v }))}
            placeholder="Address line 2 (optional)"
            placeholderTextColor={colors.textExtraLight}
            style={[styles.input, { backgroundColor: inputBg, color: colors.text }]}
          />
          <TextInput
            value={address.city}
            onChangeText={(v) => setAddress((a) => ({ ...a, city: v }))}
            placeholder="City"
            placeholderTextColor={colors.textExtraLight}
            style={[styles.input, { backgroundColor: inputBg, color: colors.text }]}
          />
          <TextInput
            value={address.state}
            onChangeText={(v) => setAddress((a) => ({ ...a, state: v }))}
            placeholder="State"
            placeholderTextColor={colors.textExtraLight}
            style={[styles.input, { backgroundColor: inputBg, color: colors.text }]}
          />
          <TextInput
            value={(address as any).email}
            onChangeText={(v) => setAddress((a) => ({ ...a, email: v } as any))}
            placeholder="Email address"
            placeholderTextColor={colors.textExtraLight}
            style={[styles.input, { backgroundColor: inputBg, color: colors.text }]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            value={address.zip}
            onChangeText={(v) => setAddress((a) => ({ ...a, zip: v }))}
            placeholder="Pincode"
            placeholderTextColor={colors.textExtraLight}
            style={[styles.input, { backgroundColor: inputBg, color: colors.text }]}
            keyboardType="number-pad"
          />

          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: colors.foreground }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (handleValidateShipping()) setStep(2);
            }}
            activeOpacity={0.85}
          >
            <Text style={[styles.ctaText, { color: colors.background }]}>Review Order</Text>
          </TouchableOpacity>

          <View style={styles.noteRow}>
            <Text style={[styles.noteText, { color: colors.textMuted }]}>
              {fields[0]} • {fields[1]} • {fields[4]} • {fields[5]} • {fields[6]}
            </Text>
          </View>
        </View>
      )}

      {step === 2 && (
        <View style={styles.form}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Review</Text>
          <Text style={[styles.formSub, { color: colors.textMuted }]}>Confirm your delivery details.</Text>

          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DELIVERY</Text>
            <Text style={[styles.summaryLine, { color: colors.text }]}>{address.name}</Text>
            <Text style={[styles.summaryLine, { color: colors.text }]}>{address.phone}</Text>
            <Text style={[styles.summaryLine, { color: colors.text }]}>
              {address.address1}
              {address.address2 ? `, ${address.address2}` : ''}
            </Text>
            <Text style={[styles.summaryLine, { color: colors.text }]}>
              {address.city}, {address.state} {address.zip}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Subtotal</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Shipping</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>Free</Text>
            </View>
            {paymentMethod === 'COD' && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>COD Fee</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{formatPrice(codFee)}</Text>
              </View>
            )}
            <View style={[styles.divider, { backgroundColor: colors.borderExtraLight }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>
                {formatPrice(paymentMethod === 'COD' ? subtotal + codFee : subtotal)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: colors.foreground }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setStep(3);
            }}
            activeOpacity={0.85}
          >
            <Text style={[styles.ctaText, { color: colors.background }]}>Pay with Razorpay</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 3 && (
        <View style={styles.form}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Payment</Text>
          <Text style={[styles.formSub, { color: colors.textMuted }]}>Select how you'd like to pay.</Text>

          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                { backgroundColor: colors.surface, borderColor: paymentMethod === 'ONLINE' ? colors.foreground : colors.borderLight }
              ]}
              onPress={() => setPaymentMethod('ONLINE')}
            >
              <View style={[styles.radio, { borderColor: colors.borderLight }]}>
                {paymentMethod === 'ONLINE' && <View style={[styles.radioDot, { backgroundColor: colors.foreground }]} />}
              </View>
              <View>
                <Text style={[styles.paymentLabel, { color: colors.text }]}>Online Payment</Text>
                <Text style={[styles.paymentSub, { color: colors.textMuted }]}>Razorpay • UPI, Card, Netbanking</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                { backgroundColor: colors.surface, borderColor: paymentMethod === 'COD' ? colors.foreground : colors.borderLight }
              ]}
              onPress={() => setPaymentMethod('COD')}
            >
              <View style={[styles.radio, { borderColor: colors.borderLight }]}>
                {paymentMethod === 'COD' && <View style={[styles.radioDot, { backgroundColor: colors.foreground }]} />}
              </View>
              <View>
                <Text style={[styles.paymentLabel, { color: colors.text }]}>Cash on Delivery</Text>
                <Text style={[styles.paymentSub, { color: colors.textMuted }]}>Pay ₹99 extra for COD delivery</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: colors.foreground }]}
            onPress={handlePay}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.ctaText, { color: colors.background }]}>
                {paymentMethod === 'COD' ? 'Place Order' : `Pay ${formatPrice(subtotal)}`}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.secureText, { color: colors.textExtraLight }]}>Secure Checkout</Text>
        </View>
      )}

      <View style={{ height: 40 + insets.bottom }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  back: { width: 56, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 12, fontWeight: '600' },
  titleTag: { fontSize: 7, fontWeight: '200', textTransform: 'uppercase', letterSpacing: 4.4 },
  title: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginTop: 2 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 },
  progressDot: { height: 4, borderRadius: 2 },
  progressActive: { width: 26 },
  progressInactive: { width: 10 },
  form: { gap: 12 },
  formTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  formSub: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  input: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, fontSize: 13, marginTop: 4 },
  ctaButton: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 12 },
  ctaText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
  summaryCard: { padding: 18, borderRadius: 16, borderWidth: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 13, fontWeight: '500' },
  summaryValue: { fontSize: 13, fontWeight: '600' },
  divider: { height: 1, marginVertical: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 },
  summaryLine: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  totalLabel: { fontSize: 13, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  secureText: { textAlign: 'center', fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginTop: 16 },
  noteRow: { marginTop: 4 },
  noteText: { fontSize: 11, fontWeight: '400', lineHeight: 16 },
  paymentOptions: { gap: 12, marginTop: 8 },
  paymentOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1.5,
    gap: 16 
  },
  paymentLabel: { fontSize: 13, fontWeight: '700' },
  paymentSub: { fontSize: 10, fontWeight: '400', marginTop: 2 },
  radio: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    borderWidth: 2, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
});
