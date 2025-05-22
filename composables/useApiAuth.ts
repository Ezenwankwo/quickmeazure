/**
 * Composable that wraps Nuxt's useFetch with authentication
 * Provides enhanced utilities for API interaction with authentication, 
 * error handling, and response formatting
 */

export interface ApiResponse<T = any> {
  data: T | null;
  success: boolean;
  error?: string;
  statusCode?: number;
}

export function useApiAuth() {
  const auth = useSessionAuth();
  const route = useRoute();
  const toast = useToast();
  const isMounted = ref(false);
  
  // Set mounted state when component mounts
  if (process.client) {
    onMounted(() => {
      isMounted.value = true;
    });
  }
  
  /**
   * Get the authorization headers for API calls
   * @returns Object with Authorization header if user is logged in
   */
  const getAuthHeaders = (): HeadersInit => {
    if (!auth.token.value) return {};
    
    return {
      'Authorization': `Bearer ${auth.token.value}`
    };
  };
  
  /**
   * Format API response into a consistent structure
   * @param response Raw API response
   * @returns Formatted API response with consistent structure
   */
  const formatResponse = <T>(response: any): ApiResponse<T> => {
    // If response is already in our expected format, return it
    if (response && typeof response === 'object' && 'success' in response) {
      return response as ApiResponse<T>;
    }
    
    // Otherwise, format it into our standard structure
    return {
      data: response,
      success: true
    };
  };
  
  /**
   * Handle API errors including 401 unauthorized responses
   * @param error Error object from API call
   */
  const handleApiError = (error: any): void => {
    if (!error) return;
    
    // Check if this is an intentional logout
    const isIntentionalLogout = process.client && localStorage.getItem('intentionalLogout') === 'true';
    if (isIntentionalLogout) return; // Skip all error toasts during intentional logout
    
    // Extract status code
    const statusCode = error.statusCode || error.status || 500;
    
    // Handle 401 errors (unauthorized) - session expired
    if (statusCode === 401 && !route.path.includes('/auth/')) {
      auth.handleSessionExpiry(true);
    }
    
    // Handle other common API errors with appropriate UI feedback
    else if (statusCode === 403) {
      toast.add({
        title: 'Access Denied',
        description: 'You do not have permission to perform this action',
        color: 'error'
      });
    }
    else if (statusCode === 404) {
      toast.add({
        title: 'Not Found',
        description: 'The requested resource could not be found',
        color: 'warning'
      });
    }
    else if (statusCode >= 500) {
      toast.add({
        title: 'Server Error',
        description: 'A server error occurred. Please try again later',
        color: 'error'
      });
    }
  };
  
  /**
   * Check if authentication is available
   * @param redirect Whether to redirect to login page if not authenticated
   * @returns Boolean indicating if authentication is available
   */
  const ensureAuthentication = (redirect = true): boolean => {
    if (!auth.isLoggedIn.value || !auth.token.value) {
      // If we're not on a login/register page, redirect to login
      if (redirect && !route.path.includes('/auth/')) {
        navigateTo('/auth/login');
      }
      return false;
    }
    return true;
  };
  
  /**
   * Wrapped version of fetch with authentication support
   * Detects whether to use $fetch or useFetch based on mounted state
   * @param url API endpoint URL
   * @param options Fetch options
   * @returns API response
   */
  const authFetch = async <T = any>(url: string, options: any = {}): Promise<any> => {
    // Make sure headers exist in options
    const headers = {
      ...options.headers,
      ...getAuthHeaders()
    };
    
    // If component is already mounted, use $fetch directly as recommended
    if (process.client && isMounted.value) {
      try {
        return await $fetch(url, {
          ...options,
          headers
        });
      } catch (error: any) {
        handleApiError(error);
        throw error;
      }
    }
    
    // Otherwise use useFetch during SSR or initial render
    options.headers = headers;
    
    // Add onResponse handler
    const onResponseError = options.onResponseError;
    options.onResponseError = (context: any) => {
      // Call original handler if it exists
      if (onResponseError) {
        onResponseError(context);
      }
      
      // Handle API errors
      handleApiError(context.error);
    };
    
    // Use useFetch during server-side rendering or initial client load
    const { data, error } = await useFetch<T>(url, options);
    
    if (error.value) {
      handleApiError(error.value);
      throw error.value;
    }
    
    return data.value;
  };
  
  /**
   * Legacy method for making authenticated API calls with direct $fetch
   * Maintained for backward compatibility
   * @param url API endpoint URL
   * @param options Fetch options
   * @returns API response
   */
  const legacyFetch = async <T = any>(url: string, options: any = {}): Promise<ApiResponse<T>> => {
    try {
      // Check if we have a token
      if (!ensureAuthentication()) {
        throw new Error('No authentication token available');
      }
      
      // Add auth headers to the request
      const headers = {
        ...options.headers,
        ...getAuthHeaders()
      };
      
      // Make the API call with authentication headers
      const response = await $fetch<T>(url, {
        ...options,
        headers
      });
      
      // Format and return the response
      return formatResponse<T>(response);
    } catch (error: any) {
      // Handle API errors
      handleApiError(error);
      
      // Re-throw the error to be handled by the caller
      throw error;
    }
  };
  
  /**
   * Authenticated version of useAsyncData
   * @param key Unique key for the async data
   * @param url API endpoint URL
   * @param options UseFetch options
   * @returns AsyncData result with auth handling
   */
  const authAsyncData = <T>(key: string, url: string, options: any = {}) => {
    // Make sure headers exist in options
    options.headers = {
      ...options.headers,
      ...getAuthHeaders()
    };
    
    // Add onResponse handler
    const onResponseError = options.onResponseError;
    options.onResponseError = (context: any) => {
      // Call original handler if it exists
      if (onResponseError) {
        onResponseError(context);
      }
      
      // Handle API errors
      handleApiError(context.error);
    };
    
    // Return the useAsyncData call
    return useAsyncData<T>(key, () => $fetch(url, options), {
      ...options,
      onError: (error: any) => {
        handleApiError(error);
        if (options.onError) {
          options.onError(error);
        }
      }
    });
  };
  
  return {
    getAuthHeaders,
    authFetch,
    authAsyncData,
    legacyFetch
  };
} 