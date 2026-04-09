import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { Typography } from '../components/Typography';
import { haptics } from '../utils/haptics';
import { useThemeStore } from '../store/themeStore';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const theme = useThemeStore(s => s.theme);
  const isDark = theme === 'dark';
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Please enter your full name';
    if (!email.includes('@')) newErrors.email = 'Please enter a valid email address';
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      haptics.error();
      return;
    }

    setLoading(true);
    try {
      // Simulated API call - targeting /api/auth/register
      setTimeout(() => {
        login({
          id: 'new-user-id',
          name: name,
          email: email,
          phone: '',
        }, 'mock-jwt-token');
        haptics.success();
        setLoading(false);
      }, 1500);
    } catch (e) {
      setLoading(false);
      Alert.alert('Registration Failed', 'Could not create account.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Typography heading weight="700" size={20} color={colors.text} style={styles.title}>JOIN THE ARCHIVE</Typography>
            <Typography weight="400" size={10} color={colors.textExtraLight} style={styles.subtitle}>START YOUR CURATED COLLECTION</Typography>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Typography size={7} weight="600" color={colors.textExtraLight} style={styles.label}>FULL NAME</Typography>
              <TextInput
                value={name}
                onChangeText={(v) => { setName(v); if (errors.name) setErrors({ ...errors, name: undefined }); }}
                placeholder="Charlotte Moss"
                placeholderTextColor={colors.textExtraLight}
                style={[
                  styles.input,
                  { color: colors.text, borderColor: errors.name ? colors.error : colors.borderLight },
                  isDark && { backgroundColor: 'rgba(255,255,255,0.03)' }
                ]}
              />
              {errors.name && <Typography size={8} color={colors.error} style={styles.errorText}>{errors.name}</Typography>}
            </View>

            <View style={styles.field}>
              <Typography size={7} weight="600" color={colors.textExtraLight} style={styles.label}>EMAIL ADDRESS</Typography>
              <TextInput
                value={email}
                onChangeText={(v) => { setEmail(v); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                placeholder="charlotte@example.com"
                placeholderTextColor={colors.textExtraLight}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[
                  styles.input,
                  { color: colors.text, borderColor: errors.email ? colors.error : colors.borderLight },
                  isDark && { backgroundColor: 'rgba(255,255,255,0.03)' }
                ]}
              />
              {errors.email && <Typography size={8} color={colors.error} style={styles.errorText}>{errors.email}</Typography>}
            </View>

            <View style={styles.field}>
              <Typography size={7} weight="600" color={colors.textExtraLight} style={styles.label}>PASSWORD</Typography>
              <TextInput
                value={password}
                onChangeText={(v) => { setPassword(v); if (errors.password) setErrors({ ...errors, password: undefined }); }}
                placeholder="••••••••"
                placeholderTextColor={colors.textExtraLight}
                secureTextEntry
                style={[
                  styles.input,
                  { color: colors.text, borderColor: errors.password ? colors.error : colors.borderLight },
                  isDark && { backgroundColor: 'rgba(255,255,255,0.03)' }
                ]}
              />
              {errors.password && <Typography size={8} color={colors.error} style={styles.errorText}>{errors.password}</Typography>}
            </View>

            <Typography size={8} color={colors.textMuted} style={styles.termsText}>
              By creating an account, you agree to Zica Bella's Terms of Service and Privacy Policy.
            </Typography>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.foreground }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Typography heading weight="700" size={11} color={colors.background}>CREATE ACCOUNT</Typography>
              )}
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Typography size={10} color={colors.textMuted}>Already have an account?</Typography>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Typography size={10} weight="600" color={colors.foreground} style={{ marginLeft: 6 }}>SIGN IN</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  header: { marginBottom: 40 },
  title: { letterSpacing: 4, marginBottom: 8 },
  subtitle: { letterSpacing: 3, opacity: 0.6 },
  form: { gap: 20 },
  field: { gap: 8 },
  label: { letterSpacing: 2, marginLeft: 4 },
  input: {
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: { marginLeft: 12, marginTop: 2 },
  termsText: {
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 14,
    paddingHorizontal: 16,
  },
  primaryButton: {
    height: 64,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
});
