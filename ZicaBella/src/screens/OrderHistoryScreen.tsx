import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { config } from '../constants/config';
import { formatPrice } from '../utils/formatPrice';

export default function OrderHistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const { user } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      if (!user?.phone && !user?.email) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const res = await fetch(`${config.appUrl}/api/orders/history?phone=${user?.phone || ''}&email=${user?.email || ''}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch orders');
      setOrders(json.orders || []);
    } catch (err: any) {
      console.error('Fetch Orders:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleReturnExchange = (order: any, type: 'RETURN' | 'EXCHANGE') => {
    Alert.alert(
      `${type === 'RETURN' ? 'Return' : 'Exchange'} Piece`,
      `Would you like to request a ${type === 'RETURN' ? 'return' : 'exchange'} for an item in this order?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request', 
          onPress: async () => {
            try {
              const res = await fetch(`${config.appUrl}/api/orders/${type.toLowerCase()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: order.id,
                  customerId: order.customerId,
                  productId: order.items[0]?.productId, // Simplified for now
                  originalProductId: order.items[0]?.productId,
                  newProductId: order.items[0]?.productId, // For exchange, user would pick new one
                  reason: 'Customer requested via app'
                })
              });
              if (res.ok) {
                 Alert.alert('Success', `Your ${type.toLowerCase()} request has been submitted and synced with our dashboard.`);
              } else {
                 throw new Error('Failed to submit request');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          } 
        }
      ]
    );
  };

  const renderOrder = (order: any) => {
    const isOutForDelivery = order.deliveryStatus === 'out_for_delivery';
    const isDelivered = order.deliveryStatus === 'delivered';

    return (
      <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={[styles.orderId, { color: colors.text }]}>Order #{order.shopifyOrderId}</Text>
            <Text style={[styles.orderDate, { color: colors.textMuted }]}>
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isOutForDelivery ? colors.success + '20' : colors.borderLight }]}>
             {isOutForDelivery && <View style={[styles.liveIndicator, { backgroundColor: colors.success }]} />}
             <Text style={[styles.statusText, { color: isOutForDelivery ? colors.success : colors.textSecondary }]}>
               {order.deliveryStatus.toUpperCase().replace(/_/g, ' ')}
             </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderExtraLight }]} />

        {order.items.map((item: any) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.itemQty, { color: colors.textMuted }]}>QTY: {item.quantity}</Text>
            <Text style={[styles.itemPrice, { color: colors.text }]}>{formatPrice(item.price)}</Text>
          </View>
        ))}

        <View style={[styles.divider, { backgroundColor: colors.borderExtraLight }]} />

        <View style={styles.orderFooter}>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>TOTAL PAID</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>{formatPrice(order.totalPrice)}</Text>
        </View>

        {isDelivered && (
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => handleReturnExchange(order, 'RETURN')} style={[styles.actionBtn, { borderColor: colors.borderLight }]}>
               <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>RETURN</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleReturnExchange(order, 'EXCHANGE')} style={[styles.actionBtn, { borderColor: colors.borderLight }]}>
               <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>EXCHANGE</Text>
            </TouchableOpacity>
          </View>
        )}

        {isOutForDelivery && (
          <View style={[styles.deliveryNote, { backgroundColor: colors.success + '10' }]}>
            <Ionicons name="location-outline" size={14} color={colors.success} />
            <Text style={[styles.deliveryNoteText, { color: colors.success }]}>Out for delivery • Track live in WhatsApp community</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.foreground} />}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main')} 
          style={[styles.back, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Order History</Text>
        <TouchableOpacity onPress={onRefresh} style={[styles.refresh, { backgroundColor: colors.surface }]}>
          <Ionicons name="refresh" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.foreground} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={48} color={colors.borderLight} />
          <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No orders yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textExtraLight }]}>
            Start shopping to see your pieces archival in your history
          </Text>
          <TouchableOpacity
            style={[styles.shopButton, { backgroundColor: colors.foreground }]}
            onPress={() => navigation.navigate('Main')}
          >
            <Text style={[styles.shopButtonText, { color: colors.background }]}>BROWSE PIECES</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {orders.map(renderOrder)}
        </View>
      )}
      <View style={{ height: 100 + insets.bottom }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 16,
  },
  back: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  refresh: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 3 },
  loading: { paddingTop: 100 },
  list: { gap: 20 },
  orderCard: { padding: 18, borderRadius: 24, borderWidth: 1 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  orderDate: { fontSize: 10, fontWeight: '400', opacity: 0.8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
  liveIndicator: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  divider: { height: 1, marginVertical: 14, opacity: 0.5 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  itemTitle: { flex: 1, fontSize: 12, fontWeight: '400' },
  itemQty: { fontSize: 10, opacity: 0.6 },
  itemPrice: { fontSize: 12, fontWeight: '600' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  totalLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  totalValue: { fontSize: 15, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  actionBtnText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  deliveryNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginTop: 16 },
  deliveryNoteText: { fontSize: 10, fontWeight: '500' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  emptySubtitle: { fontSize: 11, fontWeight: '400', textAlign: 'center', maxWidth: 240, opacity: 0.8 },
  shopButton: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, marginTop: 12 },
  shopButtonText: { fontWeight: '700', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 },
});
