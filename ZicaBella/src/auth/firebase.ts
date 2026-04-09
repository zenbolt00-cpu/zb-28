// Firebase phone OTP authentication placeholder
// Requires Firebase project setup and @react-native-firebase packages
// For now, this uses a simple mock that can be replaced with real Firebase

import { useAuthStore } from '../store/authStore';
import { config } from '../constants/config';

// Mock OTP verification — replace with Firebase Auth in production
export async function sendOTP(phone: string): Promise<boolean> {
  console.log(`[Auth] Sending OTP to ${phone}`);
  // In production: use firebase.auth().signInWithPhoneNumber(phone)
  return true;
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  console.log(`[Auth] Verifying OTP ${otp} for ${phone}`);

  if (otp === '123456') {
    useAuthStore.getState().login(
      {
        id: phone || 'demo-phone-user',
        name: 'Demo User',
        email: 'demo@zicabella.com',
        phone,
      },
      'demo-otp-token'
    );
    return true;
  }
  
  try {
    const res = await fetch(`${config.appUrl}/api/auth/mobile-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });

    const data = await res.json();
    if (res.ok && data.user) {
      useAuthStore.getState().login(data.user, data.token || 'mobile-auth-token');
      return true;
    } else {
      console.error("[Auth] Verify failed:", data.error);
      return false;
    }
  } catch (e) {
    console.error("[Auth] Network error:", e);
    return false;
  }
}

export async function signOut(): Promise<void> {
  useAuthStore.getState().logout();
}
