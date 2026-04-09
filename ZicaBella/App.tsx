import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { ConsentModal } from './src/components/ConsentModal';
import { useThemeStore } from './src/store/themeStore';
import { useFonts } from 'expo-font';
import { getColors } from './src/constants/colors';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ?? '';
const shouldEnableSentry =
  sentryDsn.length > 0 &&
  !sentryDsn.includes('mock');

if (shouldEnableSentry) {
  Sentry.init({
    dsn: sentryDsn,
    debug: false,
    tracesSampleRate: 1.0,
  });
}

// Keep the splash screen visible while we fetch resources if needed
SplashScreen.preventAutoHideAsync().catch(() => {});

function App() {
  const [fontsLoaded] = useFonts({
    'Rocaston': require('./assets/fonts/Rocaston.ttf'),
  });

  const theme = useThemeStore(state => state.theme);
  const isDark = theme === 'dark';
  const colors = getColors(theme);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"} 
          backgroundColor={colors.background}
          translucent 
        />
        <RootNavigator />
        <ConsentModal />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default shouldEnableSentry ? Sentry.wrap(App) : App;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
