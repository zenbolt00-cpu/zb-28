import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../constants/colors';
import { Typography } from '../../components/Typography';
import CheckoutSummaryBar from '../../components/CheckoutSummaryBar';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../hooks/useAuth';

export default function DeliveryAddressScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const { user } = useAuth();
  const { total, items } = useCartStore();

  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    zip: '',
    country: 'India',
  });

  const isValid = address.name && address.phone && address.street && address.city && address.zip;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: colors.surface }]}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Typography size={7} color={colors.textExtraLight} weight="600" style={styles.stepTag}>STEP 2 OF 5</Typography>
          <Typography size={14} color={colors.text} weight="700">DELIVERY ADDRESS</Typography>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Typography size={22} weight="700" color={colors.text} style={styles.title}>Where should we send your pieces?</Typography>
        
        <View style={styles.form}>
          <View style={styles.field}>
            <Typography size={7} weight="600" color={colors.textExtraLight} style={styles.label}>FULL NAME</Typography>
            <TextInput
              value={address.name}
              onChangeText={(v) => setAddress({...address, name: v})}
              placeholder="Charlotte Moss"
              placeholderTextColor={colors.textExtraLight}
              style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            />
          </View>

          <View style={styles.field}>
            <Typography size={7} weight="600" color={colors.textExtraLight} style={styles.label}>PHONE NUMBER</Typography>
            <TextInput
              value={address.phone}
              onChangeText={(v) => setAddress({...address, phone: v})}
              placeholder="+91 00000 00000"
              placeholderTextColor={colors.textExtraLight}
              keyboardType="phone-pad"
              style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            />
          </View>

          <View style={styles.field}>
            <Typography size={7} weight="600" color={colors.textExtraLight} style={styles.label}>STREET ADDRESS (GOOGLE PLACES AUTOCOMPLETE)</Typography>
            <TextInput
              value={address.street}
              onChangeText={(v) => setAddress({...address, street: v})}
              placeholder="Search for your address..."
              placeholderTextColor={colors.textExtraLight}
              style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Typography size={7} weight="600" color={colors.textExtraLight} style={styles.label}>CITY</Typography>
              <TextInput
                value={address.city}
                onChangeText={(v) => setAddress({...address, city: v})}
                placeholder="New Delhi"
                placeholderTextColor={colors.textExtraLight}
                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              />
            </View>
            <View style={[styles.field, { width: 120 }]}>
              <Typography size={7} weight="600" color={colors.textExtraLight} style={styles.label}>PINCODE</Typography>
              <TextInput
                value={address.zip}
                onChangeText={(v) => setAddress({...address, zip: v})}
                placeholder="110001"
                placeholderTextColor={colors.textExtraLight}
                keyboardType="number-pad"
                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              />
            </View>
          </View>
        </View>

        {/* Saved Addresses Shortcut */}
        <View style={styles.savedSection}>
          <Typography size={7} weight="600" color={colors.textExtraLight} style={{ marginBottom: 12 }}>SAVED ADDRESSES</Typography>
          <TouchableOpacity style={[styles.savedCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Ionicons name="location-outline" size={20} color={colors.text} />
            <View style={{ marginLeft: 12 }}>
              <Typography size={10} weight="600" color={colors.text}>HOME (PRIMARY)</Typography>
              <Typography size={9} color={colors.textMuted}>12B ARCHIVE STREET, NEW DELHI...</Typography>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Summary Bar */}
      <CheckoutSummaryBar 
        itemCount={items.length}
        total={total()}
        primaryLabel="CONTINUE TO SHIPPING"
        onPrimaryPress={() => {
          if (!isValid) {
            Alert.alert('Missing Info', 'Please fill all address fields.');
            return;
          }
          navigation.navigate('DeliveryMethod');
        }}
        disabled={!isValid}
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
  form: { gap: 20 },
  field: { gap: 8 },
  label: { letterSpacing: 2, marginLeft: 4 },
  input: { height: 60, borderRadius: 20, borderWidth: 1, paddingHorizontal: 20, fontSize: 13, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 16 },
  savedSection: { marginTop: 40 },
  savedCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1 },
});
