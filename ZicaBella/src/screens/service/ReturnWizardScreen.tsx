import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import GlassHeader from '../../components/GlassHeader';
import { useColors } from '../../constants/colors';
import { useThemeStore } from '../../store/themeStore';
import { Typography } from '../../components/Typography';
import { haptics } from '../../utils/haptics';
import { serviceApi } from '../../api/shopify';
import { config } from '../../constants/config';
import { ServiceStackParamList } from '../../navigation/ServiceNavigator';

type Step = 'SELECTION' | 'REASON' | 'METHOD' | 'REVIEW' | 'SUCCESS';

export default function ReturnWizardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ServiceStackParamList, 'ReturnWizard'>>();
  const { orderId } = route.params;
  const colors = useColors();
  const isDark = useThemeStore(s => s.theme) === 'dark';

  const [step, setStep] = useState<Step>('SELECTION');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<'DROP_OFF' | 'PICKUP'>('DROP_OFF');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${config.appUrl}/api/orders/${orderId}`);
        const json = await res.json();
        if (res.ok) setOrder(json.order);
      } catch (e) {
        console.error('Fetch Order Error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const toggleItem = (id: string) => {
    haptics.buttonTap();
    setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const setReason = (itemId: string, reason: string) => {
    haptics.buttonTap();
    setReasons(prev => ({ ...prev, [itemId]: reason }));
  };

  const handleNext = () => {
    haptics.buttonTap();
    if (step === 'SELECTION') setStep('REASON');
    else if (step === 'REASON') setStep('METHOD');
    else if (step === 'METHOD') setStep('REVIEW');
    else if (step === 'REVIEW') submitReturn();
  };

  const submitReturn = async () => {
    setSubmitting(true);
    try {
      const selectedIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
      const payload = {
        orderId,
        items: selectedIds.map(id => ({
          lineItemId: id,
          reason: reasons[id] || 'Other',
          quantity: 1 // Default to 1 for now
        })),
        method,
      };
      const res = await serviceApi.returns.create(payload);
      setResult(res);
      setStep('SUCCESS');
      haptics.success();
    } catch (e) {
      console.error('Submit Return Error:', e);
      haptics.error();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.foreground} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader title="INITIATE RETURN" showBack />
      
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100, paddingTop: insets.top + 70 }]}>
        {step === 'SELECTION' && (
          <View>
            <Typography size={12} weight="700" color={colors.text} style={styles.stepTitle}>Select items to return</Typography>
            <View style={styles.itemList}>
              {order?.items?.map((item: any) => (
                <TouchableOpacity 
                  key={item.id} 
                  activeOpacity={0.8}
                  onPress={() => toggleItem(item.id)}
                  style={[styles.itemCard, { borderColor: selectedItems[item.id] ? colors.foreground : colors.borderLight, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff' }]}
                >
                  <View style={styles.itemThumb}>
                    {item.image ? <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} /> : <Ionicons name="shirt-outline" size={16} color={colors.textExtraLight} />}
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Typography size={10} weight="600" color={colors.text}>{item.title}</Typography>
                    <Typography size={8} color={colors.textMuted} style={{ marginTop: 2 }}>{item.size || 'M'} · {item.quantity} QTY</Typography>
                  </View>
                  <View style={[styles.checkbox, { borderColor: selectedItems[item.id] ? colors.iosBlue : colors.borderLight, backgroundColor: selectedItems[item.id] ? colors.iosBlue : 'transparent' }]}>
                    {selectedItems[item.id] && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 'REASON' && (
          <View>
            <Typography size={12} weight="700" color={colors.text} style={styles.stepTitle}>Why are you returning?</Typography>
            {order?.items?.filter((item: any) => selectedItems[item.id]).map((item: any) => (
              <View key={item.id} style={styles.reasonSection}>
                <Typography size={9} weight="700" color={colors.textMuted} style={{ marginBottom: 12 }}>{item.title.toUpperCase()}</Typography>
                <View style={styles.chips}>
                  {['Wrong size', 'Damaged', 'Not as described', 'Changed my mind', 'Other'].map(r => (
                    <TouchableOpacity 
                      key={r} 
                      onPress={() => setReason(item.id, r)}
                      style={[styles.chip, { borderColor: reasons[item.id] === r ? colors.foreground : colors.borderLight, backgroundColor: reasons[item.id] === r ? colors.surface : 'transparent' }]}
                    >
                      <Typography size={8} weight="700" color={reasons[item.id] === r ? colors.text : colors.textMuted}>{r.toUpperCase()}</Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {step === 'METHOD' && (
          <View>
            <Typography size={12} weight="700" color={colors.text} style={styles.stepTitle}>Choose return method</Typography>
            <TouchableOpacity 
              onPress={() => { haptics.buttonTap(); setMethod('DROP_OFF'); }}
              style={[styles.methodCard, { borderColor: method === 'DROP_OFF' ? colors.foreground : colors.borderLight, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff' }]}
            >
              <Ionicons name="home-outline" size={24} color={colors.text} />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Typography size={10} weight="700" color={colors.text}>DROP-OFF AT COURIER POINT</Typography>
                <Typography size={8} color={colors.textMuted} style={{ marginTop: 2 }}>Hand it over at any Shiprocket point.</Typography>
              </View>
              {method === 'DROP_OFF' && <Ionicons name="checkmark-circle" size={20} color={colors.iosBlue} />}
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => { haptics.buttonTap(); setMethod('PICKUP'); }}
              style={[styles.methodCard, { borderColor: method === 'PICKUP' ? colors.foreground : colors.borderLight, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff' }]}
            >
              <Ionicons name="car-outline" size={24} color={colors.text} />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Typography size={10} weight="700" color={colors.text}>SCHEDULE PICKUP</Typography>
                <Typography size={8} color={colors.textMuted} style={{ marginTop: 2 }}>We will pick it up from your address.</Typography>
              </View>
              {method === 'PICKUP' && <Ionicons name="checkmark-circle" size={20} color={colors.iosBlue} />}
            </TouchableOpacity>
          </View>
        )}

        {step === 'REVIEW' && (
          <View>
            <Typography size={12} weight="700" color={colors.text} style={styles.stepTitle}>Review and Confirm</Typography>
            <View style={[styles.reviewCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', borderColor: colors.borderLight }]}>
              <Typography size={7} weight="800" color={colors.textExtraLight} style={{ letterSpacing: 1.5 }}>ITEMS</Typography>
              {order?.items?.filter((item: any) => selectedItems[item.id]).map((item: any) => (
                <View key={item.id} style={{ marginTop: 12 }}>
                  <Typography size={9} weight="600" color={colors.text}>{item.title}</Typography>
                  <Typography size={8} color={colors.textMuted} style={{ marginTop: 2 }}>Reason: {reasons[item.id] || 'Other'}</Typography>
                </View>
              ))}
              <View style={{ height: 1, backgroundColor: colors.borderExtraLight, marginVertical: 16 }} />
              <Typography size={7} weight="800" color={colors.textExtraLight} style={{ letterSpacing: 1.5 }}>METHOD</Typography>
              <Typography size={9} weight="700" color={colors.text} style={{ marginTop: 8 }}>{method.replace('_', ' ')}</Typography>
            </View>
          </View>
        )}

        {step === 'SUCCESS' && (
          <View style={styles.successView}>
            <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="checkmark-done" size={48} color={colors.success} />
            </View>
            <Typography size={16} weight="800" color={colors.text} style={{ marginTop: 24 }}>RETURN REQUESTED</Typography>
            <Typography size={10} color={colors.textMuted} style={{ marginTop: 8, textAlign: 'center' }}>Ref: {result?.referenceNumber || 'ZB-RET-9201'}</Typography>
            <Typography size={9} color={colors.textLight} style={{ marginTop: 20, textAlign: 'center', lineHeight: 16 }}>
              Your return is being processed. You will receive a confirmation email shortly.
            </Typography>
            {result?.labelUrl && (
              <TouchableOpacity style={[styles.labelBtn, { backgroundColor: colors.foreground }]} onPress={() => Linking.openURL(result.labelUrl)}>
                <Typography size={9} weight="700" color={colors.background}>DOWNLOAD RETURN LABEL</Typography>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.backBtn, { borderColor: colors.borderLight }]} onPress={() => navigation.popToTop()}>
              <Typography size={9} weight="700" color={colors.text}>BACK TO HOME</Typography>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {step !== 'SUCCESS' && (
        <View style={styles.footer}>
          <TouchableOpacity 
            disabled={Object.keys(selectedItems).filter(id => selectedItems[id]).length === 0 || submitting}
            onPress={handleNext}
            style={[styles.nextBtn, { backgroundColor: colors.foreground, opacity: (Object.keys(selectedItems).filter(id => selectedItems[id]).length === 0) ? 0.5 : 1 }]}
          >
            {submitting ? <ActivityIndicator color={colors.background} /> : <Typography size={10} weight="800" color={colors.background}>CONTINUE</Typography>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stepTitle: { marginBottom: 24, letterSpacing: -0.5 },
  itemList: { gap: 12 },
  itemCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1 },
  itemThumb: { width: 56, height: 56, borderRadius: 14, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  reasonSection: { marginBottom: 32 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  methodCard: { flexDirection: 'row', alignItems: 'center', padding: 24, borderRadius: 24, borderWidth: 1, marginBottom: 16 },
  reviewCard: { padding: 24, borderRadius: 24, borderWidth: 1 },
  footer: { position: 'absolute', bottom: 40, left: 20, right: 20 },
  nextBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  successView: { alignItems: 'center', paddingTop: 60 },
  successIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  labelBtn: { width: '100%', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  backBtn: { width: '100%', height: 60, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
});
