import React, { useEffect, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { useCartStore } from '../store/cartStore';
import { useUIStore } from '../store/uiStore';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import CartScreen from '../screens/CartScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CollectionScreen from '../screens/CollectionScreen';
import CommunityScreen from '../screens/CommunityScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import PolicyScreen from '../screens/PolicyScreen';
import { BlurView } from 'expo-blur';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CartDrawer from '../components/CartDrawer';
import BookmarkDrawer from '../components/BookmarkDrawer';
import { useNavigation } from '@react-navigation/native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const { width } = Dimensions.get('window');

function HomeStack() {
  return (
    <Stack.Navigator id="HomeStack" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen as any} />
      <Stack.Screen name="Collection" component={CollectionScreen as any} />
      <Stack.Screen name="Community" component={CommunityScreen as any} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen as any} />
      <Stack.Screen name="Policy" component={PolicyScreen as any} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator id="SearchStack" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="SearchScreen" component={SearchScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen as any} />
      <Stack.Screen name="Collection" component={CollectionScreen as any} />
    </Stack.Navigator>
  );
}

function CustomTabBar({ state, descriptors, navigation, onCartPress }: any) {
  const isTabBarVisible = useUIStore(s => s.isTabBarVisible);
  const colors = useColors();
  const theme = useThemeStore(s => s.theme);
  const isDark = theme === 'dark';
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(isTabBarVisible ? 0 : 100, {
      duration: 300,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
    });
  }, [isTabBarVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[
      styles.tabBarContainer, 
      animatedStyle,
      { 
        backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.45)',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        shadowColor: isDark ? '#000' : 'rgba(0,0,0,0.08)'
      }
    ]}>
      <BlurView 
        intensity={95} 
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill} 
      />
      <View style={styles.tabContent}>
        {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          if (route.name === 'CartTab') {
            navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            // We intercept CartTab to do nothing in navigation, 
            // instead we rely on the custom onCartPress in TabNavigator root.
            return;
          }

          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const Icon = options.tabBarIcon;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={route.name === 'CartTab' ? onCartPress : onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            {Icon && Icon({ 
              focused: isFocused, 
              color: isFocused ? colors.tabActive : colors.tabInactive, 
              size: 20 
            })}
            <Text style={[
              styles.tabLabel, 
              { color: isFocused ? colors.tabActive : colors.tabInactive }
            ]}>
              {options.tabBarLabel}
            </Text>
            {options.tabBarBadge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{options.tabBarBadge}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
      </View>
    </Animated.View>
  );
}

export const TabNavigator = () => {
  const itemCount = useCartStore((s) => s.itemCount());
  const { isCartOpen, setCartOpen, isBookmarkOpen, setBookmarkOpen } = useUIStore();
  const rootNavigation = useNavigation<any>();

  return (
    <>
      <Tab.Navigator
        id="MainTabNavigator"
        tabBar={(props) => <CustomTabBar {...props} onCartPress={() => setCartOpen(true)} />}
        screenOptions={{
          headerShown: false,
        }}
      >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStack}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: ({ color }) => <Ionicons name="bag-outline" size={20} color={color} />,
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{
          tabBarLabel: 'Zica AI',
          tabBarIcon: ({ color }) => <Ionicons name="sparkles-outline" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={20} color={color} />,
        }}
      />
    </Tab.Navigator>
    <CartDrawer 
      visible={isCartOpen} 
      onClose={() => setCartOpen(false)} 
      onCheckout={() => {
        setCartOpen(false);
        rootNavigation.navigate('Checkout');
      }}
    />
    <BookmarkDrawer
      visible={isBookmarkOpen}
      onClose={() => setBookmarkOpen(false)}
    />
    {!useUIStore(s => s.isTabBarVisible) && (
      <TouchableOpacity 
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, zIndex: 999 }} 
        onPress={() => useUIStore.getState().setTabBarVisible(true)}
      />
    )}
    </>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden', // Required for BlurView corners
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  tabContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    minWidth: 60,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
});

export default TabNavigator;
