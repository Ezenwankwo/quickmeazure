import { ref, computed } from 'vue';

// Define user type
interface User {
  id: string;
  name: string;
  email: string;
  subscriptionPlan: string;
  subscriptionExpiry?: number;
}

// Define auth state
interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  token: string | null;
}

// Create a reactive auth state
const authState = ref<AuthState>({
  user: null,
  isLoggedIn: false,
  token: null
});

// Load auth state from localStorage on initialization
if (process.client) {
  const savedAuth = localStorage.getItem('auth');
  if (savedAuth) {
    try {
      const parsed = JSON.parse(savedAuth);
      authState.value = parsed;
    } catch (e) {
      console.error('Failed to parse auth data from localStorage', e);
      // Clear invalid data
      localStorage.removeItem('auth');
    }
  }
}

export function useAuth() {
  // Computed properties
  const isLoggedIn = computed(() => authState.value.isLoggedIn);
  const user = computed(() => authState.value.user);
  const token = computed(() => authState.value.token);
  
  // Check if user's subscription is active
  const isSubscriptionActive = computed(() => {
    if (!user.value) return false;
    
    // Free plan is always active
    if (user.value.subscriptionPlan === 'free') return true;
    
    // Check if paid subscription is expired
    if (user.value.subscriptionExpiry) {
      return Date.now() < user.value.subscriptionExpiry;
    }
    
    return false;
  });

  // Login function
  async function login(email: string, password: string) {
    try {
      // TODO: Replace with actual API call
      // Mock successful login for now
      const mockUser = {
        id: '1',
        name: 'Test User',
        email,
        subscriptionPlan: 'free'
      };
      
      const mockToken = 'mock-jwt-token';
      
      // Update auth state
      authState.value = {
        user: mockUser,
        isLoggedIn: true,
        token: mockToken
      };
      
      // Save to localStorage
      if (process.client) {
        localStorage.setItem('auth', JSON.stringify(authState.value));
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Invalid email or password' };
    }
  }

  // Register function
  async function register(name: string, email: string, password: string, plan: string = 'free') {
    try {
      // TODO: Replace with actual API call
      // Mock successful registration
      const mockUser = {
        id: '1',
        name,
        email,
        subscriptionPlan: plan
      };
      
      const mockToken = 'mock-jwt-token';
      
      // Update auth state
      authState.value = {
        user: mockUser,
        isLoggedIn: true,
        token: mockToken
      };
      
      // Save to localStorage
      if (process.client) {
        localStorage.setItem('auth', JSON.stringify(authState.value));
      }
      
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  // Logout function
  function logout() {
    // Clear auth state
    authState.value = {
      user: null,
      isLoggedIn: false,
      token: null
    };
    
    // Remove from localStorage
    if (process.client) {
      localStorage.removeItem('auth');
    }
  }

  // Update user profile
  async function updateProfile(userData: Partial<User>) {
    try {
      // TODO: Replace with actual API call
      // Mock successful update
      if (authState.value.user) {
        authState.value.user = {
          ...authState.value.user,
          ...userData
        };
        
        // Save to localStorage
        if (process.client) {
          localStorage.setItem('auth', JSON.stringify(authState.value));
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Profile update failed:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }

  // Update subscription
  async function updateSubscription(plan: string) {
    try {
      // TODO: Replace with actual API call
      // Mock successful subscription update
      if (authState.value.user) {
        // Calculate expiry date (1 month from now for paid plans)
        let expiryDate = undefined;
        if (plan !== 'free') {
          const date = new Date();
          date.setMonth(date.getMonth() + 1);
          expiryDate = date.getTime();
        }
        
        authState.value.user = {
          ...authState.value.user,
          subscriptionPlan: plan,
          subscriptionExpiry: expiryDate
        };
        
        // Save to localStorage
        if (process.client) {
          localStorage.setItem('auth', JSON.stringify(authState.value));
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Subscription update failed:', error);
      return { success: false, error: 'Failed to update subscription' };
    }
  }

  // Get client limit based on subscription plan
  function getClientLimit() {
    if (!user.value) return 0;
    
    switch (user.value.subscriptionPlan) {
      case 'free':
        return 100;
      case 'standard':
        return 500;
      case 'premium':
        return Infinity; // Unlimited
      default:
        return 0;
    }
  }

  return {
    user,
    isLoggedIn,
    token,
    isSubscriptionActive,
    login,
    register,
    logout,
    updateProfile,
    updateSubscription,
    getClientLimit
  };
}