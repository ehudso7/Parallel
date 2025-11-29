import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

export const initializePurchases = async (userId?: string) => {
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

  if (!apiKey) {
    console.warn('RevenueCat API key not configured');
    return;
  }

  try {
    await Purchases.configure({ apiKey });

    if (userId) {
      await Purchases.logIn(userId);
    }
  } catch (error) {
    console.error('Error initializing purchases:', error);
  }
};

export const getOfferings = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return null;
  }
};

export const purchasePackage = async (pkg: PurchasesPackage) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { customerInfo, error: null };
  } catch (error: any) {
    if (error.userCancelled) {
      return { customerInfo: null, error: null };
    }
    return { customerInfo: null, error };
  }
};

export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { customerInfo, error: null };
  } catch (error) {
    return { customerInfo: null, error };
  }
};

export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('Error fetching customer info:', error);
    return null;
  }
};

export const checkSubscriptionStatus = async () => {
  const customerInfo = await getCustomerInfo();
  if (!customerInfo) return { isSubscribed: false, tier: 'free' };

  const activeSubscriptions = customerInfo.activeSubscriptions;

  if (activeSubscriptions.includes('studio')) {
    return { isSubscribed: true, tier: 'studio' };
  }
  if (activeSubscriptions.includes('unlimited')) {
    return { isSubscribed: true, tier: 'unlimited' };
  }
  if (activeSubscriptions.includes('pro')) {
    return { isSubscribed: true, tier: 'pro' };
  }
  if (activeSubscriptions.includes('basic')) {
    return { isSubscribed: true, tier: 'basic' };
  }

  return { isSubscribed: false, tier: 'free' };
};

// Credit packages (one-time purchases)
export const CREDIT_PACKAGES = [
  { id: 'credits_100', credits: 100, price: '$0.99' },
  { id: 'credits_500', credits: 500, price: '$3.99' },
  { id: 'credits_1200', credits: 1200, price: '$7.99' },
  { id: 'credits_3000', credits: 3000, price: '$14.99' },
  { id: 'credits_10000', credits: 10000, price: '$39.99' },
];

// Subscription tiers
export const SUBSCRIPTION_TIERS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$9.99/mo',
    credits: 500,
    features: [
      '500 monthly credits',
      '5 AI personas',
      'Basic content generation',
      'Standard support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$24.99/mo',
    credits: 2000,
    features: [
      '2,000 monthly credits',
      '20 AI personas',
      'HD content generation',
      'Priority support',
      'Early access features',
    ],
    popular: true,
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '$49.99/mo',
    credits: 5000,
    features: [
      '5,000 monthly credits',
      'Unlimited AI personas',
      '4K content generation',
      'API access',
      'Priority support',
      'Custom personas',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    price: '$99.99/mo',
    credits: 999999,
    features: [
      'Unlimited credits',
      'Unlimited everything',
      'White-label options',
      'Dedicated support',
      'Custom integrations',
      'Team collaboration',
    ],
  },
];
