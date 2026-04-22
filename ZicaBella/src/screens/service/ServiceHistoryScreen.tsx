import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import GlassHeader from '../../components/GlassHeader';
import { useColors } from '../../constants/colors';
import { useThemeStore } from '../../store/themeStore';
import { useAuth } from '../../hooks/useAuth';
import { Typography } from '../../components/Typography';
import { serviceApi } from '../../api/shopify';
import { haptics } from '../../utils/haptics';

export default function ServiceHistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const theme = useThemeStore(s => s.theme);
  const isDark = theme === 'dark';
  const { user } = useAuth();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [returnsRes, exchangesRes] = await Promise.all([
        serviceApi.returns.list(user.id),
        serviceApi.exchanges.list(user.id)
      ]);
      
      const combined = [
        ...(returnsRes.returns || []).map((r: any) => ({ ...r, type: 'RETURN' })),
        ...(exchangesRes.exchanges || []).map((e: any) => ({ ...e, type: 'EXCHANGE' }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setRequests(combined);
    } catch (e) {
      console.error('Fetch Service History Error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const getStatusInfo = (req: any) => {
    const status = (req.status || 'REQUESTED').toUpperCase();
    if (status === 'REFUNDED' || status === 'DELIVERED') return { color: colors.success, label: status };
    if (status === 'APPROVED' || status === 'SHIPPED') return { color: colors.iosBlue, label: status };
    if (status === 'CANCELLED' || status === 'REJECTED') return { color: colors.error, label: status };
    return { color: colors.warning, label: status };
  };

  const renderItem = ({ item }: { item: any }) => {
    const { color, label } = getStatusInfo(item);
    const mainItem = item.items?.[0] || {};

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ServiceDetail', { type: item.type, id: item.id })}
        style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', borderColor: colors.borderLight }]}
      >
        <View style={styles.cardHeader}>
          <View>
            <Typography size={7} weight="800" color={colors.textExtraLight} style={{ letterSpacing: 1.5 }}>{item.type}</Typography>
            <Typography size={10} weight="700" color={colors.text} style={{ marginTop: 2 }}>REF: {item.referenceNumber || item.id.slice(-8).toUpperCase()}</Typography>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: color + '15' }]}>
            <Typography size={7} weight="700" color={color}>{label}</Typography>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.thumbContainer}>
            {mainItem.image ? (
              <Image source={{ uri: mainItem.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <Ionicons name="shirt-outline" size={16} color={colors.textExtraLight} />
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Typography size={10} weight="600" color={colors.text} numberOfLines={1}>{mainItem.title || 'Multiple Items'}</Typography>
            <Typography size={8} color={colors.textMuted} style={{ marginTop: 2 }}>
              From Order #{item.orderNumber} · {new Date(item.createdAt).toLocaleDateString()}
            </Typography>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.textExtraLight} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader title="RETURNS & EXCHANGES" showBack />
      
      {loading && !refreshing ? (
        <View style={styles.center}><ActivityIndicator color={colors.foreground} /></View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => `${item.type}-${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 20 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.foreground} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="swap-horizontal-outline" size={48} color={colors.textExtraLight} />
              <Typography size={10} color={colors.textMuted} style={{ marginTop: 20 }}>NO ACTIVE REQUESTS</Typography>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 20 },
  card: { padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  content: { flexDirection: 'row', alignItems: 'center' },
  thumbContainer: { width: 48, height: 48, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120 },
});
