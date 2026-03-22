// Sign in with Apple - requires expo-apple-authentication
// This is a placeholder that will work when running on a real iOS device

import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuthStore } from '../store/authStore';

export async function signInWithApple(): Promise<boolean> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // Extract user info from Apple credential
    const user = {
      id: credential.user,
      name: [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ') || 'Apple User',
      email: credential.email || '',
      phone: '',
    };

    // Save to auth store
    useAuthStore.getState().login(user);

    // In a production app, you would:
    // 1. Send credential.identityToken to your backend
    // 2. Validate with Apple's servers
    // 3. Create/update user in your database

    return true;
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      console.log('Apple Sign In cancelled');
    } else {
      console.error('Apple Sign In error:', error);
    }
    return false;
  }
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  return await AppleAuthentication.isAvailableAsync();
}
