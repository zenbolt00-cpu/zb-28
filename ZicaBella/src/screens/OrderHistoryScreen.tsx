import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, RefreshControl, FlatList, AppState, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import GlassHeader from '../components/GlassHeader';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { config } from '../constants/config';
import { formatPrice } from '../utils/formatPrice';
import { haptics } from '../utils/haptics';
import { Typography } from '../components/Typography';
import { OrderSkeleton } from '../components/OrderSkeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_SIZE = 20;

type OrderTab = 'ACTIVE' | 'PAST' | 'CANCELLED' | 'RETURNS';

export default function OrderHistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const theme = useThemeStore(s => s.theme);
  const isDark = theme === 'dark';
  const { user } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderTab>('ACTIVE');
  const offsetRef = useRef(0);

  useEffect(() => {
    if (activeTab === 'RETURNS') {
      navigation.navigate('ServiceFlow', { screen: 'ServiceHistory' });
      // Reset tab to ACTIVE so user doesn't stay on a dummy tab
      setActiveTab('ACTIVE');
    }
  }, [activeTab, navigation]);

  const fetchOrders = useCallback(async (mode: 'reset' | 'more' = 'reset') => {
    if (activeTab === 'RETURNS') return;
    try {
      if (!user?.id) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.set('user_id', user.id);
      params.set('limit', String(PAGE_SIZE));
      const nextOffset = mode === 'more' ? offsetRef.current : 0;
      params.set('offset', String(nextOffset));

      const token = useAuthStore.getState().token;
      const res = await fetch(`${config.appUrl}/api/orders?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch');

      const incoming = json.orders || [];
      if (mode === 'more') {
        setOrders(prev => [...prev, ...incoming]);
      } else {
        setOrders(incoming);
      }
      offsetRef.current = nextOffset + incoming.length;
      setHasMore(incoming.length === PAGE_SIZE);
    } catch (err: any) {
      console.error('Fetch Orders:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [user?.id, activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders('reset');
    }, [fetchOrders])
  );

  const onRefresh = useCallback(() => {
    haptics.buttonTap();
    setRefreshing(true);
    fetchOrders('reset');
  }, [fetchOrders]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || refreshing) return;
    setLoadingMore(true);
    fetchOrders('more');
  }, [loadingMore, hasMore, refreshing, fetchOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const status = (o.status || '').toUpperCase();
      const delStatus = (o.deliveryStatus || '').toUpperCase();
      
      if (activeTab === 'CANCELLED') return status === 'CANCELLED';
      if (activeTab === 'PAST') return delStatus === 'DELIVERED';
      // Active: Not Delivered, Not Cancelled
      return status !== 'CANCELLED' && delStatus !== 'DELIVERED';
    });
  }, [orders, activeTab]);

  const getStatusStyle = (order: any) => {
    const s = (order.status || '').toUpperCase();
    const d = (order.deliveryStatus || '').toUpperCase();
    
    if (s === 'CANCELLED') return { color: colors.error, label: 'CANCELLED' };
    if (d === 'DELIVERED') return { color: colors.success, label: 'DELIVERED' };
    if (d === 'OUT_FOR_SERVICE' || d === 'OUT_FOR_DELIVERY') return { color: '#FF9500', label: 'OUT FOR DELIVERY' };
    if (d === 'SHIPPED') return { color: '#A855F7', label: 'SHIPPED' };
    if (s === 'PACKED') return { color: colors.warning, label: 'PACKED' };
    return { color: colors.iosBlue, label: 'CONFIRMED' };
  };

  const renderOrder = ({ item: order }: { item: any }) => {
    const { color, label } = getStatusStyle(order);
    
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('OrderDetail', { orderForDetail: order })}
        style={[styles.orderCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', borderColor: colors.borderLight }]}
      >
        <View style={styles.cardHeader}>
          <View>
            <Typography size={10} weight="700" color={colors.text}>ORDER #{order.orderNumber}</Typography>
            <Typography size={7} color={colors.textExtraLight} style={{ marginTop: 4 }}>
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
            </Typography>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: color + '15' }]}>
            <Typography size={7} weight="700" color={color}>{label}</Typography>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.thumbRow}>
            {order.items?.slice(0, 3).map((item: any, idx: number) => (
              <View key={item.id} style={[styles.thumb, { borderColor: colors.background, marginLeft: idx > 0 ? -12 : 0, zIndex: 10 - idx }]}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="shirt-outline" size={12} color={colors.textExtraLight} />
                  </View>
                )}
              </View>
            ))}
            {order.items?.length > 3 && (
              <View style={[styles.thumb, { backgroundColor: colors.surface, borderColor: colors.background, marginLeft: -12, zIndex: 0 }]}>
                <Typography size={7} weight="600" color={colors.textMuted}>+{order.items.length - 3}</Typography>
              </View>
            )}
          </View>
          <Typography size={13} weight="800" color={colors.text}>{formatPrice(order.totalPrice || order.total || 0)}</Typography>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader title="YOUR ORDERS" showBack />
      
      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.borderExtraLight }]}>
        {(['ACTIVE', 'PAST', 'CANCELLED', 'RETURNS'] as OrderTab[]).map(tab => (
          <TouchableOpacity 
            key={tab} 
            onPress={() => { haptics.buttonTap(); setActiveTab(tab); }}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.foreground }]}
          >
            <Typography size={8} weight="700" color={activeTab === tab ? colors.text : colors.textExtraLight}>
              {tab === 'RETURNS' ? 'RETURNS' : tab}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4].map(i => <OrderSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={renderOrder}
          getItemLayout={(data, index) => (
            {length: 120, offset: 120 * index, index} // Appx fixed height of orderCard + padding
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.foreground} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={colors.textExtraLight} />
              <Typography size={10} color={colors.textMuted} style={{ marginTop: 20 }}>NO {activeTab} ORDERS FOUND</Typography>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 20 }}><OrderSkeleton /></View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: 'row', paddingTop: 100, borderBottomWidth: 1, paddingHorizontal: 10 },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  listContent: { padding: 20 },
  orderCard: { padding: 24, borderRadius: 28, borderWidth: 1, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  thumbRow: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 48, height: 48, borderRadius: 16, borderWidth: 2, overflow: 'hidden' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120 },
});
