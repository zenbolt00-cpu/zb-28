import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../constants/colors';
import { Typography } from '../../components/Typography';
import CheckoutSummaryBar from '../../components/CheckoutSummaryBar';
import { useCartStore } from '../../store/cartStore';
import { haptics } from '../../utils/haptics';

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const { total, items } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'google' | 'cod'>('apple');

  const methods = [
    { id: 'apple', title: 'APPLE PAY', icon: 'logo-apple', subtitle: 'SECURE ONE-TAP PAYMENT' },
    { id: 'card', title: 'CREDIT / DEBIT CARD', icon: 'card-outline', subtitle: 'POWERED BY STRIPE' },
    { id: 'cod', title: 'CASH ON DELIVERY', icon: 'cash-outline', subtitle: '₹99 EXTRA SERVICE FEE' },
  ];

  const currentTotal = total() + (paymentMethod === 'cod' ? 99 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: colors.surface }]}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Typography size={7} color={colors.textExtraLight} weight="600" style={styles.stepTag}>STEP 4 OF 5</Typography>
          <Typography size={14} color={colors.text} weight="700">PAYMENT METHOD</Typography>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Typography size={22} weight="700" color={colors.text} style={styles.title}>Secure your archival pieces.</Typography>

        <View style={styles.options}>
          {methods.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.optionCard,
                { 
                  backgroundColor: colors.surface, 
                  borderColor: paymentMethod === m.id ? colors.foreground : colors.borderLight 
                }
              ]}
              onPress={() => { haptics.buttonTap(); setPaymentMethod(m.id as any); }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                <Ionicons 
                  name={m.icon as any} 
                  size={20} 
                  color={paymentMethod === m.id ? colors.foreground : colors.textMuted} 
                />
              </View>
              
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Typography size={10} weight="700" color={colors.text}>{m.title}</Typography>
                <Typography size={7} weight="600" color={colors.textExtraLight} style={{ marginTop: 4, letterSpacing: 1 }}>{m.subtitle}</Typography>
              </View>

              <View style={[styles.radio, { borderColor: colors.borderLight }]}>
                {paymentMethod === m.id && <View style={[styles.radioDot, { backgroundColor: colors.foreground }]} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {paymentMethod === 'card' && (
          <View style={[styles.cardForm, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Typography size={7} weight="700" color={colors.textExtraLight} style={{ marginBottom: 16, letterSpacing: 2 }}>STRIPE SECURE INPUT</Typography>
            <View style={[styles.placeholderInput, { borderColor: colors.borderLight }]}>
              <Typography size={12} color={colors.textExtraLight}>0000 0000 0000 0000</Typography>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <View style={[styles.placeholderInput, { flex: 1, borderColor: colors.borderLight }]}>
                <Typography size={12} color={colors.textExtraLight}>MM / YY</Typography>
              </View>
              <View style={[styles.placeholderInput, { width: 100, borderColor: colors.borderLight }]}>
                <Typography size={12} color={colors.textExtraLight}>CVC</Typography>
              </View>
            </View>
          </View>
        )}

        <View style={styles.secureBadge}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.success} />
          <Typography size={7} weight="700" color={colors.textExtraLight} style={{ marginLeft: 6, letterSpacing: 2 }}>ENCRYPTED SECURE PAYMENT</Typography>
        </View>
      </ScrollView>

      {/* Summary Bar */}
      <CheckoutSummaryBar 
        itemCount={items.length}
        total={currentTotal}
        primaryLabel="REVIEW ORDER"
        onPrimaryPress={() => navigation.navigate('OrderReview')}
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
  options: { gap: 12 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  cardForm: { padding: 24, borderRadius: 28, borderWidth: 1, marginTop: 20 },
  placeholderInput: { height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 20, justifyContent: 'center' },
  secureBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, opacity: 0.7 }
});
