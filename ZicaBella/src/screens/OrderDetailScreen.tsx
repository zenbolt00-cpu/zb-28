import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Animated, ScrollView, ActivityIndicator, Linking, Share
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassHeader from '../components/GlassHeader';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { formatPrice } from '../utils/formatPrice';
import { RootStackParamList } from '../navigation/types';
import { haptics } from '../utils/haptics';
import { config } from '../constants/config';
import { useAuthStore } from '../store/authStore';
import { Typography } from '../components/Typography';
import { TrackingStepper } from '../components/TrackingStepper';

let MapView: any;
let Marker: any;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} catch (e) {
  console.warn('react-native-maps not installed. Map will be hidden.');
}

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>();
  const { orderForDetail } = route.params;
  const colors = useColors();
  const theme = useThemeStore(s => s.theme);
  const isDark = theme === 'dark';

  const [order, setOrder] = useState<any>(orderForDetail);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchOrderDetails = useCallback(async (isPolling = false) => {
    if (!order?.id) return;
    try {
      if (!isPolling) setLoading(true);
      const token = useAuthStore.getState().token;
      const res = await fetch(`${config.appUrl}/api/orders/${order.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (res.ok && json.order) {
        setOrder(json.order);
      }
    } catch (e) {
      console.error('Fetch Order Detail Error:', e);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [order?.id]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    fetchOrderDetails();

    const interval = setInterval(() => {
      fetchOrderDetails(true);
    }, 60000); // 60s polling
    return () => clearInterval(interval);
  }, [fadeAnim, fetchOrderDetails]);

  const copyTracking = async () => {
    if (!order.trackingNumber) return;
    await Share.share({ message: order.trackingNumber });
    haptics.success();
  };

  const contactSupport = () => {
    haptics.buttonTap();
    Linking.openURL(config.contactPage);
  };

  if (!order) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader title={`#${order.orderNumber}`} showBack />

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Typography size={10} color={colors.textMuted} style={{ marginBottom: 24 }}>
          PLACED {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
        </Typography>

        {/* Live Stepper Section */}
        <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', borderColor: colors.borderLight }]}>
          <TrackingStepper currentStatus={order.deliveryStatus || order.status} timestamps={order.timeline} />
        </View>

        {/* Tracking ID Copy Section */}
        {order.trackingNumber && (
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={copyTracking}
            style={[styles.trackingBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
          >
            <Ionicons name="cube-outline" size={16} color={colors.text} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Typography size={7} weight="700" color={colors.textExtraLight}>TRACKING NUMBER</Typography>
              <Typography size={9} weight="700" color={colors.text} style={{ marginTop: 2 }}>{order.trackingNumber}</Typography>
            </View>
            <View style={[styles.copyPill, { backgroundColor: colors.foreground }]}>
              <Typography size={7} weight="800" color={colors.background}>COPY</Typography>
            </View>
          </TouchableOpacity>
        )}

        {/* Map View Integration */}
        {MapView && (order.courierLat || order.deliveryLat) && (
          <View style={[styles.mapContainer, { borderColor: colors.borderLight }]}>
            <MapView
              style={StyleSheet.absoluteFill}
              initialRegion={{
                latitude: order.courierLat || order.deliveryLat || 0,
                longitude: order.courierLng || order.deliveryLng || 0,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              customMapStyle={isDark ? mapDarkStyle : []}
            >
              {order.courierLat && (
                <Marker coordinate={{ latitude: order.courierLat, longitude: order.courierLng }}>
                  <View style={[styles.marker, { backgroundColor: colors.iosBlue }]}>
                    <Ionicons name="bicycle" size={12} color="#fff" />
                  </View>
                </Marker>
              )}
              {order.deliveryLat && (
                <Marker coordinate={{ latitude: order.deliveryLat, longitude: order.deliveryLng }}>
                  <View style={[styles.marker, { backgroundColor: colors.success }]}>
                    <Ionicons name="home" size={12} color="#fff" />
                  </View>
                </Marker>
              )}
            </MapView>
          </View>
        )}

        {/* Items List */}
        <Typography size={9} weight="800" color={colors.textMuted} style={styles.sectionTitle}>ORDER ITEMS</Typography>
        <View style={styles.itemList}>
          {order.items?.map((item: any) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={[styles.itemThumb, { backgroundColor: colors.surface }]}>
                {item.image ? (
                  <Animated.Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} />
                ) : (
                  <Ionicons name="shirt-outline" size={16} color={colors.textExtraLight} />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Typography size={10} weight="600" color={colors.text} numberOfLines={1}>{item.title}</Typography>
                <Typography size={8} color={colors.textExtraLight} style={{ marginTop: 2 }}>SIZE: {item.size || 'M'} · QTY: {item.quantity}</Typography>
              </View>
              <Typography size={10} weight="700" color={colors.text}>{formatPrice(item.price * item.quantity)}</Typography>
            </View>
          ))}
        </View>

        {/* Address */}
        <Typography size={9} weight="800" color={colors.textMuted} style={styles.sectionTitle}>DELIVERY ADDRESS</Typography>
        <View style={[styles.card, { padding: 20, backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Typography size={10} weight="600" color={colors.text}>{order.shippingAddress?.name}</Typography>
          <Typography size={9} color={colors.textSecondary} style={{ marginTop: 8, lineHeight: 16 }}>
            {order.shippingAddress?.address1}, {order.shippingAddress?.city}{'\n'}
            {order.shippingAddress?.province}, {order.shippingAddress?.zip}
          </Typography>
        </View>

        <View style={styles.totalBlock}>
          <View style={styles.priceRow}>
            <Typography size={10} color={colors.textExtraLight}>Subtotal</Typography>
            <Typography size={10} color={colors.textMuted}>{formatPrice(order.subtotalPrice || order.totalPrice)}</Typography>
          </View>
          <View style={styles.priceRow}>
            <Typography size={10} color={colors.textExtraLight}>Shipping</Typography>
            <Typography size={10} color={colors.success}>FREE</Typography>
          </View>
          <View style={[styles.priceRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderExtraLight }]}>
            <Typography size={11} weight="800" color={colors.text}>Order Total</Typography>
            <Typography size={14} weight="800" color={colors.text}>{formatPrice(order.totalPrice)}</Typography>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Floating Action Buttons */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.borderLight }]} onPress={contactSupport}>
            <Typography size={8} weight="800" color={colors.text}>SUPPORT</Typography>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.primaryActionBtn, { backgroundColor: colors.foreground }]} 
            onPress={() => navigation.navigate('ServiceFlow', { screen: 'ReturnWizard', params: { orderId: order.id } })}
          >
            <Typography size={8} weight="800" color={colors.background}>RETURN / EXCHANGE</Typography>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator color="#fff" />
        </View>
      )}
    </View>
  );
}

const mapDarkStyle = [
  {"elementType": "geometry", "stylers": [{"color": "#212121"}]},
  {"elementType": "labels.text.fill", "stylers": [{"color": "#757575"}]},
  {"elementType": "labels.text.stroke", "stylers": [{"color": "#212121"}]},
  {"featureType": "water", "elementType": "geometry", "stylers": [{"color": "#000000"}]}
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  card: { padding: 14, borderRadius: 24, borderWidth: 1, marginBottom: 20 },
  trackingBar: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 24 },
  copyPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  mapContainer: { height: 180, borderRadius: 24, overflow: 'hidden', borderWidth: 1, marginBottom: 24 },
  marker: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  sectionTitle: { marginBottom: 14, letterSpacing: 1.5 },
  itemList: { gap: 16, marginBottom: 24 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemThumb: { width: 56, height: 56, borderRadius: 18, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  totalBlock: { marginTop: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 10, backgroundColor: 'transparent' },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, height: 50, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  primaryActionBtn: { flex: 2, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }
});
