import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { useCartStore } from '../store/cartStore';
import { useUIStore } from '../store/uiStore';
import { TabParamList } from './types';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CollectionScreen from '../screens/CollectionScreen';
import CommunityScreen from '../screens/CommunityScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import PolicyScreen from '../screens/PolicyScreen';
import ShopScreen from '../screens/ShopScreen';
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

function CustomTabBar({ state, descriptors, navigation }: any) {
  const isTabBarVisible = useUIStore(s => s.isTabBarVisible);
  const colors = useColors();
  const theme = useThemeStore(s => s.theme);
  const isDark = theme === 'dark';
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(isTabBarVisible ? 0 : 120, {
      duration: 400,
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
    ]}>
      <BlurView 
        intensity={isDark ? 50 : 80} 
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill} 
      />
      <View style={[styles.tabContent, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
        {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
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
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, isFocused && styles.activeIconWrapper]}>
               {Icon && Icon({ 
                 focused: isFocused, 
                 color: isFocused ? colors.text : colors.textExtraLight, 
                 size: 18 
               })}
            </View>
            <Text 
              numberOfLines={1}
              style={[
                styles.tabLabel, 
                { color: isFocused ? colors.text : colors.textExtraLight, opacity: isFocused ? 0.9 : 0.4 }
              ]}
            >
              {options.tabBarLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
      </View>
    </Animated.View>
  );
}

export const TabNavigator = () => {
  const { isCartOpen, setCartOpen, isBookmarkOpen, setBookmarkOpen } = useUIStore();
  const rootNavigation = useNavigation<any>();

  return (
    <>
      <Tab.Navigator
        id="MainTabNavigator"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={18} color={color} />,
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStack}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={18} color={color} />,
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{
          tabBarLabel: 'AI Chat',
          tabBarIcon: ({ color }) => <Ionicons name="sparkles-outline" size={18} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={18} color={color} />,
        }}
      />
    </Tab.Navigator>
    <CartDrawer 
      visible={isCartOpen} 
      onClose={() => setCartOpen(false)} 
      onCheckout={() => {
        setCartOpen(false);
        setTimeout(() => rootNavigation.navigate('CheckoutFlow'), 300);
      }}
    />
    <BookmarkDrawer
      visible={isBookmarkOpen}
      onClose={() => setBookmarkOpen(false)}
    />
    </>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  tabContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 30,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  activeIconWrapper: {
    // Subtle background for active tab if needed
  },
  tabLabel: {
    fontSize: 6.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});

export default TabNavigator;
