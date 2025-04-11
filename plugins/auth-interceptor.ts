/**
 * Global interceptor for handling authentication errors
 * This plugin automatically detects 401 (Unauthorized) responses from the API
 * and handles them by logging out the user and redirecting to the login page
 */

// Define types for the fetch function and error handling
interface FetchOptions {
  headers?: Record<string, string>;
  [key: string]: any;
}

interface FetchError {
  response?: {
    status: number;
  };
  request?: {
    toString(): string;
  };
}

type $Fetch = <T>(url: string | Request | URL, options?: FetchOptions) => Promise<T>;

// Nuxt plugin definition
export default defineNuxtPlugin((nuxtApp) => {
  // Track auth flow using localStorage to persist across page reloads
  const isHandlingAuthError = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('isHandlingAuthError') === 'true';
  };
  
  const setHandlingAuthError = (value: boolean) => {
    if (typeof window === 'undefined') return;
    if (value) {
      localStorage.setItem('isHandlingAuthError', 'true');
    } else {
      localStorage.removeItem('isHandlingAuthError');
    }
  };
  
  // Reset the auth handling flag when navigating
  const route = useRoute();
  
  // Keep track of most recent login time to avoid handling errors right after login
  const getLastLoginTime = () => {
    if (typeof window === 'undefined') return 0;
    const time = localStorage.getItem('lastLoginTime');
    return time ? parseInt(time, 10) : 0;
  };

  const setLastLoginTime = () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('lastLoginTime', Date.now().toString());
  };

  // Check if we just logged in (within the last 2 seconds)
  const isRecentLogin = () => {
    const lastLogin = getLastLoginTime();
    return lastLogin > 0 && (Date.now() - lastLogin < 2000);
  };
  
  // Update login time when the auth state changes
  const auth = useAuth();
  watch(() => auth.isLoggedIn.value, (isLoggedIn) => {
    if (isLoggedIn) {
      setLastLoginTime();
      // Also clear any error handling state
      setHandlingAuthError(false);
    }
  });
  
  // Reset auth flow status when navigating
  watch(() => route.path, (newPath) => {
    // When navigating away from login/register, reset the auth flow flag
    if (isHandlingAuthError() && !newPath.includes('/auth/')) {
      setTimeout(() => {
        setHandlingAuthError(false);
      }, 500);
    }
    
    // When navigating to auth pages, clear the error state
    if (newPath.includes('/auth/')) {
      setHandlingAuthError(false);
    }
  });
  
  // Add global interceptor for all fetch requests
  nuxtApp.hook('app:created', () => {
    // Store the original fetch function
    const originalFetch = globalThis.$fetch as unknown as $Fetch;
    
    // Override the global fetch with proper typing
    // @ts-ignore - Overriding global fetch
    globalThis.$fetch = async function fetchWithAuth<T>(url: string | Request | URL, options: FetchOptions = {}): Promise<T> {
      // Only add headers on client-side
      if (typeof window !== 'undefined') {
        // Skip for auth endpoints
        const fullUrl = url.toString();
        const isAuthEndpoint = fullUrl.includes('/api/auth/');
        
        if (!isAuthEndpoint) {
          // Get auth token
          const auth = useAuth();
          if (auth.token.value) {
            // Initialize headers if not present
            options.headers = options.headers || {};
            
            // Set Authorization header
            options.headers = {
              ...options.headers,
              'Authorization': `Bearer ${auth.token.value}`
            };
          }
        }
      }
      
      try {
        // Make the request
        return await originalFetch(url, options) as T;
      } catch (error) {
        // Type assertion for FetchError
        const fetchError = error as FetchError;
        // Handle response errors
        if (typeof window !== 'undefined' && fetchError.response) {
          // Skip handling for auth endpoints to prevent loops
          const requestUrl = fetchError.request?.toString() || '';
          const isAuthEndpoint = requestUrl.includes('/api/auth/');
          
          // Skip if this is immediately after login
          if (isRecentLogin()) {
            console.log('Skipping auth error handling due to recent login');
            throw fetchError;
          }
          
          // Check for 401 Unauthorized error
          if (fetchError.response.status === 401 && !isAuthEndpoint && !isHandlingAuthError()) {
            // Set auth flag to prevent multiple redirects
            setHandlingAuthError(true);
            
            // Use a timeout to allow the current operation to complete
            setTimeout(() => {
              // Get auth composable and handle session expiry
              const { handleSessionExpiry } = useAuth();
              handleSessionExpiry();
            }, 0);
          }
        }
        
        // Re-throw the error
        throw fetchError;
      }
    };
  });
});