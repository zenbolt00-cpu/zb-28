import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Animated,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassHeader from '../components/GlassHeader';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { formatPrice } from '../utils/formatPrice';
import { RootStackParamList } from '../navigation/RootNavigator';
import { haptics } from '../utils/haptics';
import { config } from '../constants/config';
import * as ImagePicker from 'expo-image-picker';

const TIMELINE_STEPS = [
  'Order Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
] as const;

function getTimelineIndex(order: any): number {
  const ds = order.deliveryStatus?.toLowerCase();
  const fs = order.fulfillmentStatus?.toLowerCase();
  const ps = String(order.paymentStatus || '').toLowerCase();

  if (ds === 'delivered') return 5;
  if (ds === 'out_for_delivery') return 4;
  if (ds === 'in_transit' || ds === 'shipped' || fs === 'shipped' || fs === 'fulfilled') return 3;
  if (fs === 'partial') return 2;
  if (ps === 'paid') return 1;
  return 0;
}

function getStatusColor(order: any, colors: any) {
  const ds = order.deliveryStatus?.toLowerCase();
  if (ds === 'delivered') return colors.success;
  if (ds === 'out_for_delivery' || ds === 'in_transit') return colors.iosBlue;
  if (ds === 'cancelled' || order.status === 'cancelled') return colors.error;
  return colors.warning;
}

