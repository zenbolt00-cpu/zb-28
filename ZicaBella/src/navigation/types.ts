/**
 * Centralized navigation types to break circular dependencies.
 * All screen components should import types from here rather than from navigators.
 */

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPasswordFlow: undefined;
  PrivacyAndTerms: { type: 'privacy' | 'terms' };
};

export type TabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
  ShopTab: undefined;
  OrdersTab: undefined;
};

export type CheckoutStackParamList = {
  BagReview: undefined;
  DeliveryAddress: undefined;
  DeliveryMethod: undefined;
  Payment: undefined;
  OrderReview: undefined;
};

export type ServiceStackParamList = {
  ServiceHistory: undefined;
  ReturnWizard: { orderId: string; initialItems?: string[] };
  ExchangeWizard: { orderId: string; initialItems?: string[] };
  ServiceDetail: { type: 'RETURN' | 'EXCHANGE'; id: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ProductDetail: { handle: string };
  Collection: { handle: string; title?: string };
  CheckoutFlow: undefined;
  ServiceFlow: undefined;
  OrderConfirmation: { orderId: string };
  OrderHistory: { openReturnFor?: string } | undefined;
  OrderDetail: { orderForDetail: any };
  Policy: { url: string; title?: string };
  Community: undefined;
  Story: undefined;
  FAQ: undefined;
  Blogs: undefined;
  Collaborations: undefined;
  Wishlist: undefined;
};
