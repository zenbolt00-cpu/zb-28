import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { RootStackParamList } from '../navigation/RootNavigator';

export default function OrderConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'OrderConfirmation'>>();
  const { orderId } = route.params;
  const isDark = useThemeStore(s => s.theme) === 'dark';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, backgroundColor: colors.background }]}>
      <View style={[styles.checkCircle, { backgroundColor: isDark ? 'rgba(52,199,89,0.2)' : 'rgba(52,199,89,0.1)' }]}>
        <Ionicons name="checkmark" size={48} color={colors.success} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Order Placed!</Text>
      <Text style={[styles.orderId, { color: colors.textMuted }]}>Order #{orderId}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Thank you for your purchase.{'\n'}You'll receive a confirmation shortly.</Text>
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.foreground }]} 
        onPress={() => navigation.navigate('Main')} 
        activeOpacity={0.85}
      >
        <Text style={[styles.buttonText, { color: colors.background }]}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  checkCircle: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  orderId: { fontSize: 12, fontWeight: '500', letterSpacing: 1, marginBottom: 16 },
  subtitle: { fontSize: 13, fontWeight: '300', textAlign: 'center', lineHeight: 20, marginBottom: 40 },
  button: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  buttonText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
});
