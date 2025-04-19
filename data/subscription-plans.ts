// Define plan type
interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  maxClients: number;
  isFeatured?: boolean;
  features: string[];
}

// Define the base monthly plans
export const monthlyPlans: SubscriptionPlan[] = [
  {
    id: 1,
    name: "Growth",
    description: "Basic plan for solo tailors just getting started",
    price: 0,
    interval: "month",
    maxClients: 50,
    features: [
      "Up to 50 clients",
      "Up to 200 styles",
      "Unlimited orders"
    ]
  },
  {
    id: 2,
    name: "Professional",
    description: "Perfect for growing tailor businesses",
    price: 3000,
    interval: "month",
    maxClients: 200,
    isFeatured: true,
    features: [
      "Up to 200 clients",
      "Unlimited styles",
      "Unlimited orders"
    ]
  },
  {
    id: 3,
    name: "Enterprise",
    description: "For established tailor businesses with multiple staff",
    price: 5000,
    interval: "month",
    maxClients: -1, // Unlimited
    features: [
      "Unlimited clients",
      "Unlimited styles",
      "Unlimited orders",
      "Team management"
    ]
  }
];

// Create annual plans (with separate fixed DB IDs)
export const annualPlans: SubscriptionPlan[] = [
  {
    ...monthlyPlans[0],
    id: 1, // Use ID 101 for annual Growth plan
    price: Math.round(monthlyPlans[0].price * 10), // Annual price = 10 months (2 months free)
    interval: "year"
  },
  {
    ...monthlyPlans[1],
    id: 4, // Use ID 4 for annual Professional plan (from DB)
    price: Math.round(monthlyPlans[1].price * 10), // Annual price = 10 months (2 months free)
    interval: "year"
  },
  {
    ...monthlyPlans[2],
    id: 5, // Use ID 5 for annual Enterprise plan (from DB)
    price: Math.round(monthlyPlans[2].price * 10), // Annual price = 10 months (2 months free)
    interval: "year"
  }
];

// Format price for display
export const formatPrice = (price: number | undefined | null, isAnnual = false): string => {
  if (price === undefined || price === null) return '₦0';
  
  return `₦${price.toLocaleString()}`;
}; 