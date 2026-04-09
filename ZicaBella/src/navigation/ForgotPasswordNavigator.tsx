import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ForgotEmailScreen from '../screens/auth/ForgotEmailScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

export type ForgotPasswordStackParamList = {
  ForgotEmail: undefined;
  OTPVerification: { email: string };
  ResetPassword: { email: string; otp: string };
};

const Stack = createNativeStackNavigator<ForgotPasswordStackParamList>();

export default function ForgotPasswordNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ForgotEmail" component={ForgotEmailScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}
