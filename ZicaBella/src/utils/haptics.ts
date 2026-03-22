import * as Haptics from 'expo-haptics';

export const haptics = {
  addToCart: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  buttonTap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  quantityChange: () => Haptics.selectionAsync(),
  cartShake: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
};
