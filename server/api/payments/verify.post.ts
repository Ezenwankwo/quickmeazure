import { defineEventHandler, readBody } from 'h3';

/**
 * Verify Paystack payment
 */
export default defineEventHandler(async (event) => {
  try {
    const { reference, plan_id, billing_period } = await readBody(event);
    
    if (!reference) {
      return {
        success: false,
        message: 'Payment reference is required'
      };
    }
    
    // Get Paystack secret key from server environment
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!paystackSecretKey) {
      console.error('Paystack secret key not found in environment variables');
      return {
        success: false,
        message: 'Server configuration error'
      };
    }
    
    // Verify payment with Paystack API
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Paystack API error:', data);
      return {
        success: false,
        message: 'Payment verification failed'
      };
    }
    
    if (data.status && data.data.status === 'success') {
      // Payment was successful
      // In a real app, you would update user's subscription in the database here
      
      // Get authenticated user from session
      const session = event.context.session;
      if (session?.user?.id) {
        try {
          // Create subscription using the subscription endpoint
          await $fetch('/api/subscriptions/create', {
            method: 'POST',
            body: {
              planId: plan_id,
              paymentReference: reference,
              billingPeriod: billing_period || 'monthly',
              amount: data.data.amount / 100 // Convert from kobo to naira
            }
          });
        } catch (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError);
          // Continue with the payment verification response even if subscription creation fails
        }
      }
      
      return {
        success: true,
        message: 'Payment verified successfully',
        data: {
          amount: data.data.amount / 100, // Convert from kobo to naira
          reference: data.data.reference,
          plan_id
        }
      };
    } else {
      return {
        success: false,
        message: 'Payment not successful',
        data: {
          reference: data.data.reference
        }
      };
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    
    return {
      success: false,
      message: 'An error occurred while verifying payment'
    };
  }
}); 