function isDelivered(order: any): boolean {
  return String(order.deliveryStatus || '').toLowerCase() === 'delivered';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStepTimestamp(order: any, step: typeof TIMELINE_STEPS[number]): string | null {
  const t = order?.timeline || {};
  const map: Record<string, any> = {
    'Order Placed': t.placedAt || order.createdAt,
    Confirmed: t.confirmedAt,
    Packed: t.packedAt,
    Shipped: t.shippedAt || order.shipmentCreatedAt,
    'Out for Delivery': t.outForDeliveryAt,
    Delivered: t.deliveredAt,
  };
  const raw = map[step];
  if (!raw) return null;
  try {
    return new Date(raw).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return null;
  }
}

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>();
  const { orderForDetail } = route.params;
  const colors = useColors();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const [order, setOrder] = useState<any>(orderForDetail);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMode, setSheetMode] = useState<'return' | 'exchange'>('return');
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [exchangeSizes, setExchangeSizes] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<{ uri: string; mimeType?: string; fileName?: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeIndex = useMemo(() => getTimelineIndex(order), [order]);
  const statusColor = useMemo(() => getStatusColor(order, colors), [order, colors]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  useEffect(() => {
    setOrder(orderForDetail);
  }, [orderForDetail]);

  if (!order) return null;

  const isReturnRequested = (order.returns || []).some((r: any) => r.status === 'REQUESTED' || r.status === 'APPROVED' || r.status === 'PROCESSING');
  const isExchangeRequested = (order.exchanges || []).some((e: any) => e.status === 'REQUESTED' || e.status === 'APPROVED' || e.status === 'PROCESSING');

  const openSheet = (mode: 'return' | 'exchange') => {
    haptics.buttonTap();
    setSheetMode(mode);
    setSheetVisible(true);
    setSubmitting(false);
    setSubmitError(null);
    setPhoto(null);

    const initialSelected: Record<string, boolean> = {};
    const initialReasons: Record<string, string> = {};
    const initialSizes: Record<string, string> = {};
    for (const item of order.items || []) {
      initialSelected[item.id] = false;
      initialReasons[item.id] = '';
      const guess = String(item?.sku || '').match(/\b(XXL|XL|L|M|S|XS)\b/i)?.[1];
      initialSizes[item.id] = (guess || '').toUpperCase();
    }
    setSelected(initialSelected);
    setReasons(initialReasons);
    setExchangeSizes(initialSizes);
  };

  const closeSheet = () => {
    haptics.buttonTap();
    setSheetVisible(false);
  };

  const pickPhoto = async () => {
    haptics.buttonTap();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setSubmitError('Photo permission denied.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setPhoto({ uri: a.uri, mimeType: a.mimeType ?? undefined, fileName: a.fileName ?? undefined });
  };

  const uploadPhotoIfNeeded = async (): Promise<string | null> => {
    if (!photo) return null;
    const form = new FormData();
    (form as any).append('file', {
      uri: photo.uri,
      type: photo.mimeType || 'image/jpeg',
      name: photo.fileName || 'return.jpg',
    } as any);
    const res = await fetch(`${config.appUrl}/api/admin/upload-image`, {
      method: 'POST',
      // fetch will set correct boundary for multipart
      body: form as any,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Photo upload failed');
    return json.url || null;
  };

  const submitRequest = async () => {
    setSubmitError(null);
    const selectedIds = Object.keys(selected).filter((k) => selected[k]);
    if (selectedIds.length === 0) {
      setSubmitError('Select at least one item.');
      return;
    }
    if (sheetMode === 'return') {
      const missing = selectedIds.some((id) => !reasons[id]);
      if (missing) {
        setSubmitError('Select a reason for each selected item.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const photoUrl = await uploadPhotoIfNeeded();
      const exchangeNote =
        sheetMode === 'exchange'
          ? selectedIds
              .map((id) => {
                const item = (order.items || []).find((i: any) => i.id === id);
                const sz = exchangeSizes[id];
                return `${item?.title || 'Item'} → ${sz || 'SIZE_NOT_SET'}`;
              })
              .join(' | ')
          : null;
      const res = await fetch(`${config.appUrl}/api/app/orders/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          items: selectedIds.map((id) => {
            const item = (order.items || []).find((i: any) => i.id === id);
            return {
              lineItemId: item?.id,
              quantity: item?.quantity || 1,
              reason:
                sheetMode === 'return'
                  ? reasons[id]
                  : `Exchange requested via app${exchangeSizes[id] ? ` (size: ${exchangeSizes[id]})` : ''}`,
              action: sheetMode,
            };
          }),
          notes:
            sheetMode === 'return'
              ? (photoUrl ? `Photo: ${photoUrl}` : undefined)
              : [exchangeNote ? `Exchange sizes: ${exchangeNote}` : null, photoUrl ? `Photo: ${photoUrl}` : null]
                  .filter(Boolean)
                  .join('\n') || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit request');

      haptics.success();
      const newReturns = json.returns?.length ? [...(order.returns || []), ...json.returns] : order.returns;
      const newExchanges = json.exchanges?.length ? [...(order.exchanges || []), ...json.exchanges] : order.exchanges;
      setOrder({ ...order, returns: newReturns, exchanges: newExchanges });
      closeSheet();
    } catch (e: any) {
      haptics.error();
      setSubmitError(e.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GlassHeader title={`#${order.orderNumber}`} showBack />

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={{
          paddingTop: insets.top + 70,
          paddingHorizontal: 20,
          paddingBottom: 48 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.detailMeta, { color: colors.textMuted }]}>
          Placed {formatDate(order.createdAt)}
        </Text>

        {/* Timeline tracker */}
        <View style={[styles.trackerCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: colors.borderLight }]}>
          {TIMELINE_STEPS.map((step, idx) => {
            const completed = idx < activeIndex;
            const current = idx === activeIndex;
            const future = idx > activeIndex;
            const ts = getStepTimestamp(order, step);

            const scale = current
              ? pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] })
              : 1;

            return (
              <View key={step} style={styles.trackerRow}>
                <View style={styles.trackerLeft}>
                  <Animated.View
                    style={[
                      styles.node,
                      {
                        transform: [{ scale: scale as any }],
                        backgroundColor: completed || current ? statusColor : 'transparent',
                        borderColor: completed || current ? statusColor : colors.borderLight,
                      },
                    ]}
                  >
                    {completed ? (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    ) : current ? (
                      <Ionicons name="ellipse" size={6} color="#fff" />
                    ) : null}
                  </Animated.View>
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <View
                      style={[
                        styles.connector,
                        future
                          ? { borderColor: colors.borderExtraLight, borderStyle: 'dashed' }
                          : { backgroundColor: statusColor },
                      ]}
                    />
                  )}
                </View>

                <View style={styles.trackerRight}>
                  <Text style={[styles.stepTitle, { color: completed || current ? colors.text : colors.textExtraLight }]}>
                    {step.toUpperCase()}
                  </Text>
                  {ts ? (
                    <Text style={[styles.stepTime, { color: colors.textLight }]}>{ts}</Text>
                  ) : (
                    <Text style={[styles.stepTime, { color: colors.textExtraLight }]}>{current ? 'In progress' : '—'}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {order.trackingNumber ? (
          <TouchableOpacity
            style={[styles.trackingRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
            onPress={() => {
              haptics.buttonTap();
              if (order.trackingUrl) Linking.openURL(order.trackingUrl);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="location-outline" size={14} color={colors.text} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.trackingLabel, { color: colors.text }]}>Delivery Partner</Text>
              <Text style={[styles.trackingId, { color: colors.textMuted }]}>
                {order.courier ? `${order.courier} · ` : 'Shiprocket · '}
                {order.trackingNumber}
              </Text>
            </View>
            <Ionicons name="open-outline" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.trackingRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
            <Ionicons name="time-outline" size={14} color={colors.textExtraLight} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.trackingLabel, { color: colors.text }]}>Delivery Partner</Text>
              <Text style={[styles.trackingId, { color: colors.textExtraLight }]}>
                Assigning via Shiprocket...
              </Text>
            </View>
          </View>
        )}

        <View style={styles.lineItems}>
          {order.items.map((item: any) => {
            const r = order.returns?.find((ret: any) => ret.productId === item.productId);
            const e = order.exchanges?.find((exc: any) => exc.originalProductId === item.productId);

            return (
              <View key={item.id}>
                <View style={styles.lineItem}>
                  <View style={[styles.lineItemThumb, { backgroundColor: colors.borderLight }]}>
                    <Ionicons name="shirt-outline" size={18} color={colors.textMuted} />
                  </View>
                  <View style={styles.lineItemInfo}>
                    <Text style={[styles.lineItemTitle, { color: colors.text }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.lineItemMeta}>
                      {item.sku ? (
                        <Text style={[styles.lineItemSku, { color: colors.textExtraLight }]}>{item.sku}</Text>
                      ) : null}
                      <Text style={[styles.lineItemQty, { color: colors.textMuted }]}>Qty: {item.quantity}</Text>
                    </View>
                  </View>
                  <Text style={[styles.lineItemPrice, { color: colors.text }]}>
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
                
                {(r || e) && (
                  <View style={[styles.itemRequestStatus, { backgroundColor: colors.warning + '14' }]}>
                    <Ionicons name={r ? "arrow-undo-outline" : "swap-horizontal"} size={12} color={colors.warning} />
                    <Text style={[styles.itemRequestStatusText, { color: colors.warning }]}>
                      {r ? 'RETURN' : 'EXCHANGE'} {r ? r.status : e?.status}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {order.shippingAddress && (
          <View style={styles.addressBlock}>
            <Text style={[styles.addressLabel, { color: colors.textExtraLight }]}>SHIPPING ADDRESS</Text>
            <Text style={[styles.addressText, { color: colors.textMuted }]}>
              {order.shippingAddress.name && `${order.shippingAddress.name}\n`}
              {order.shippingAddress.address1 && `${order.shippingAddress.address1}\n`}
              {[order.shippingAddress.city, order.shippingAddress.province, order.shippingAddress.zip]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.addressBlock}>
          <Text style={[styles.addressLabel, { color: colors.textExtraLight }]}>PAYMENT METHOD</Text>
          <Text style={[styles.addressText, { color: colors.textMuted, textTransform: 'capitalize' }]}>
            {order.paymentMethod ? order.paymentMethod.replace('_', ' ') :
             (order.paymentStatus === 'paid' ? 'Prepaid / UPI' : 'Pending')}
          </Text>
        </View>

        {(order.returns?.length > 0 || order.exchanges?.length > 0) && (
          <View style={[styles.returnStatusBanner, { backgroundColor: colors.borderExtraLight }]}>
            <Ionicons name="receipt-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.returnStatusText, { color: colors.textSecondary }]}>
              {(order.returns?.length || 0) + (order.exchanges?.length || 0)} active request(s) — check status in your email.
            </Text>
          </View>
        )}

        {/* Returns & Exchanges (Delivered only) */}
        {isDelivered(order) && (
          <View style={styles.rxSection}>
            <Text style={[styles.rxTitle, { color: colors.textMuted }]}>RETURNS & EXCHANGES</Text>

            {isReturnRequested || isExchangeRequested ? (
              <Text style={[styles.inlineHint, { color: colors.textExtraLight, marginTop: 8 }]}>
                A request is already in progress. Status will update in the admin dashboard.
              </Text>
            ) : (
              <View style={{ gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => openSheet('return')}
                  style={[styles.rxBtn, { borderColor: colors.borderLight }]}
                >
                  <Text style={[styles.rxBtnText, { color: colors.textSecondary }]}>REQUEST RETURN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => openSheet('exchange')}
                  style={[styles.rxBtn, { borderColor: colors.borderLight }]}
                >
                  <Text style={[styles.rxBtnText, { color: colors.textSecondary }]}>REQUEST EXCHANGE</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={[styles.separator, { backgroundColor: colors.borderExtraLight }]} />
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>TOTAL PAID</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>{formatPrice(order.totalPrice)}</Text>
        </View>

        <View style={{ height: 12 }} />
        <View style={styles.captionRow}>
          <Text style={[styles.caption, { color: colors.textExtraLight }]}>Order ID</Text>
          <Text style={[styles.captionValue, { color: colors.textExtraLight }]}>{order.id}</Text>
        </View>
      </Animated.ScrollView>

      {/* Bottom sheet */}
      <Modal visible={sheetVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeSheet}>
        <View style={[styles.sheetRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.sheetHeader, { borderBottomColor: colors.borderExtraLight }]}>
            <TouchableOpacity onPress={closeSheet} activeOpacity={0.8}>
              <Text style={[styles.sheetCancel, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {sheetMode === 'return' ? 'Request Return' : 'Request Exchange'}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            {submitError ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.error + '14' }]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={[styles.errorBannerText, { color: colors.error }]}>{submitError}</Text>
              </View>
            ) : null}

            <Text style={[styles.sheetSectionLabel, { color: colors.textMuted }]}>SELECT ITEMS</Text>
            <View style={{ gap: 10 }}>
              {(order.items || []).map((item: any) => {
                const checked = !!selected[item.id];
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      haptics.quantityChange();
                      setSelected((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
                    }}
                    style={[
                      styles.sheetItemRow,
                      {
                        borderColor: checked ? colors.iosBlue + '40' : colors.borderExtraLight,
                        backgroundColor: checked
                          ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
                          : 'transparent',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: checked ? colors.iosBlue : colors.borderLight,
                          backgroundColor: checked ? colors.iosBlue : 'transparent',
                        },
                      ]}
                    >
                      {checked && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={[styles.itemMeta, { color: colors.textMuted }]}>Qty: {item.quantity}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {sheetMode === 'return' ? (
              <>
                <Text style={[styles.sheetSectionLabel, { color: colors.textMuted, marginTop: 18 }]}>REASON</Text>
                <View style={styles.reasonGrid}>
                  {['Wrong size', 'Defective', 'Changed mind', 'Other'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      activeOpacity={0.85}
                      onPress={() => {
                        haptics.quantityChange();
                        // set same reason for all selected items for speed
                        setReasons((prev) => {
                          const next = { ...prev };
                          for (const id of Object.keys(selected)) {
                            if (selected[id]) next[id] = r;
                          }
                          return next;
                        });
                      }}
                      style={[
                        styles.reasonChip,
                        {
                          borderColor: colors.borderLight,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        },
                      ]}
                    >
                      <Text style={[styles.reasonChipText, { color: colors.textSecondary }]}>{r.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.sheetSectionLabel, { color: colors.textMuted, marginTop: 18 }]}>
                  OPTIONAL PHOTO
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={pickPhoto}
                  style={[styles.photoBtn, { borderColor: colors.borderLight }]}
                >
                  <Ionicons name="image-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.photoBtnText, { color: colors.textSecondary }]}>
                    {photo ? 'CHANGE PHOTO' : 'UPLOAD PHOTO'}
                  </Text>
                </TouchableOpacity>
                {photo ? (
                  <Text style={[styles.photoHint, { color: colors.textExtraLight }]}>
                    Selected: {photo.fileName || 'photo'}
                  </Text>
                ) : null}
              </>
            ) : (
              <>
                <Text style={[styles.sheetSectionLabel, { color: colors.textMuted, marginTop: 18 }]}>
                  NEW SIZE (PER ITEM)
                </Text>
                <View style={{ gap: 10 }}>
                  {(order.items || []).map((item: any) => {
                    if (!selected[item.id]) return null;
                    const cur = exchangeSizes[item.id] || '';
                    return (
                      <View key={`size_${item.id}`} style={styles.exchangeRow}>
                        <Text style={[styles.exchangeItemName, { color: colors.textMuted }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                            <TouchableOpacity
                              key={`${item.id}_${s}`}
                              activeOpacity={0.85}
                              onPress={() => {
                                haptics.buttonTap();
                                setExchangeSizes((prev) => ({ ...prev, [item.id]: s }));
                              }}
                              style={[
                                styles.sizePill,
                                {
                                  borderColor: cur === s ? colors.text : colors.borderLight,
                                  backgroundColor: cur === s ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent',
                                },
                              ]}
                            >
                              <Text style={[styles.sizePillText, { color: colors.textSecondary }]}>{s}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={submitRequest}
              disabled={submitting}
              style={[
                styles.submitBtn,
                { backgroundColor: submitting ? colors.borderLight : colors.foreground },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={[styles.submitBtnText, { color: colors.background }]}>SUBMIT</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  detailMeta: {
    fontSize: 12,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  separator: {
    height: 1,
    marginVertical: 16,
    opacity: 0.6,
  },
  trackerCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  trackerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  trackerLeft: {
    width: 24,
    alignItems: 'center',
  },
  node: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  connector: {
    width: 2,
    flex: 1,
    marginTop: 6,
    marginBottom: 6,
    borderWidth: 1,
  },
  trackerRight: {
    flex: 1,
    paddingBottom: 12,
  },
  stepTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  stepTime: {
    fontSize: 11,
    marginTop: 4,
  },
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
  inlineHint: {
    fontSize: 10,
    marginTop: 8,
    lineHeight: 14,
  },
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
  rxSection: {
    marginTop: 6,
    marginBottom: 8,
  },
  rxTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  rxBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rxBtnText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  captionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500',
  },
  captionValue: {
    fontSize: 11,
    fontWeight: '500',
  },

  sheetRoot: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetCancel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sheetSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },
  sheetItemRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  itemMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  reasonChipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  photoBtnText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
  },
  photoHint: {
    marginTop: 8,
    fontSize: 11,
  },
  submitBtn: {
    marginTop: 22,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  errorBanner: {
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  exchangeRow: {
    gap: 10,
  },
  exchangeItemName: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  sizePill: {
    minWidth: 44,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  sizePillText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
