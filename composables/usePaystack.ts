import { initializePaystackPayment } from '~/utils/paystack';
import { useSessionAuth } from './useSessionAuth';

interface PaymentOptions {
  amount: number;
  planId: string;
  planName: string;
  billingPeriod: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const usePaystack = () => {
  const auth = useSessionAuth();
  const config = useRuntimeConfig();
  
  /**
   * Process payment with Paystack
   */
  const processPayment = async (options: PaymentOptions) => {
    try {
      // Check if user is logged in and has email
      if (!auth.user.value?.email) {
        throw new Error('User email not available');
      }
      
      // Initialize Paystack payment
      initializePaystackPayment({
        key: config.public.paystackKey,
        email: auth.user.value.email,
        amount: options.amount,
        currency: 'NGN',
        metadata: {
          plan_id: options.planId,
          plan_name: options.planName,
          billing_period: options.billingPeriod,
          user_id: auth.user.value.id || ''
        },
        callback: async (response) => {
          if (response.status === 'success') {
            // Verify payment with our server
            try {
              // Ensure we have a valid token
              if (!auth.token.value) {
                throw new Error('Authentication token not available');
              }
              
              const verificationResult = await $fetch('/api/payments/verify', {
                method: 'POST',
                body: {
                  reference: response.reference,
                  plan_id: options.planId,
                  billing_period: options.billingPeriod
                },
                headers: {
                  'Authorization': `Bearer ${auth.token.value}`
                }
              });
              
              if (verificationResult.success) {
                if (options.onSuccess) {
                  options.onSuccess();
                }
              } else {
                throw new Error(verificationResult.message || 'Payment verification failed');
              }
            } catch (error) {
              if (options.onError) {
                options.onError(error);
              }
            }
          } else {
            if (options.onError) {
              options.onError(new Error('Payment failed'));
            }
          }
        },
        onClose: () => {
          // Payment window was closed
          console.log('Payment window closed');
        }
      });
    } catch (error) {
      if (options.onError) {
        options.onError(error);
      }
    }
  };
  
  return {
    processPayment
  };
}; 