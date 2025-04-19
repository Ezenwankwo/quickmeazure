import { defineNuxtPlugin } from '#app';
import { useSessionAuth } from '~/composables/useSessionAuth';

export default defineNuxtPlugin(async () => {
  // Initialize auth on app startup
  const auth = useSessionAuth();
  
  // If in client-side, check for token expiration
  if (process.client) {
    // Get the current session status
    const status = auth.status.value;
    
    // Perform any necessary initialization
    console.log('Auth plugin initialized, status:', status);
  }
  
  return {
    provide: {
      auth
    }
  };
}); 