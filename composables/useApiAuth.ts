import type { FetchOptions } from 'ofetch';

/**
 * Composable for making authenticated API calls
 * Provides utility functions to simplify API calls with authentication
 */
export function useApiAuth() {
  const auth = useSessionAuth();
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
    try {
      // Check if we have a token
      if (!auth.isLoggedIn.value || !auth.token.value) {
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
      // Handle 401 errors (unauthorized)
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