import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigator from './src/navigation/RootNavigator';
import { initPushNotifications } from './src/utils/notifications';

// Keep the splash screen visible while we fetch resources if needed
SplashScreen.preventAutoHideAsync().catch(() => {});

import { useThemeStore } from './src/store/themeStore';
import { useFonts } from 'expo-font';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Rocaston': require('./assets/fonts/Rocaston.ttf'),
    'Poppins': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
  });

  const theme = useThemeStore(state => state.theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded) {
      initPushNotifications().catch((e) => {
        console.warn('initPushNotifications failed:', e);
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"} 
          backgroundColor="transparent" 
          translucent 
        />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
