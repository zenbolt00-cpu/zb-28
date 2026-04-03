import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { sendOTP, verifyOTP, signOut } from '../auth/firebase';
import { signInWithApple, isAppleSignInAvailable } from '../auth/apple';
import { haptics } from '../utils/haptics';
import { config } from '../constants/config';
import { navigationRef } from '../navigation/RootNavigator';
import { useUIStore } from '../store/uiStore';
import { Typography } from '../components/Typography';
import { useRef } from 'react';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useThemeStore } from '../store/themeStore';
import { useBookmarkStore } from '../store/bookmarkStore';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const { user, isAuthenticated, biometricEnabled, login, logout, setBiometric, updateUser } = useAuth();
  const theme = useThemeStore(s => s.theme);
  const setTabBarVisible = useUIStore(s => s.setTabBarVisible);
  const { bookmarks } = useBookmarkStore();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [profileImage, setProfileImage] = useState<string | undefined>(user?.image);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const lastScrollY = useRef(0);

  useEffect(() => {
    if (isAuthenticated && user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setProfileImage(user.image);

      // Fetch Latest Profile & Orders
      const fetchProfile = async () => {
        try {
          const params = new URLSearchParams();
          if (user.id) params.set('customerId', user.id);
          if (user.phone) params.set('phone', user.phone);
          if (user.email) params.set('email', user.email);

          const [profileRes, ordersRes, addrRes] = await Promise.all([
            fetch(`${config.appUrl}/api/app/profile?${params.toString()}`),
            fetch(`${config.appUrl}/api/app/orders?${params.toString()}&limit=10&offset=0`),
            fetch(`${config.appUrl}/api/app/customers/addresses?${params.toString()}`),
          ]);

          const profileJson = await profileRes.json().catch(() => ({}));
          if (profileRes.ok && profileJson?.customer) {
            updateUser({
              name: profileJson.customer.name || user.name,
              email: profileJson.customer.email || user.email,
              phone: profileJson.customer.phone || user.phone,
              image: profileJson.customer.image || undefined,
              isCommunityMember: !!profileJson.customer.isCommunityMember,
            });
            setProfileImage(profileJson.customer.image || undefined);
          }

          const ordersJson = await ordersRes.json().catch(() => ({}));
          if (ordersRes.ok && ordersJson.orders) {
            setOrderCount((ordersJson.page?.total as number) ?? ordersJson.orders.length);
          }

          const addrJson = await addrRes.json().catch(() => ({}));
          if (addrRes.ok && Array.isArray(addrJson.addresses)) {
            setSavedAddresses(addrJson.addresses);
          }
        } catch (e) {
          console.error('Fetch profile orders error:', e);
        }
      };
      
      fetchProfile();
    }
  }, [isAuthenticated, user?.id]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${config.appUrl}/api/app/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId: user.id,
          name: editName,
          email: editEmail,
          phone: user.phone,
          image: profileImage,
        }),
      });

      if (res.ok) {
        updateUser({ name: editName, email: editEmail });
        setIsEditing(false);
        haptics.success();
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handlePickAvatar = async () => {
    if (!user) return;
    haptics.buttonTap();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', 'Photo access is required to update your profile photo.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];

    setLoading(true);
    try {
      const form = new FormData();
      (form as any).append('file', {
        uri: a.uri,
        type: a.mimeType || 'image/jpeg',
        name: a.fileName || 'avatar.jpg',
      } as any);
      const upload = await fetch(`${config.appUrl}/api/admin/upload-image`, {
        method: 'POST',
        body: form as any,
      });
      const upJson = await upload.json();
      if (!upload.ok) throw new Error(upJson.error || 'Upload failed');
      const url = upJson.url as string;
      setProfileImage(url);
      updateUser({ image: url });
      await fetch(`${config.appUrl}/api/app/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: user.id, image: url }),
      });
      haptics.success();
    } catch (e: any) {
      haptics.error();
      Alert.alert('Error', e.message || 'Failed to update photo');
    } finally {
      setLoading(false);
    }
  };

  const onScroll = (event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;
    
    if (Math.abs(diff) > 5) {
      if (diff > 0 && currentY > 100) {
        setTabBarVisible(false);
      } else {
        setTabBarVisible(true);
      }
    }
    lastScrollY.current = currentY;
  };

  const handleSendOTP = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    const success = await sendOTP(phone);
    if (success) {
      setOtpSent(true);
    } else {
      Alert.alert('Error', 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) return;
    setLoading(true);
    const success = await verifyOTP(phone, otp);
    if (success) {
      haptics.success();
    } else {
      Alert.alert('Error', 'Invalid OTP');
      haptics.error();
    }
    setLoading(false);
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    const success = await signInWithApple();
    if (success) haptics.success();
    setLoading(false);
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity',
        fallbackLabel: 'Use passcode',
      });
      if (result.success) {
        setBiometric(true);
        haptics.success();
      }
    } else {
      setBiometric(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          signOut();
          setOtpSent(false);
          setPhone('');
          setOtp('');
        },
      },
    ]);
  };

  const navigatePolicy = (type: 'privacy' | 'refund' | 'shipping' | 'terms') => {
    const titles: Record<string, string> = {
      privacy: 'Privacy Policy',
      refund: 'Refund Policy',
      shipping: 'Shipping Policy',
      terms: 'Terms of Service',
    };
    haptics.buttonTap();
    if (navigationRef.isReady()) {
      navigationRef.navigate('Policy', { url: config.policies[type], title: titles[type] });
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 60, paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.loginHeader}>
            <View style={[styles.logoDot, { backgroundColor: colors.foreground }]} />
            <Typography heading weight="700" size={18} color={colors.text} style={styles.loginTitle}>ZICA BELLA</Typography>
            <Typography weight="400" size={8} color={colors.textExtraLight} style={styles.loginSubtitle}>ARCHIVAL EXCELLENCE</Typography>
          </View>

          <BlurView 
            intensity={theme === 'dark' ? 10 : 60} 
            tint={theme} 
            style={[
              styles.loginCard, 
              { 
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.4)'
              }
            ]}
          >
            <Typography weight="300" size={14} color={colors.textSecondary} style={styles.welcomeText}>Sign in to your account</Typography>
            
            <View style={styles.formSection}>
              <Typography heading size={7} color={colors.textExtraLight} style={styles.formLabel}>PHONE NUMBER</Typography>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 00000 00000"
                placeholderTextColor={colors.textExtraLight}
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
                keyboardType="phone-pad"
              />

              {otpSent && (
                <View style={{ marginTop: 20 }}>
                  <Typography heading size={7} color={colors.textExtraLight} style={styles.formLabel}>VERIFICATION CODE</Typography>
                  <TextInput
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="0 0 0 0 0 0"
                    placeholderTextColor={colors.textExtraLight}
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.foreground }]}
                onPress={otpSent ? handleVerifyOTP : handleSendOTP}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Typography heading weight="700" size={9} color={colors.background}>
                  {loading ? 'PROCESSING' : otpSent ? 'CONFIRM OTP' : 'SEND CODE'}
                </Typography>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.borderLight }]} />
              <Typography weight="300" size={8} color={colors.textExtraLight} style={{ paddingHorizontal: 12 }}>OR</Typography>
              <View style={[styles.dividerLine, { backgroundColor: colors.borderLight }]} />
            </View>

            <TouchableOpacity
              style={[styles.appleButton, { backgroundColor: colors.text }]}
              onPress={handleAppleSignIn}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-apple" size={16} color={colors.background} />
              <Typography heading weight="600" size={9} color={colors.background} style={{ marginLeft: 6 }}>SIGN IN WITH APPLE</Typography>
            </TouchableOpacity>
          </BlurView>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  // Logged in view
  const goRoot = (name: 'OrderHistory' | 'Wishlist' | 'Community') => {
    haptics.buttonTap();
    if (navigationRef.isReady()) {
      navigationRef.navigate(name as never);
    }
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: 'receipt-outline' as const, label: 'Order History', onPress: () => goRoot('OrderHistory') },
        { icon: 'heart-outline' as const, label: 'Wishlist', onPress: () => goRoot('Wishlist') },
        { icon: 'people-outline' as const, label: 'Community', onPress: () => goRoot('Community') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'finger-print-outline' as const, label: 'Face ID / Touch ID', type: 'toggle' as const, value: biometricEnabled, onToggle: handleBiometricToggle },
      ],
    },
    {
      title: 'Legal',
      items: [
        { icon: 'shield-outline' as const, label: 'Privacy Policy', onPress: () => navigatePolicy('privacy') },
        { icon: 'document-text-outline' as const, label: 'Terms of Service', onPress: () => navigatePolicy('terms') },
        { icon: 'refresh-outline' as const, label: 'Refund Policy', onPress: () => navigatePolicy('refund') },
        { icon: 'car-outline' as const, label: 'Shipping Policy', onPress: () => navigatePolicy('shipping') },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 40, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.profileHeader}>
          <TouchableOpacity activeOpacity={0.8} onPress={handlePickAvatar}>
            <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme} style={[styles.avatarGlass, { borderColor: colors.borderLight }]}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={250}
                />
              ) : (
                <Typography heading weight="700" size={24} color={colors.text}>
                  {(user?.name || 'U')[0].toUpperCase()}
                </Typography>
              )}
              <View style={styles.avatarEditDot}>
                <Ionicons name="pencil" size={12} color={colors.background} />
              </View>
            </BlurView>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Typography heading weight="600" size={18} color={colors.text}>{user?.name || 'ZICA USER'}</Typography>
            <Typography weight="300" size={10} color={colors.textLight} style={{ letterSpacing: 1 }}>{user?.phone || user?.email || 'MEMBER SINCE 2024'}</Typography>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Typography heading size={11} color={colors.text} style={{ letterSpacing: 2 }}>
              {String(orderCount).padStart(2, '0')}
            </Typography>
            <Typography size={6.5} color={colors.textExtraLight} weight="400">ORDERS</Typography>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Wishlist')}>
            <Typography heading size={11} color={colors.text} style={{ letterSpacing: 2 }}>
               {String(bookmarks.length).padStart(2, '0')}
            </Typography>
            <Typography size={6.5} color={colors.textExtraLight} weight="400">WISHLIST</Typography>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.statItem}>
             <Typography heading size={11} color={colors.text} style={{ letterSpacing: 2 }}>{user?.isCommunityMember ? 'YES' : 'NO'}</Typography>
             <Typography size={6.5} color={colors.textExtraLight} weight="400">MEMBER</Typography>
          </View>
        </View>

        {/* Quick tiles */}
        <View style={styles.sectionContainer}>
          <Typography heading size={7} color={colors.textLight} style={styles.sectionTitle}>ACCOUNT</Typography>
          <BlurView intensity={theme === 'dark' ? 10 : 40} tint={theme} style={[styles.menuGlass, { borderColor: colors.borderLight }]}>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]} onPress={() => goRoot('OrderHistory')} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
                <Ionicons name="receipt-outline" size={16} color={colors.text} />
              </View>
              <Typography weight="500" size={12} color={colors.text} style={styles.menuLabel}>My Orders</Typography>
              <Ionicons name="chevron-forward" size={14} color={colors.textExtraLight} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]} onPress={() => goRoot('Wishlist')} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
                <Ionicons name="heart-outline" size={16} color={colors.text} />
              </View>
              <Typography weight="500" size={12} color={colors.text} style={styles.menuLabel}>Wishlist</Typography>
              <Ionicons name="chevron-forward" size={14} color={colors.textExtraLight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => goRoot('Community')} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
                <Ionicons name="people-outline" size={16} color={colors.text} />
              </View>
              <Typography weight="500" size={12} color={colors.text} style={styles.menuLabel}>Community</Typography>
              <Ionicons name="chevron-forward" size={14} color={colors.textExtraLight} />
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Saved Addresses */}
        <View style={styles.sectionContainer}>
          <Typography heading size={7} color={colors.textLight} style={styles.sectionTitle}>SAVED ADDRESSES</Typography>
          <BlurView intensity={theme === 'dark' ? 10 : 40} tint={theme} style={[styles.menuGlass, { borderColor: colors.borderLight }]}>
            {savedAddresses.length === 0 ? (
              <View style={[styles.menuItem, { justifyContent: 'space-between' }]}>
                <Typography weight="500" size={12} color={colors.textMuted} style={styles.menuLabel}>
                  No saved addresses yet (add one at checkout).
                </Typography>
              </View>
            ) : (
              savedAddresses.slice(0, 2).map((a, idx) => (
                <View
                  key={`${a.address1 || idx}`}
                  style={[
                    styles.menuItem,
                    idx < Math.min(savedAddresses.length, 2) - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.borderLight,
                    },
                  ]}
                >
                  <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
                    <Ionicons name="location-outline" size={16} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography weight="600" size={12} color={colors.text} numberOfLines={1}>
                      {a.name || user?.name || 'Address'}
                    </Typography>
                    <Typography weight="500" size={10} color={colors.textMuted} numberOfLines={2}>
                      {`${a.address1 || ''}${a.city ? `, ${a.city}` : ''}${a.state ? `, ${a.state}` : ''}`}
                    </Typography>
                  </View>
                </View>
              ))
            )}
          </BlurView>
        </View>

        {/* Edit Profile Section */}
        <View style={styles.sectionContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Typography heading size={7} color={colors.textLight} style={styles.sectionTitle}>PERSONAL DETAILS</Typography>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Typography size={7} color={colors.foreground} weight="600">{isEditing ? 'CANCEL' : 'EDIT'}</Typography>
            </TouchableOpacity>
          </View>

          <BlurView 
            intensity={theme === 'dark' ? 10 : 40} 
            tint={theme} 
            style={[styles.menuGlass, { borderColor: colors.borderLight }]}
          >
            <View style={styles.editForm}>
              <View style={styles.editField}>
                <Typography size={7} color={colors.textExtraLight} style={styles.fieldLabel}>FULL NAME</Typography>
                {isEditing ? (
                  <TextInput 
                    value={editName}
                    onChangeText={setEditName}
                    style={[styles.editInput, { color: colors.text, borderBottomColor: colors.borderLight }]}
                  />
                ) : (
                  <Typography size={12} color={colors.text}>{user?.name || 'Set Name'}</Typography>
                )}
              </View>
              <View style={[styles.fieldDivider, { backgroundColor: colors.borderLight }]} />
              <View style={styles.editField}>
                <Typography size={7} color={colors.textExtraLight} style={styles.fieldLabel}>EMAIL ADDRESS</Typography>
                {isEditing ? (
                  <TextInput 
                    value={editEmail}
                    onChangeText={setEditEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.editInput, { color: colors.text, borderBottomColor: colors.borderLight }]}
                  />
                ) : (
                  <Typography size={12} color={colors.text}>{user?.email || 'Set Email'}</Typography>
                )}
              </View>
            </View>
          </BlurView>
          
          {isEditing && (
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: colors.foreground }]}
              onPress={handleSaveProfile}
              disabled={loading}
            >
              <Typography heading size={8} weight="700" color={colors.background}>
                {loading ? 'SAVING...' : 'SAVE CHANGES'}
              </Typography>
            </TouchableOpacity>
          )}
        </View>

        {menuSections.map((section) => (
          <View key={section.title} style={styles.sectionContainer}>
            <Typography heading size={7} color={colors.textLight} style={styles.sectionTitle}>{section.title.toUpperCase()}</Typography>
            <BlurView 
              intensity={theme === 'dark' ? 10 : 40} 
              tint={theme} 
              style={[
                styles.menuGlass,
                {
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(120,120,120,0.1)',
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.3)'
                }
              ]}
            >
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    idx < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
                  ]}
                  onPress={'onPress' in item ? (item as any).onPress : undefined}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
                    <Ionicons name={item.icon} size={16} color={colors.text} />
                  </View>
                  <Typography weight="400" size={12} color={colors.text} style={styles.menuLabel}>{item.label}</Typography>
                  {'type' in item && item.type === 'toggle' ? (
                    <Switch
                      value={(item as any).value}
                      onValueChange={(item as any).onToggle}
                      trackColor={{ true: colors.foreground }}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={14} color={colors.textExtraLight} />
                  )}
                </TouchableOpacity>
              ))}
            </BlurView>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity 
          style={[styles.logoutBtn, { borderColor: colors.error + '40' }]} 
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={16} color={colors.error} />
          <Typography weight="500" size={11} color={colors.error}>SIGN OUT</Typography>
        </TouchableOpacity>

        <Typography weight="300" size={8} color={colors.textExtraLight} style={styles.versionText}>ZICA ARCHIVE v1.0.4</Typography>

        <View style={{ height: 120 + insets.bottom }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 16,
  },
  loginTitle: {
    letterSpacing: 8,
    marginBottom: 4,
  },
  loginSubtitle: {
    letterSpacing: 4,
    opacity: 0.6,
  },
  loginCard: {
    borderRadius: 32,
    padding: 32,
    overflow: 'hidden',
    borderWidth: 1,
  },
  welcomeText: {
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  formSection: {
    width: '100%',
  },
  formLabel: {
    letterSpacing: 2,
    marginBottom: 10,
    marginLeft: 4,
  },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    fontSize: 13,
    borderWidth: 1,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
  appleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarGlass: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 20,
    overflow: 'hidden',
  },
  avatarEditDot: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 8,
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 20,
    opacity: 0.3,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    letterSpacing: 3,
    marginBottom: 12,
    marginLeft: 4,
    opacity: 0.8,
  },
  menuGlass: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    letterSpacing: 0.3,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 32,
  },
  versionText: {
    textAlign: 'center',
    letterSpacing: 4,
    opacity: 0.4,
  },
  editForm: {
    padding: 24,
    gap: 20,
  },
  editField: {
    gap: 8,
  },
  fieldLabel: {
    letterSpacing: 2,
    opacity: 0.6,
    marginBottom: 4,
  },
  editInput: {
    fontSize: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  fieldDivider: {
    height: 1,
    opacity: 0.1,
  },
  saveBtn: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
