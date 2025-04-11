import type { FetchOptions } from 'ofetch';

/**
 * Composable for making authenticated API calls
 * Provides utility functions to simplify API calls with authentication
 */
export function useApiAuth() {
  const auth = useAuth();
  const route = useRoute();
  
  /**
   * Get the authorization headers for API calls
   * @returns Object with Authorization header if user is logged in
   */
  const getAuthHeaders = (): Record<string, string> => {
    if (!auth.token.value) return {};
    
    return {
      'Authorization': `Bearer ${auth.token.value}`
    };
  };
  
  /**
   * Make an authenticated API call with error handling for 401 responses
   * @param url API endpoint URL
   * @param options Fetch options
   * @returns API response
   */
  const authFetch = async (url: string, options: any = {}): Promise<any> => {
    // Check if we just logged in (within last 2 seconds)
    const isRecentLogin = (): boolean => {
      if (process.server) return false;
      const lastLoginTime = localStorage.getItem('lastLoginTime');
      if (!lastLoginTime) return false;
      
      const timeSinceLogin = Date.now() - parseInt(lastLoginTime, 10);
      return timeSinceLogin < 2000; // 2 seconds grace period
    };
    
    try {
      // Check if we have a token first
      if (!auth.token.value) {
        // If we're not on a login/register page, redirect to login
        if (!route.path.includes('/auth/')) {
          navigateTo('/auth/login');
        }
        throw new Error('No authentication token available');
      }
      
      // Add auth headers to the request
      const headers = {
        ...options.headers,
        ...getAuthHeaders()
      };
      
      // Return the fetch call with authentication headers
      const response = await $fetch(url, {
        ...options,
        headers
      });
      
      // All good, return the response
      return response;
    } catch (error: any) {
      // If we just logged in, retry the request once
      if (error.response?.status === 401 && isRecentLogin()) {
        console.log('Recent login detected, retrying request...');
        
        // Small delay to ensure token is properly set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Retry with fresh headers
        const headers = {
          ...options.headers,
          ...getAuthHeaders()
        };
        
        try {
          return await $fetch(url, {
            ...options,
            headers
          });
        } catch (retryError) {
          // If retry also fails, continue with normal error handling
          console.error('Retry failed:', retryError);
        }
      }
      
      // Handle 401 errors only if we're not already on an auth page
      if (error.response?.status === 401 && !route.path.includes('/auth/')) {
        auth.handleSessionExpiry();
      }
      
      // Re-throw the error to be handled by the caller
      throw error;
    }
  };
  
  return {
    getAuthHeaders,
    authFetch
  };
} 