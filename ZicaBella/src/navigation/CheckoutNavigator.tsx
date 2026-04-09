import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BagReviewScreen from '../screens/checkout/BagReviewScreen';
import DeliveryAddressScreen from '../screens/checkout/DeliveryAddressScreen';
import DeliveryMethodScreen from '../screens/checkout/DeliveryMethodScreen';
import PaymentScreen from '../screens/checkout/PaymentScreen';
import OrderReviewScreen from '../screens/checkout/OrderReviewScreen';

// Types moved to types.ts to break circular dependencies
import { CheckoutStackParamList } from './types';

const Stack = createNativeStackNavigator<CheckoutStackParamList>();

export default function CheckoutNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="BagReview" component={BagReviewScreen} />
      <Stack.Screen name="DeliveryAddress" component={DeliveryAddressScreen} />
      <Stack.Screen name="DeliveryMethod" component={DeliveryMethodScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="OrderReview" component={OrderReviewScreen} />
    </Stack.Navigator>
  );
}
