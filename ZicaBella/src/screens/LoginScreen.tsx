import React, { useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useColors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { Typography } from '../components/Typography';
import { haptics } from '../utils/haptics';
import { signInWithApple } from '../auth/apple';
import { useThemeStore } from '../store/themeStore';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const theme = useThemeStore(s => s.theme);
  const isDark = theme === 'dark';
  const { login, rememberMe, setRememberMe } = useAuth();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; otp?: string }>({});

  const handleSendOTP = () => {
    if (!phone || phone.length < 10) {
      setErrors({ phone: 'Please enter a valid phone number' });
      haptics.error();
      return;
    }
    setLoading(true);
    // Simulate sending OTP
    setTimeout(() => {
       setLoading(false);
       setStep('OTP');
       haptics.success();
    }, 1000);
  };

  const handleLogin = async () => {
    if (!otp || otp.length < 6) {
      setErrors({ otp: 'Please enter the 6-digit OTP' });
      haptics.error();
      return;
    }

    setLoading(true);
    try {
      const { config } = require('../constants/config');
      const res = await fetch(`${config.appUrl}/api/auth/mobile-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || 'Verification failed');

      login(json.user, 'real-session-token');
      haptics.success();
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    haptics.buttonTap();
    setLoading(true);
    const success = await signInWithApple();
    if (success) {
      haptics.success();
    } else {
      haptics.error();
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 60 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={[styles.logoDot, { backgroundColor: colors.foreground }]} />
            <Typography heading weight="700" size={24} color={colors.text} style={styles.title}>ZICA BELLA</Typography>
            <Typography weight="400" size={10} color={colors.textExtraLight} style={styles.subtitle}>ARCHIVAL EXCELLENCE</Typography>
          </View>

          <View style={styles.form}>
            {step === 'PHONE' ? (
              <View style={styles.field}>
                <Typography size={7} weight="600" color={colors.textExtraLight} style={styles.label}>MOBILE NUMBER</Typography>
                <TextInput
                  value={phone}
                  onChangeText={(v) => { setPhone(v); if (errors.phone) setErrors({ ...errors, phone: undefined }); }}
                  placeholder="+91 00000 00000"
                  placeholderTextColor={colors.textExtraLight}
                  keyboardType="phone-pad"
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: errors.phone ? colors.error : colors.borderLight },
                    isDark && { backgroundColor: 'rgba(255,255,255,0.03)' }
                  ]}
                />
                {errors.phone && (
                  <Typography size={8} color={colors.error} style={styles.errorText}>{errors.phone}</Typography>
                )}
              </View>
            ) : (
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Typography size={7} weight="600" color={colors.textExtraLight} style={styles.label}>OTP CODE</Typography>
                  <TouchableOpacity onPress={() => setStep('PHONE')}>
                    <Typography size={7} weight="600" color={colors.textExtraLight} style={styles.forgotBtn}>CHANGE NUMBER</Typography>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={otp}
                  onChangeText={(v) => { setOtp(v); if (errors.otp) setErrors({ ...errors, otp: undefined }); }}
                  placeholder="000000"
                  placeholderTextColor={colors.textExtraLight}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: errors.otp ? colors.error : colors.borderLight },
                    isDark && { backgroundColor: 'rgba(255,255,255,0.03)' }
                  ]}
                />
                {errors.otp && (
                  <Typography size={8} color={colors.error} style={styles.errorText}>{errors.otp}</Typography>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, { borderColor: colors.borderLight }]}>
                {rememberMe && <Ionicons name="checkmark" size={12} color={colors.foreground} />}
              </View>
              <Typography size={9} color={colors.textSecondary}>Remember me for 30 days</Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.foreground }]}
              onPress={step === 'PHONE' ? handleSendOTP : handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Typography heading weight="700" size={11} color={colors.background}>
                  {step === 'PHONE' ? 'CONTINUE' : 'VERIFY & SIGN IN'}
                </Typography>
              )}
            </TouchableOpacity>

            <Typography size={8} color={colors.textMuted} style={styles.demoHint}>
              Use any valid email and password 123456. Demo OTP is also 123456.
            </Typography>

            <View style={styles.guestRow}>
              <Typography size={10} color={colors.textMuted}>Don't have an account?</Typography>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Typography size={10} weight="600" color={colors.foreground} style={{ marginLeft: 6 }}>JOIN US</Typography>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.borderLight }]} />
            <Typography size={8} color={colors.textExtraLight} style={{ paddingHorizontal: 16 }}>OR CONTINUE WITH</Typography>
            <View style={[styles.dividerLine, { backgroundColor: colors.borderLight }]} />
          </View>

          <View style={styles.oauthContainer}>
            <TouchableOpacity
              style={[
                styles.oauthButton, 
                { 
                  backgroundColor: isDark ? '#FFFFFF' : '#000000', 
                  borderColor: isDark ? '#FFFFFF' : '#000000' 
                }
              ]}
              onPress={handleAppleSignIn}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-apple" size={19} color={isDark ? '#000000' : '#FFFFFF'} />
              <Typography weight="700" size={9.5} color={isDark ? '#000000' : '#FFFFFF'} style={{ marginLeft: 10, letterSpacing: 0.5 }}>SIGN IN WITH APPLE</Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.oauthButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.surface, borderColor: colors.borderLight }]}
              onPress={() => { haptics.buttonTap(); Alert.alert('Google Sign-In', 'Integrated in native builds.'); }}
            >
              <Ionicons name="logo-google" size={16} color={colors.text} />
              <Typography weight="600" size={9} color={colors.text} style={{ marginLeft: 10 }}>GOOGLE</Typography>
            </TouchableOpacity>
          </View>

          <View style={styles.legalRow}>
            <Typography size={8} color={colors.textMuted} style={{ textAlign: 'center', lineHeight: 14 }}>
              By signing in, you agree to our{'\n'}
              <Typography size={8} weight="700" color={colors.text} onPress={() => navigation.navigate('PrivacyAndTerms', { type: 'terms' })}>TERMS OF SERVICE</Typography>
              {' '}and{' '}
              <Typography size={8} weight="700" color={colors.text} onPress={() => navigation.navigate('PrivacyAndTerms', { type: 'privacy' })}>PRIVACY POLICY</Typography>
            </Typography>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 24,
  },
  title: {
    letterSpacing: 10,
    marginBottom: 8,
  },
  subtitle: {
    letterSpacing: 6,
    opacity: 0.6,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    letterSpacing: 2,
    marginLeft: 4,
  },
  forgotBtn: {
    letterSpacing: 1,
    opacity: 0.7,
  },
  input: {
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    marginLeft: 12,
    marginTop: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginLeft: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    height: 64,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  demoHint: {
    textAlign: 'center',
    opacity: 0.75,
    lineHeight: 16,
    marginTop: 10,
  },
  guestRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 48,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.2,
  },
  oauthContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  oauthButton: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleButtonText: {
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  legalRow: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
