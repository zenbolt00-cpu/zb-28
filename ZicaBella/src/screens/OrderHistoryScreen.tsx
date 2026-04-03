import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Modal,
  TextInput,
  ScrollView,
  Linking,
  Dimensions,
  FlatList,
  AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import GlassHeader from '../components/GlassHeader';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { useAuth } from '../hooks/useAuth';
import { config } from '../constants/config';
import { formatPrice } from '../utils/formatPrice';
import { haptics } from '../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  lineItemId: string;
  title: string;
  quantity: number;
  price: number;
  sku: string | null;
  productId: string | null;
  image: string | null;
}

interface OrderReturn {
  id: string;
  productId: string;
  reason: string;
  status: string;
  requestedAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  deliveryStatus: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  courier: string | null;
  totalPrice: number;
  subtotalPrice: number | null;
  currency: string;
  note: string | null;
  paymentMethod: string | null;
  shippingAddress: any;
  items: OrderItem[];
  returns: OrderReturn[];
  exchanges: OrderExchange[];
}

interface OrderExchange {
  id: string;
  originalProductId: string;
  newProductId: string;
  status: string;
  priceDifference: number;
  createdAt: string;
}

interface ReturnItem {
  lineItemId: string;
  title: string;
  quantity: number;
  action: 'return' | 'exchange';
  reason: string;
  selected: boolean;
}

// ─── Status helpers ──────────────────────────────────────────────────

const PAGE_SIZE = 10;

function getStatusColor(order: Order, colors: any) {
  const label = getStatusLabel(order);
  if (label === 'Confirmed') return colors.iosBlue; // blue
  if (label === 'Processing') return colors.textExtraLight; // neutral
  if (label === 'Shipped' || label === 'Out for Delivery') return colors.warning; // amber
  if (label === 'Delivered') return colors.success; // green
  if (label === 'Cancelled') return colors.error; // red
  if (label === 'Return Requested' || label === 'Exchange Requested') return '#A855F7'; // purple
  return colors.textExtraLight;
}

function getStatusLabel(order: Order): string {
  const hasReturn = order.returns?.some((r) => r.status === 'REQUESTED' || r.status === 'APPROVED' || r.status === 'PROCESSING');
  const hasExchange = order.exchanges?.some((e) => e.status === 'REQUESTED' || e.status === 'APPROVED' || e.status === 'PROCESSING');
  if (hasReturn) return 'Return Requested';
  if (hasExchange) return 'Exchange Requested';
  const ds = order.deliveryStatus?.toLowerCase();
  if (ds === 'delivered') return 'Delivered';
  if (ds === 'out_for_delivery') return 'Out for Delivery';
  if (ds === 'in_transit' || ds === 'shipped') return 'Shipped';
  if (order.status === 'cancelled') return 'Cancelled';
  if (order.fulfillmentStatus?.toLowerCase() === 'fulfilled') return 'Shipped';
  if (order.paymentStatus === 'paid') return 'Confirmed';
  return 'Processing';
}

function norm(s: string | undefined) {
  return (s || '').toLowerCase().trim().replace(/\s+/g, '_');
}

