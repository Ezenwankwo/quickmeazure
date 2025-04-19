import { ref, computed } from 'vue';

// Define user type
interface User {
  id: string;
  name: string;
  email: string;
  subscriptionPlan: string;
  subscriptionExpiry?: number | null;
}

// Define auth state
interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  token: string | null;
  sessionExpiry?: number | null;
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
      
      // Only set auth state if session hasn't expired
      if (!parsed.sessionExpiry || Date.now() < parsed.sessionExpiry) {
        authState.value = parsed;
      } else {
        // Clear expired auth data
        localStorage.removeItem('auth');
        console.log('Session expired, clearing auth data');
      }
    } catch (e) {
      console.error('Failed to parse auth data from localStorage', e);
      // Clear invalid data
      localStorage.removeItem('auth');
    }
  }
}

export function useAuth() {
  // Check for session expiry on initialization
  if (process.client) {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const parsedData = JSON.parse(authData);
      if (parsedData.sessionExpiry && Date.now() > parsedData.sessionExpiry) {
        // Session has expired, clear auth data
        localStorage.removeItem('auth');
        localStorage.removeItem('isHandlingAuthError');
        localStorage.removeItem('lastLoginTime');
        
        // Reset auth state
        authState.value = {
          user: null,
          isLoggedIn: false,
          token: null
        };
      }
    }
  }

  // Computed properties
  const isLoggedIn = computed(() => authState.value.isLoggedIn && !!authState.value.token);
  const user = computed(() => authState.value.user);
  const token = computed(() => {
    // Check if token exists and session hasn't expired
    if (!authState.value.token) return null;
    
    // Return token only if session hasn't expired
    if (authState.value.sessionExpiry && Date.now() > authState.value.sessionExpiry) {
      // Token has expired, handle expiry silently
      console.log('Token expired, clearing auth state');
      handleSessionExpiry(false);
      return null;
    }
    
    return authState.value.token;
  });
  
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

  // Handle session expiry - logs the user out and redirects to login page
  const handleSessionExpiry = async (showNotification = true) => {
    const route = useRoute();
    
    // Don't redirect if we're already on an auth page to prevent loops
    if (route.path.includes('/auth/')) {
      // Just logout
      await logout();
      return;
    }
    
    // Clear auth state
    await logout();
    
    // Show notification
    if (showNotification && process.client) {
      const toast = useToast();
      toast.add({
        title: 'Session Expired',
        description: 'Your session has expired. Please log in again.',
        color: 'error'
      });
    }
    
    // Redirect to login page
    navigateTo('/auth/login');
  };

  // Login function
  async function login(email: string, password: string, remember: boolean = false) {
    try {
      // Clear any auth error state
      if (process.client) {
        localStorage.removeItem('isHandlingAuthError');
      }
      
      // Call the login API endpoint using $fetch
      const data = await $fetch<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      
      // Calculate session expiry based on remember setting
      const now = Date.now();
      const sessionExpiry = remember 
        ? now + (30 * 24 * 60 * 60 * 1000) // 30 days if remember me is checked
        : now + (8 * 60 * 60 * 1000);      // 8 hours for normal session
      
      // Update auth state
      authState.value = {
        user: data.user,
        isLoggedIn: true,
        token: data.token,
        sessionExpiry
      };
      
      // Save to localStorage and mark login time
      if (process.client) {
        localStorage.setItem('auth', JSON.stringify(authState.value));
        localStorage.setItem('lastLoginTime', now.toString());
      }
      
      // Check if user has a subscription - redirect to subscription/confirm if not
      if (data.user.subscriptionPlan === 'free' || !data.user.subscriptionPlan) {
        navigateTo('/subscription/confirm');
        return { success: true, redirected: true };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.data?.statusMessage || 'Invalid email or password' 
      };
    }
  }

  // Register function
  async function register(name: string, email: string, password: string, plan: string = 'free') {
    try {
      // Clear any auth error state
      if (process.client) {
        localStorage.removeItem('isHandlingAuthError');
      }
      
      // Call the register API endpoint using $fetch
      const data = await $fetch<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: { name, email, password, subscriptionPlan: plan },
      });
      
      // Calculate session expiry (default to 8 hours)
      const now = Date.now();
      const sessionExpiry = now + (8 * 60 * 60 * 1000);
      
      // Update auth state
      authState.value = {
        user: data.user,
        isLoggedIn: true,
        token: data.token,
        sessionExpiry
      };
      
      // Save to localStorage
      if (process.client) {
        localStorage.setItem('auth', JSON.stringify(authState.value));
        localStorage.setItem('lastLoginTime', now.toString());
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Extract error message from the response
      let errorMessage = 'Registration failed';
      
      if (error.data) {
        // Handle structured error responses
        if (error.data.message) {
          errorMessage = error.data.message;
        } else if (error.data.statusMessage) {
          errorMessage = error.data.statusMessage;
        }
      }
      
      // Map common error messages to more user-friendly messages
      if (errorMessage.includes('already registered')) {
        errorMessage = 'This email is already registered. Please use a different email or try logging in.';
      } else if (errorMessage.includes('Password must include')) {
        errorMessage = 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.';
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  // Logout function
  async function logout() {
    try {
      console.log('Starting logout process');
      
      // Clear local auth state first to ensure UI updates immediately
      authState.value = {
        user: null,
        isLoggedIn: false,
        token: null
      };
      
      // Remove from localStorage - clear all auth-related items
      if (process.client) {
        localStorage.removeItem('auth');
        localStorage.removeItem('isHandlingAuthError');
        localStorage.removeItem('lastLoginTime');
        console.log('Local storage cleared');
      }
      
      // Now call the server API to clear the session
      // We put this after local state clearing so the UI feels more responsive
      try {
        console.log('Calling server logout API endpoint');
        const response = await $fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        console.log('Server logout API response:', response);
      } catch (apiError) {
        // If the API call fails, we've already cleared local state
        // so just log the error but don't throw it
        console.error('API logout error (non-critical):', apiError);
      }
      
      console.log('Logout completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      
      // Ensure local state is cleared even on error
      authState.value = {
        user: null,
        isLoggedIn: false,
        token: null
      };
      
      if (process.client) {
        localStorage.removeItem('auth');
        localStorage.removeItem('isHandlingAuthError');
        localStorage.removeItem('lastLoginTime');
      }
      
      return { success: true, error };
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
    handleSessionExpiry,
    login,
    register,
    logout,
    updateProfile,
    updateSubscription,
    getClientLimit
  };
}