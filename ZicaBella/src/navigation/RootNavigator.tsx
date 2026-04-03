import React, { useEffect, useMemo } from 'react';
import { NavigationContainer, createNavigationContainerRef, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import { View } from 'react-native';

import { useThemeStore } from '../store/themeStore';
import { getColors, useColors } from '../constants/colors';
import { useUIStore } from '../store/uiStore';

import TabNavigator from './TabNavigator';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CollectionScreen from '../screens/CollectionScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import PolicyScreen from '../screens/PolicyScreen';
import CommunityScreen from '../screens/CommunityScreen';
import StoryScreen from '../screens/StoryScreen';
import FAQScreen from '../screens/FAQScreen';
import BlogsScreen from '../screens/BlogsScreen';
import CollaborationsScreen from '../screens/CollaborationsScreen';
import WishlistScreen from '../screens/WishlistScreen';

export type RootStackParamList = {
  Main: undefined;
  ProductDetail: { handle: string };
  Collection: { handle: string; title?: string };
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  OrderHistory: { openReturnFor?: string } | undefined;
  OrderDetail: { orderForDetail: any };
  Policy: { url: string; title?: string };
  Community: undefined;
  Story: undefined;
  FAQ: undefined;
  Blogs: undefined;
  Collaborations: undefined;
  Wishlist: undefined;
};

export const navigationRef = createNavigationContainerRef<any>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Deep linking config
const linking = {
  prefixes: ['zicabella://', 'https://app.zicabella.com'],
  config: {
    screens: {
      Main: {
        screens: {
          HomeTab: '',
          SearchTab: 'search',
          CartTab: 'cart',
          ChatTab: 'chat',
          ProfileTab: 'profile',
        },
      },
      ProductDetail: 'products/:handle',
      Collection: 'collections/:handle',
      Policy: 'policy',
      Community: 'community',
      Checkout: 'checkout',
      OrderConfirmation: 'order-confirmation',
      OrderDetail: 'order-detail',
      Story: 'story',
      FAQ: 'faq',
      Blogs: 'blogs',
      Collaborations: 'collaborations',
      Wishlist: 'wishlist',
    },
  },
};

export const RootNavigator = () => {
  const { isCartOpen, setCartOpen } = useUIStore();

  // Shake to open/close cart — global, works from any screen
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let lastMagnitude: number | null = null;
    let lastShakeAt = 0;

    Accelerometer.setUpdateInterval(100);
    subscription = Accelerometer.addListener((data) => {
      const { x, y, z } = data;
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      if (lastMagnitude == null) {
        lastMagnitude = magnitude;
        return;
      }

      const delta = Math.abs(magnitude - lastMagnitude);
      lastMagnitude = magnitude;

      const now = Date.now();
      const COOLDOWN_MS = 1200; // Slightly increased cooldown for better toggle feel
      const SHAKE_THRESHOLD = 1.3;

      if (delta > SHAKE_THRESHOLD && now - lastShakeAt > COOLDOWN_MS) {
        lastShakeAt = now;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Toggle cart visibility
        setCartOpen(!useUIStore.getState().isCartOpen);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const themeStr = useThemeStore((state) => state.theme);
  const colors = useColors();
  const isDark = themeStr === 'dark';

  const navigationTheme = useMemo(() => {
    const palette = getColors(themeStr);
    const baseTheme = isDark ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      dark: isDark,
      colors: {
        ...baseTheme.colors,
        primary: palette.primary,
        background: palette.background,
        card: palette.surfaceElevated,
        text: palette.text,
        border: palette.border,
        notification: palette.cartBadge,
      },
    };
  }, [isDark, themeStr]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavigationContainer ref={navigationRef} linking={linking as any} theme={navigationTheme}>
        <Stack.Navigator id="RootStackNavigator" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
          {/* Core app with Tab Bar */}
          <Stack.Screen name="Main" component={TabNavigator} />
          
          {/* Flow-specific screens that hide the tab bar (standard practice for checkout) */}
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
          
          {/* These used to be at root, now TabNavigator will handle most via nested stacks if needed, 
              but for now we keep them here for deep linking while I update TabNavigator to include them.
          */}
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="Collection" component={CollectionScreen} />
          <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
          <Stack.Screen name="Policy" component={PolicyScreen} />
          <Stack.Screen name="Community" component={CommunityScreen} />
          <Stack.Screen name="Story" component={StoryScreen} />
          <Stack.Screen name="FAQ" component={FAQScreen} />
          <Stack.Screen name="Blogs" component={BlogsScreen} />
          <Stack.Screen name="Collaborations" component={CollaborationsScreen} />
          <Stack.Screen name="Wishlist" component={WishlistScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
};

export default RootNavigator;
