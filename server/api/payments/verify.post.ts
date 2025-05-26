import { defineEventHandler, readBody, getRequestHeaders } from 'h3'
import { useDrizzle, tables, eq, and } from '~/server/utils/drizzle'
import { verifyToken, generateToken } from '~/server/utils/auth'

/**
 * Verify Paystack payment
 */
export default defineEventHandler(async event => {
  try {
    const { reference, plan_id, billing_period } = await readBody(event)

    if (!reference) {
      return {
        success: false,
        message: 'Payment reference is required',
      }
    }

    // Get Paystack secret key from server environment
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

    if (!paystackSecretKey) {
      console.error('Paystack secret key not found in environment variables')
      return {
        success: false,
        message: 'Server configuration error',
      }
    }

    // Verify payment with Paystack API
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Paystack API error:', data)
      return {
        success: false,
        message: 'Payment verification failed',
      }
    }

    if (data.status && data.data.status === 'success') {
      // Payment was successful

      // Get authentication header from the original request
      const headers = getRequestHeaders(event)
      const authHeader = headers.authorization

      if (!authHeader) {
        console.error('No authorization header found in request')
        return {
          success: false,
          message: 'Authentication required',
        }
      }

      console.log('Auth header for subscription creation:', authHeader.substring(0, 15) + '...')

      try {
        // Extract token from auth header
        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader

        // Verify the token directly here instead of making another API call
        const decoded = await verifyToken(token)
        if (!decoded || !decoded.id) {
          console.error('Invalid token payload')
          return {
            success: false,
            message: 'Invalid authentication token',
          }
        }

        const userId = decoded.id
        console.log('Verified user ID from token:', userId)

        // Get database instance
        const db = useDrizzle()

        // Ensure plan_id is a number
        const planIdNum =
          typeof plan_id === 'string' && !isNaN(Number(plan_id)) ? Number(plan_id) : plan_id
        console.log('Looking for plan with ID:', planIdNum, 'Original value:', plan_id)

        // Find the plan
        const plan = await db.query.plans.findFirst({
          where: eq(tables.plans.id, planIdNum),
        })

        if (!plan) {
          console.error('Plan not found:', planIdNum)
          return {
            success: false,
            message: 'Selected plan not found',
          }
        }

        console.log('Found plan:', plan.name, 'with ID:', plan.id)

        // Calculate subscription end date based on billing period
        const startDate = new Date()
        const endDate = new Date(startDate)

        if (billing_period === 'month' || billing_period === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1)
        } else if (billing_period === 'year' || billing_period === 'annual') {
          endDate.setFullYear(endDate.getFullYear() + 1)
        } else {
          console.error('Invalid billing period:', billing_period)
          return {
            success: false,
            message: 'Invalid billing period',
          }
        }

        // Check if user already has an active subscription
        const existingSubscription = await db.query.subscriptions.findFirst({
          where: and(
            eq(tables.subscriptions.userId, Number(userId)),
            eq(tables.subscriptions.status, 'active')
          ),
        })

        let subscriptionResult

        if (existingSubscription) {
          // Update existing subscription
          subscriptionResult = await db
            .update(tables.subscriptions)
            .set({
              planId: plan.id,
              billingPeriod: billing_period,
              startDate,
              endDate,
              nextBillingDate: endDate,
              amount: data.data.amount / 100, // Convert from kobo to naira
              paymentReference: reference,
              updatedAt: new Date(),
            })
            .where(eq(tables.subscriptions.id, existingSubscription.id))
            .returning()

          console.log('Updated existing subscription:', subscriptionResult[0]?.id)
        } else {
          // Create new subscription
          subscriptionResult = await db
            .insert(tables.subscriptions)
            .values({
              userId: Number(userId),
              planId: plan.id,
              status: 'active',
              startDate,
              endDate,
              billingPeriod: billing_period,
              amount: data.data.amount / 100, // Convert from kobo to naira
              paymentReference: reference,
              paymentMethod: 'paystack',
              nextBillingDate: endDate,
            })
            .returning()

          console.log('Created new subscription:', subscriptionResult[0]?.id)
        }

        // Generate a new token with updated subscription information
        const newToken = generateToken({
          id: userId,
          subscriptionPlan: plan.id.toString(),
          subscriptionExpiry: Math.floor(endDate.getTime() / 1000),
        })

        console.log('Generated new token with subscription data')

        // Return success with the new token
        return {
          success: true,
          message: 'Payment verified and subscription created successfully',
          data: {
            amount: data.data.amount / 100,
            reference: data.data.reference,
            plan_id: plan.id,
            subscription: subscriptionResult[0],
          },
          token: newToken,
        }
      } catch (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError)
        return {
          success: false,
          message: 'Payment verified, but subscription creation failed',
        }
      }

      return {
        success: true,
        message: 'Payment verified successfully',
        data: {
          amount: data.data.amount / 100, // Convert from kobo to naira
          reference: data.data.reference,
          plan_id,
        },
      }
    } else {
      return {
        success: false,
        message: 'Payment not successful',
        data: {
          reference: data.data.reference,
        },
      }
    }
  } catch (error) {
    console.error('Error verifying payment:', error)

    return {
      success: false,
      message: 'An error occurred while verifying payment',
    }
  }
})
