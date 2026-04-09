import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ServiceHistoryScreen from '../screens/service/ServiceHistoryScreen';
import ReturnWizardScreen from '../screens/service/ReturnWizardScreen';
import ExchangeWizardScreen from '../screens/service/ExchangeWizardScreen';
import ServiceDetailScreen from '../screens/service/ServiceDetailScreen';

export type ServiceStackParamList = {
  ServiceHistory: undefined;
  ReturnWizard: { orderId: string; initialItems?: string[] };
  ExchangeWizard: { orderId: string; initialItems?: string[] };
  ServiceDetail: { type: 'RETURN' | 'EXCHANGE'; id: string };
};

const Stack = createNativeStackNavigator<ServiceStackParamList>();

export const ServiceNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ServiceHistory" component={ServiceHistoryScreen} />
      <Stack.Screen name="ReturnWizard" component={ReturnWizardScreen} />
      <Stack.Screen name="ExchangeWizard" component={ExchangeWizardScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
    </Stack.Navigator>
  );
};

export default ServiceNavigator;