function isEligibleForReturn(order: Order): boolean {
  if (order.status === 'cancelled' || order.deliveryStatus === 'cancelled') return false;
  
  const orderDate = new Date(order.createdAt);
  const diffDays = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

function showReturnInfoOnly(order: Order): boolean {
  const orderDate = new Date(order.createdAt);
  const diffDays = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 7;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const RETURN_REASONS = [
  'Size doesn\'t fit',
  'Color differs from images',
  'Quality not as expected',
  'Wrong item received',
  'Damaged during delivery',
  'Changed my mind',
  'Other',
];

// ─── Main Screen ─────────────────────────────────────────────────────

export default function OrderHistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const route = useRoute<RouteProp<RootStackParamList, 'OrderHistory'>>();

  // Return/Exchange modal state
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returnOrder, setReturnOrder] = useState<Order | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnNotes, setReturnNotes] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ─── Data fetching ──────────────────────────────────────────────

  const fetchOrders = useCallback(async (mode: 'reset' | 'more' = 'reset') => {
    try {
      if (!user?.phone && !user?.email) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (user?.id) params.set('customerId', user.id);
      if (user?.phone) params.set('phone', user.phone);
      if (user?.email) params.set('email', user.email);
      params.set('limit', String(PAGE_SIZE));
      const nextOffset = mode === 'more' ? offsetRef.current : 0;
      params.set('offset', String(nextOffset));

      const res = await fetch(`${config.appUrl}/api/app/orders?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch orders');
      const incoming: Order[] = json.orders || [];
      if (mode === 'more') {
        setOrders((prev) => [...prev, ...incoming]);
      } else {
        setOrders(incoming);
      }
      offsetRef.current = nextOffset + incoming.length;
      setHasMore(Boolean(json.page?.hasMore ?? (incoming.length === PAGE_SIZE)));
    } catch (err: any) {
      console.error('Fetch Orders:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [user?.phone, user?.email]);

  useFocusEffect(
    useCallback(() => {
      offsetRef.current = 0;
      setHasMore(true);
      fetchOrders('reset');
      const id = setInterval(() => {
        fetchOrders('reset');
      }, 22000);
      return () => clearInterval(id);
    }, [fetchOrders])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') fetchOrders('reset');
    });
    return () => sub.remove();
  }, [fetchOrders]);

  useEffect(() => {
    const openReturnFor = route.params?.openReturnFor;
    if (openReturnFor && orders.length > 0) {
      const targetOrder = orders.find(o => o.id === openReturnFor);
      if (targetOrder && isEligibleForReturn(targetOrder)) {
        openReturnModal(targetOrder);
        // Clear params after opening so it doesn't re-trigger
        navigation.setParams({ openReturnFor: undefined } as any);
      }
    }
  }, [route.params, orders]);

  const onRefresh = useCallback(() => {
    haptics.buttonTap();
    setRefreshing(true);
    offsetRef.current = 0;
    setHasMore(true);
    fetchOrders('reset');
  }, [fetchOrders]);

  const openOrderDetail = useCallback((order: Order) => {
    haptics.buttonTap();
    navigation.navigate('OrderDetail', { orderForDetail: order });
  }, [navigation]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading || refreshing || !hasMore) return;
    setLoadingMore(true);
    fetchOrders('more');
  }, [loadingMore, loading, refreshing, hasMore, fetchOrders]);

  // ─── Return modal ──────────────────────────────────────────────

  const openReturnModal = useCallback((order: Order) => {
    haptics.buttonTap();
    setReturnOrder(order);
    setReturnItems(
      order.items.map((item) => ({
        lineItemId: item.id,
        title: item.title,
        quantity: item.quantity,
        action: 'return',
        reason: '',
        selected: false,
      }))
    );
    setReturnNotes('');
    setReturnSuccess(false);
    setReturnModalVisible(true);
  }, []);

  const toggleReturnItemSelection = useCallback((idx: number) => {
    haptics.quantityChange();
    setReturnItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, selected: !item.selected } : item))
    );
  }, []);

  const setReturnItemAction = useCallback((idx: number, action: 'return' | 'exchange') => {
    haptics.quantityChange();
    setReturnItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, action } : item))
    );
  }, []);

  const setReturnItemReason = useCallback((idx: number, reason: string) => {
    setReturnItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, reason } : item))
    );
  }, []);

  const submitReturnRequest = useCallback(async () => {
    if (!returnOrder) return;

    const selectedItems = returnItems.filter((i) => i.selected);
    if (selectedItems.length === 0) return;

    const hasReasons = selectedItems.every((i) => i.reason.length > 0);
    if (!hasReasons) return;

    setSubmittingReturn(true);
    try {
      const res = await fetch(`${config.appUrl}/api/app/orders/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: returnOrder.id,
          items: selectedItems.map((i) => ({
            lineItemId: i.lineItemId,
            quantity: i.quantity,
            reason: i.reason,
            action: i.action,
          })),
          notes: returnNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit request');

      haptics.success();
      setReturnSuccess(true);
      fetchOrders();
    } catch (err: any) {
      haptics.error();
      console.error('Return request error:', err.message);
    } finally {
      setSubmittingReturn(false);
    }
  }, [returnOrder, returnItems, returnNotes, fetchOrders]);

  // ─── Order card ────────────────────────────────────────────────

  const renderOrder = useCallback(
    ({ item: order }: { item: Order }) => {
      const statusColor = getStatusColor(order, colors);
      const statusLabel = getStatusLabel(order);
      const returnInfo = showReturnInfoOnly(order);
      const hasActiveReturns = order.returns?.some(
        (r) => r.status === 'REQUESTED' || r.status === 'APPROVED' || r.status === 'PROCESSING'
      ) || order.exchanges?.some(
        (e) => e.status === 'REQUESTED' || e.status === 'APPROVED' || e.status === 'PROCESSING'
      );

      return (
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openOrderDetail(order)}
            style={[
              styles.orderCard,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: colors.borderLight,
                ...(isDark
                  ? {}
                  : {
                      borderWidth: 0,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      elevation: 2,
                    }),
              },
            ]}
          >
            {/* Card header */}
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.orderNumber, { color: colors.text }]}>
                  #{order.orderNumber}
                </Text>
                <Text style={[styles.orderDate, { color: colors.textMuted }]}>
                  {formatDate(order.createdAt)}
                </Text>
              </View>

              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: statusColor + '14' },
                ]}
              >
                {(order.deliveryStatus === 'out_for_delivery' || order.deliveryStatus === 'in_transit') && (
                  <View style={[styles.liveDot, { backgroundColor: statusColor }]} />
                )}
                <Text style={[styles.statusPillText, { color: statusColor }]}>
                  {statusLabel}
                </Text>
              </View>
            </View>

            {/* Item thumbnails + price row */}
            <View style={styles.summaryRow}>
              <View style={styles.thumbRow}>
                {order.items.slice(0, 3).map((item, idx) => (
                  <View
                    key={item.id}
                    style={[
                      styles.thumbPlaceholder,
                      {
                        backgroundColor: colors.borderLight,
                        marginLeft: idx > 0 ? -8 : 0,
                        zIndex: 3 - idx,
                      },
                    ]}
                  >
                    <Ionicons name="shirt-outline" size={14} color={colors.textMuted} />
                  </View>
                ))}
                {order.items.length > 3 && (
                  <View
                    style={[
                      styles.thumbPlaceholder,
                      {
                        backgroundColor: colors.borderLight,
                        marginLeft: -8,
                      },
                    ]}
                  >
                    <Text style={[styles.thumbMore, { color: colors.textMuted }]}>
                      +{order.items.length - 3}
                    </Text>
                  </View>
                )}
                <Text style={[styles.itemCount, { color: colors.textMuted }]}>
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={[styles.totalPrice, { color: colors.text }]}>
                {formatPrice(order.totalPrice)}
              </Text>
            </View>

            <View style={styles.expandHint}>
              <Text style={[styles.viewDetailsHint, { color: colors.textExtraLight }]}>
                View details
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textExtraLight} />
            </View>

            {showReturnInfoOnly(order) && !hasActiveReturns && (
              <Text style={[styles.inlineHint, { color: colors.textExtraLight }]}>
                Return window closed (7 days exceeded).
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [colors, isDark, fadeAnim, openOrderDetail]
  );

  // ─── Empty state ───────────────────────────────────────────────

  const EmptyState = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.borderExtraLight }]}>
          <Ionicons name="cube-outline" size={32} color={colors.textExtraLight} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No orders yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textExtraLight }]}>
          Your order history will appear here once you make your first purchase.
        </Text>
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: colors.foreground }]}
          onPress={() => {
            haptics.buttonTap();
            navigation.navigate('Main');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.emptyButtonText, { color: colors.background }]}>
            BROWSE COLLECTION
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [colors, navigation]
  );

  // ─── Return modal ──────────────────────────────────────────────

  const selectedReturnCount = returnItems.filter((i) => i.selected).length;
  const canSubmitReturn =
    selectedReturnCount > 0 && returnItems.filter((i) => i.selected).every((i) => i.reason.length > 0);

  const ReturnModalContent = (
    <Modal
      visible={returnModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setReturnModalVisible(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Modal header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.borderExtraLight }]}>
          <TouchableOpacity
            onPress={() => {
              haptics.buttonTap();
              setReturnModalVisible(false);
            }}
          >
            <Text style={[styles.modalCancel, { color: colors.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {returnSuccess ? 'Request Submitted' : 'Return / Exchange'}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {returnSuccess ? (
          /* Success state */
          <View style={styles.successContainer}>
            <View style={[styles.successIcon, { backgroundColor: colors.success + '14' }]}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            </View>
            <Text style={[styles.successTitle, { color: colors.text }]}>Request Submitted</Text>
            <Text style={[styles.successSubtitle, { color: colors.textMuted }]}>
              We'll review your request and get back to you within 24 hours. You'll be notified of the status update.
            </Text>
            <TouchableOpacity
              style={[styles.successButton, { backgroundColor: colors.foreground }]}
              onPress={() => {
                haptics.buttonTap();
                setReturnModalVisible(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.successButtonText, { color: colors.background }]}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Selection state */
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.modalSectionTitle, { color: colors.textMuted }]}>
              SELECT ITEMS
            </Text>

            {returnItems.map((item, idx) => (
              <View key={item.lineItemId}>
                <TouchableOpacity
                  style={[
                    styles.returnItemRow,
                    {
                      backgroundColor: item.selected
                        ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')
                        : 'transparent',
                      borderColor: item.selected ? colors.iosBlue + '30' : colors.borderExtraLight,
                    },
                  ]}
                  onPress={() => toggleReturnItemSelection(idx)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: item.selected ? colors.iosBlue : colors.borderLight,
                        backgroundColor: item.selected ? colors.iosBlue : 'transparent',
                      },
                    ]}
                  >
                    {item.selected && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.returnItemTitle, { color: colors.text }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={[styles.returnItemQty, { color: colors.textMuted }]}>
                      Qty: {item.quantity}
                    </Text>
                  </View>
                </TouchableOpacity>

                {item.selected && (
                  <View style={styles.returnItemOptions}>
                    {/* Action toggle */}
                    <View style={styles.actionToggle}>
                      <TouchableOpacity
                        style={[
                          styles.actionToggleBtn,
                          {
                            backgroundColor:
                              item.action === 'return' ? colors.foreground : 'transparent',
                            borderColor: colors.borderLight,
                          },
                        ]}
                        onPress={() => setReturnItemAction(idx, 'return')}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.actionToggleText,
                            {
                              color:
                                item.action === 'return' ? colors.background : colors.textMuted,
                            },
                          ]}
                        >
                          Return
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionToggleBtn,
                          {
                            backgroundColor:
                              item.action === 'exchange' ? colors.foreground : 'transparent',
                            borderColor: colors.borderLight,
                          },
                        ]}
                        onPress={() => setReturnItemAction(idx, 'exchange')}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.actionToggleText,
                            {
                              color:
                                item.action === 'exchange' ? colors.background : colors.textMuted,
                            },
                          ]}
                        >
                          Exchange
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Reason chips */}
                    <Text style={[styles.reasonLabel, { color: colors.textMuted }]}>REASON</Text>
                    <View style={styles.reasonChips}>
                      {RETURN_REASONS.map((reason) => (
                        <TouchableOpacity
                          key={reason}
                          style={[
                            styles.reasonChip,
                            {
                              backgroundColor:
                                item.reason === reason
                                  ? colors.foreground
                                  : isDark
                                  ? 'rgba(255,255,255,0.05)'
                                  : 'rgba(0,0,0,0.04)',
                              borderColor:
                                item.reason === reason ? colors.foreground : colors.borderLight,
                            },
                          ]}
                          onPress={() => setReturnItemReason(idx, reason)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.reasonChipText,
                              {
                                color:
                                  item.reason === reason ? colors.background : colors.textSecondary,
                              },
                            ]}
                          >
                            {reason}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}

            {/* Notes */}
            <Text style={[styles.modalSectionTitle, { color: colors.textMuted, marginTop: 24 }]}>
              ADDITIONAL NOTES
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  color: colors.text,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  borderColor: colors.borderLight,
                },
              ]}
              placeholder="Optional — tell us more about the issue"
              placeholderTextColor={colors.textExtraLight}
              value={returnNotes}
              onChangeText={setReturnNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: canSubmitReturn ? colors.foreground : colors.borderLight,
                },
              ]}
              onPress={submitReturnRequest}
              disabled={!canSubmitReturn || submittingReturn}
              activeOpacity={0.8}
            >
              {submittingReturn ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text
                  style={[
                    styles.submitButtonText,
                    {
                      color: canSubmitReturn ? colors.background : colors.textMuted,
                    },
                  ]}
                >
                  SUBMIT REQUEST
                </Text>
              )}
            </TouchableOpacity>

            <Text style={[styles.policyNote, { color: colors.textExtraLight }]}>
              Returns must be in original condition with tags attached. Exchanges are subject to
              availability. Refunds are processed within 5–7 business days.
            </Text>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GlassHeader title="ORDER HISTORY" showBack />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={{
            paddingTop: 16,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 20,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={EmptyState}
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 18 }}>
                <ActivityIndicator size="small" color={colors.textExtraLight} />
              </View>
            ) : null
          }
        />
      )}

      {ReturnModalContent}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Order card
  orderCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  orderDate: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Summary row
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbMore: {
    fontSize: 9,
    fontWeight: '700',
  },
  itemCount: {
    fontSize: 11,
    fontWeight: '400',
    marginLeft: 10,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Expand
  expandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 12,
  },
  viewDetailsHint: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  inlineHint: {
    fontSize: 10,
    marginTop: 8,
    lineHeight: 14,
  },
  detailMeta: {
    fontSize: 12,
    marginBottom: 16,
    letterSpacing: 0.2,
  },

  // Expanded content
  expandedContent: {
    marginTop: 4,
  },
  separator: {
    height: 1,
    marginVertical: 16,
    opacity: 0.6,
  },

  // Timeline
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
  },
  timelineNodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    height: 22,
    marginBottom: 6,
  },
  timelineLine: {
    position: 'absolute',
    left: 0,
    right: '50%',
    height: 2,
    borderRadius: 1,
  },
  timelineNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineLabel: {
    fontSize: 9,
    letterSpacing: 0.3,
  },

  // Tracking
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  trackingLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  trackingId: {
    fontSize: 10,
    marginTop: 2,
  },

  // Line items
  lineItems: {
    gap: 12,
    marginBottom: 16,
  },
  lineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lineItemThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineItemInfo: {
    flex: 1,
  },
  lineItemTitle: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  lineItemMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 3,
  },
  lineItemSku: {
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  lineItemQty: {
    fontSize: 10,
  },
  lineItemPrice: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemRequestStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginLeft: 56,
    marginTop: -8,
    marginBottom: 12,
    gap: 6,
  },
  itemRequestStatusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Address
  addressBlock: {
    marginBottom: 16,
  },
  addressLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  addressText: {
    fontSize: 11,
    lineHeight: 16,
  },

  // Return status
  returnStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  returnStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Return button
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  returnButtonText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Total row
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '700',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  emptyButton: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
  },
  emptyButtonText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },

  // ─── Modal ──────────────────────────────────────────────────────
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 14,
    fontWeight: '400',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },

  // Return items
  returnItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  returnItemTitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  returnItemQty: {
    fontSize: 10,
    marginTop: 2,
  },

  // Return options
  returnItemOptions: {
    paddingLeft: 16,
    paddingRight: 4,
    marginBottom: 12,
  },
  actionToggle: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  actionToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionToggleText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Reasons
  reasonLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  reasonChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  reasonChipText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Notes
  notesInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 13,
    minHeight: 80,
    lineHeight: 18,
  },

  // Submit
  submitButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  policyNote: {
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 12,
  },

  // Success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
  successButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 28,
  },
  successButtonText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
