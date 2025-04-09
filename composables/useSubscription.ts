import { ref, computed } from 'vue';
import { useAuth } from './useAuth';

// Define subscription plan types
export type SubscriptionPlanType = 'free' | 'standard' | 'premium';

// Define subscription plan interface
export interface SubscriptionPlan {
  value: SubscriptionPlanType;
  label: string;
  description: string;
  price: string;
  numericPrice: number;
  clientLimit: number | null;
  features: string[];
}

export function useSubscription() {
  const { user, isSubscriptionActive } = useAuth();
  
  // Define available subscription plans
  const subscriptionPlans = ref<SubscriptionPlan[]>([
    {
      value: 'free',
      label: 'Free Plan',
      description: 'Basic plan for small tailoring businesses',
      price: '₦0/month',
      numericPrice: 0,
      clientLimit: 100,
      features: [
        'Up to 100 clients',
        'Basic measurements',
        'Payment tracking'
      ]
    },
    {
      value: 'standard',
      label: 'Standard Plan',
      description: 'Standard plan for growing tailoring businesses',
      price: '₦5,000/month',
      numericPrice: 5000,
      clientLimit: 500,
      features: [
        'Up to 500 clients',
        'Advanced measurements',
        'Payment tracking',
        'Style catalog',
        'Email notifications'
      ]
    },
    {
      value: 'premium',
      label: 'Premium Plan',
      description: 'Premium plan for established tailoring businesses',
      price: '₦10,000/month',
      numericPrice: 10000,
      clientLimit: null, // Unlimited
      features: [
        'Unlimited clients',
        'Advanced measurements',
        'Payment tracking',
        'Style catalog',
        'Email notifications',
        'Analytics dashboard',
        'Priority support'
      ]
    }
  ]);

  // Get current subscription plan
  const currentPlan = computed(() => {
    if (!user.value) return subscriptionPlans.value[0]; // Default to free plan
    
    const planType = user.value.subscriptionPlan as SubscriptionPlanType;
    return subscriptionPlans.value.find(plan => plan.value === planType) || subscriptionPlans.value[0];
  });

  // Get client limit based on current plan
  const clientLimit = computed(() => {
    if (!isSubscriptionActive.value) return 0;
    return currentPlan.value.clientLimit;
  });

  // Check if user can add more clients
  async function canAddMoreClients(currentClientCount: number): Promise<boolean> {
    if (!isSubscriptionActive.value) return false;
    if (currentPlan.value.clientLimit === null) return true; // Unlimited
    return currentClientCount < currentPlan.value.clientLimit;
  }

  // Calculate remaining clients
  function getRemainingClients(currentClientCount: number): number {
    if (!isSubscriptionActive.value) return 0;
    if (currentPlan.value.clientLimit === null) return Infinity; // Unlimited
    return Math.max(0, currentPlan.value.clientLimit - currentClientCount);
  }

  // Format remaining clients for display
  function formatRemainingClients(currentClientCount: number): string {
    if (!isSubscriptionActive.value) return '0';
    if (currentPlan.value.clientLimit === null) return 'Unlimited';
    return getRemainingClients(currentClientCount).toString();
  }

  return {
    subscriptionPlans,
    currentPlan,
    clientLimit,
    canAddMoreClients,
    getRemainingClients,
    formatRemainingClients
  };
}