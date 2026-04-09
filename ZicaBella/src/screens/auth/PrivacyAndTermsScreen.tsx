import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import GlassHeader from '../../components/GlassHeader';
import { useColors } from '../../constants/colors';
import { useThemeStore } from '../../store/themeStore';
import { config } from '../../constants/config';
import { Typography } from '../../components/Typography';

export default function PrivacyAndTermsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const colors = useColors();
  const isDark = useThemeStore(s => s.theme) === 'dark';
  const type = route.params?.type || 'privacy'; // 'privacy' or 'terms'

  const [loading, setLoading] = useState(true);

  // Fallback direct text if webview is unavailable offline
  const title = type === 'privacy' ? 'PRIVACY POLICY' : 'TERMS OF SERVICE';
  const url = type === 'privacy' ? `${config.appUrl}/privacy` : `${config.appUrl}/terms`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader title={title} showBack />
      
      <View style={{ flex: 1, marginTop: insets.top + 60, paddingBottom: insets.bottom }}>
        {/* We use a WebView to render the actual policy from the site so it's always up to date */}
        <WebView 
          source={{ uri: url }}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          onLoadEnd={() => setLoading(false)}
          showsVerticalScrollIndicator={false}
          cacheEnabled={false}
        />

        {loading && (
          <View style={[StyleSheet.absoluteFill, styles.loaderContainer]}>
            <ActivityIndicator color={colors.text} size="large" />
            <Typography size={10} color={colors.textMuted} style={{ marginTop: 12, letterSpacing: 1.5 }}>
              LOADING DOCUMENT...
            </Typography>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  }
});
