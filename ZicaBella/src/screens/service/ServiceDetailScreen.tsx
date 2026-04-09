import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import GlassHeader from '../../components/GlassHeader';
import { useColors } from '../../constants/colors';
import { useThemeStore } from '../../store/themeStore';
import { Typography } from '../../components/Typography';
import { serviceApi } from '../../api/shopify';
import { haptics } from '../../utils/haptics';
import { config } from '../../constants/config';
import { ServiceStackParamList } from '../../navigation/ServiceNavigator';

export default function ServiceDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ServiceStackParamList, 'ServiceDetail'>>();
  const { type, id } = route.params;
  const colors = useColors();
  const isDark = useThemeStore(s => s.theme) === 'dark';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    try {
      const res: any = type === 'RETURN' ? await serviceApi.returns.get(id) : await serviceApi.exchanges.get(id);
      setData(res.return || res.exchange || res);
    } catch (e) {
      console.error('Fetch Service Detail Error:', e);
    } finally {
      setLoading(false);
    }
  }, [id, type]);

  useEffect(() => {
    haptics.buttonTap();
    fetchDetail();
  }, [fetchDetail]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.foreground} /></View>;
  if (!data) return <Typography color={colors.error}>Request not found.</Typography>;

  const steps = type === 'RETURN' 
    ? ['REQUESTED', 'APPROVED', 'ITEM RECEIVED', 'REFUND ISSUED']
    : ['REQUESTED', 'APPROVED', 'NEW ORDER CREATED', 'SHIPPED', 'DELIVERED'];

  const currentStatus = (data.status || 'REQUESTED').toUpperCase();
  const activeIndex = steps.indexOf(currentStatus);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader title={`${type} DETAIL`} showBack />
      
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40, paddingTop: insets.top + 70 }]}>
        <View style={styles.header}>
          <Typography size={7} weight="800" color={colors.textExtraLight} style={{ letterSpacing: 1.5 }}>TRACKING {type}</Typography>
          <Typography size={14} weight="800" color={colors.text} style={{ marginTop: 4 }}>Ref: {data.referenceNumber || data.id.slice(-8).toUpperCase()}</Typography>
          <Typography size={8} color={colors.textMuted} style={{ marginTop: 6 }}>Initiated on {new Date(data.createdAt).toLocaleDateString()}</Typography>
        </View>

        {/* Timeline */}
        <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', borderColor: colors.borderLight }]}>
          {steps.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const color = isCompleted || isCurrent ? (type === 'RETURN' ? colors.warning : colors.iosBlue) : colors.borderLight;
            
            return (
              <View key={step} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.node, { backgroundColor: isCompleted ? color : 'transparent', borderColor: color }]}>
                    {isCompleted && <Ionicons name="checkmark" size={10} color="#fff" />}
                    {isCurrent && <View style={[styles.pulse, { backgroundColor: color }]} />}
                  </View>
                  {idx < steps.length - 1 && <View style={[styles.line, { backgroundColor: isCompleted ? color : colors.borderExtraLight }]} />}
                </View>
                <View style={styles.timelineRight}>
                  <Typography size={9} weight="700" color={isCompleted || isCurrent ? colors.text : colors.textExtraLight}>{step}</Typography>
                  {isCurrent && <Typography size={7} color={colors.textMuted} style={{ marginTop: 2 }}>In progress</Typography>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Items */}
        <Typography size={9} weight="800" color={colors.textMuted} style={styles.sectionTitle}>ITEMS IN {type}</Typography>
        <View style={styles.itemList}>
          {(data.items || []).map((item: any) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemThumb}>
                {item.image ? <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} /> : <Ionicons name="shirt-outline" size={16} color={colors.textExtraLight} />}
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Typography size={10} weight="600" color={colors.text}>{item.title}</Typography>
                <Typography size={8} color={colors.textMuted} style={{ marginTop: 2 }}>Reason: {item.reason || 'Size issue'}</Typography>
              </View>
            </View>
          ))}
        </View>

        {data.labelUrl && (
          <TouchableOpacity 
            style={[styles.actionBtn, { borderColor: colors.borderLight }]}
            onPress={() => Linking.openURL(data.labelUrl)}
          >
            <Ionicons name="download-outline" size={16} color={colors.text} />
            <Typography size={9} weight="700" color={colors.text} style={{ marginLeft: 8 }}>DOWNLOAD SHIPPING LABEL</Typography>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.actionBtn, { borderColor: colors.borderLight, marginTop: 12 }]}
          onPress={() => Linking.openURL(config.contactPage)}
        >
          <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
          <Typography size={9} weight="700" color={colors.text} style={{ marginLeft: 8 }}>NEED HELP?</Typography>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 20 },
  header: { marginBottom: 32 },
  card: { padding: 24, borderRadius: 28, borderWidth: 1, marginBottom: 32 },
  timelineRow: { flexDirection: 'row' },
  timelineLeft: { width: 40, alignItems: 'center' },
  node: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  pulse: { width: 6, height: 6, borderRadius: 3 },
  line: { width: 2, flex: 1, marginVertical: -2 },
  timelineRight: { flex: 1, paddingBottom: 24, paddingLeft: 8 },
  sectionTitle: { marginBottom: 16, letterSpacing: 1.5 },
  itemList: { gap: 16, marginBottom: 32 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemThumb: { width: 48, height: 48, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, borderWidth: 1, justifyContent: 'center' },
});
