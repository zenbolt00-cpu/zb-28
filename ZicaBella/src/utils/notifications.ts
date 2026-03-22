import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

import Constants from 'expo-constants';

export const initPushNotifications = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    // `@react-native-firebase/messaging` and native notifications are not fully supported on some simulators without code signing.
    const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
    const isSimulator = !Constants.isDevice;
    
    // Explicit safety check: never try to load native firebase modules in Expo Go
    if (isExpoGo || isSimulator) {
      console.log('[Notifications] Running in simulator or Expo Go, skipping full Firebase notification setup.');
      return;
    }

    let messaging: any;
    try {
      messaging = require('@react-native-firebase/messaging').default;
    } catch (e) {
      console.warn('[Notifications] Failed to load @react-native-firebase/messaging:', e);
      return;
    }

    await messaging().requestPermission();

    const token = await messaging().getToken();
    console.log('FCM Token:', token); // save to backend

    messaging().onMessage(async (msg: any) => {
      Notifications.scheduleNotificationAsync({
        content: {
          title: msg.notification?.title ?? 'Zica Bella',
          body: msg.notification?.body ?? '',
        },
        trigger: null,
      });
    });
  } catch (err) {
    console.warn('[Notifications] Global catch caught an error (likely keychain/entitlement in simulator):', err);
  }
};

