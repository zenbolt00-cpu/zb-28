import React, { useEffect, useMemo } from 'react';
import { NavigationContainer, createNavigationContainerRef, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import { View } from 'react-native';

import { useThemeStore } from '../store/themeStore';
import { getColors, useColors } from '../constants/colors';
import { useUIStore } from '../store/uiStore';

import { useAuthStore } from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import CheckoutNavigator from './CheckoutNavigator';
import ServiceNavigator from './ServiceNavigator';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CollectionScreen from '../screens/CollectionScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import PolicyScreen from '../screens/PolicyScreen';
import CommunityScreen from '../screens/CommunityScreen';
import StoryScreen from '../screens/StoryScreen';
import FAQScreen from '../screens/FAQScreen';
import BlogsScreen from '../screens/BlogsScreen';
import CollaborationsScreen from '../screens/CollaborationsScreen';
import WishlistScreen from '../screens/WishlistScreen';
import { withErrorBoundary } from '../components/ErrorBoundary';
import { RootStackParamList } from './types';
import { navigationRef } from './navigationUtils';

// Wrap every screen with an error boundary so the app never white-screen crashes
const SafeOrderConfirmation = withErrorBoundary(OrderConfirmationScreen, 'OrderConfirmation');
const SafeProductDetail = withErrorBoundary(ProductDetailScreen, 'ProductDetail');
const SafeCollection = withErrorBoundary(CollectionScreen, 'Collection');
const SafeOrderHistory = withErrorBoundary(OrderHistoryScreen, 'OrderHistory');
const SafeOrderDetail = withErrorBoundary(OrderDetailScreen, 'OrderDetail');
const SafePolicy = withErrorBoundary(PolicyScreen, 'Policy');
const SafeCommunity = withErrorBoundary(CommunityScreen, 'Community');
const SafeStory = withErrorBoundary(StoryScreen, 'Story');
const SafeFAQ = withErrorBoundary(FAQScreen, 'FAQ');
const SafeBlogs = withErrorBoundary(BlogsScreen, 'Blogs');
const SafeCollaborations = withErrorBoundary(CollaborationsScreen, 'Collaborations');
const SafeWishlist = withErrorBoundary(WishlistScreen, 'Wishlist');

// Types moved to ./types.ts to break circular dependencies

// navigationRef moved to ./navigationUtils to break circular dependencies
const Stack = createNativeStackNavigator<RootStackParamList>();

// Deep linking config
const linking = {
  prefixes: ['zicabella://', 'https://app.zicabella.com'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
        },
      },
      Main: {
        screens: {
          HomeTab: '',
          SearchTab: 'search',
          ShopTab: 'shop',
          OrdersTab: 'orders',
          ProfileTab: 'profile',
        },
      },
      ProductDetail: 'products/:handle',
      Collection: 'collections/:handle',
      CheckoutFlow: 'checkout',
      OrderConfirmation: 'order-confirmation',
    },
  },
};

export const RootNavigator = () => {
  const { isCartOpen, setCartOpen } = useUIStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

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
      const COOLDOWN_MS = 1200;
      const SHAKE_THRESHOLD = 1.3;

      if (delta > SHAKE_THRESHOLD && now - lastShakeAt > COOLDOWN_MS) {
        lastShakeAt = now;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        <Stack.Navigator id="RootStackNavigator" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          {/* Conditional Root: Auth or App */}
          {!isAuthenticated ? (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) : (
            <Stack.Screen name="Main" component={TabNavigator} />
          )}
          
          {/* Flow-specific stacks and full-screen views */}
          <Stack.Screen name="CheckoutFlow" component={CheckoutNavigator} />
          <Stack.Screen name="ServiceFlow" component={ServiceNavigator} />
          <Stack.Screen name="OrderConfirmation" component={SafeOrderConfirmation} />
          
          <Stack.Screen name="ProductDetail" component={SafeProductDetail} />
          <Stack.Screen name="Collection" component={SafeCollection} />
          <Stack.Screen name="OrderHistory" component={SafeOrderHistory} />
          <Stack.Screen name="OrderDetail" component={SafeOrderDetail} />
          <Stack.Screen name="Policy" component={SafePolicy} />
          <Stack.Screen name="Community" component={SafeCommunity} />
          <Stack.Screen name="Story" component={SafeStory} />
          <Stack.Screen name="FAQ" component={SafeFAQ} />
          <Stack.Screen name="Blogs" component={SafeBlogs} />
          <Stack.Screen name="Collaborations" component={SafeCollaborations} />
          <Stack.Screen name="Wishlist" component={SafeWishlist} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
};

export default RootNavigator;
