import { defineEventHandler, createError, readBody, getRequestHeaders } from 'h3'
import { useDrizzle, tables, eq, and } from '~/server/utils/drizzle'
import { verifyToken, generateToken } from '~/server/utils/auth'

/**
 * Change the current user's subscription plan
 */
export default defineEventHandler(async event => {
  try {
    // Get authenticated user from event context (set by auth middleware)
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    console.log('Authenticated user ID:', auth.userId)
    const userId = auth.userId

    // Get database instance
    const db = useDrizzle()

    // Read request body (plan change details)
    const { planId, billingInterval, paymentReference, cardDetails } = await readBody(event)

    if (!planId) {
      throw createError({
        statusCode: 400,
        message: 'Plan ID is required',
      })
    }

    // Find the active subscription for the user
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(tables.subscriptions.userId, Number(userId)),
        eq(tables.subscriptions.status, 'active')
      ),
    })

    if (!subscription) {
      throw createError({
        statusCode: 404,
        message: 'No active subscription found',
      })
    }

    // Find the requested plan
    // Ensure planId is converted to a number for database query
    const planIdNum = typeof planId === 'string' && !isNaN(Number(planId)) ? Number(planId) : planId
    console.log('Looking for plan with ID:', planIdNum, 'Original value:', planId)

    const plan = await db.query.plans.findFirst({
      where: eq(tables.plans.id, planIdNum),
    })

    if (!plan) {
      throw createError({
        statusCode: 404,
        message: 'Requested plan not found',
      })
    }

    // Calculate the new price based on the billing interval
    const price =
      billingInterval === 'year'
        ? plan.price * 12 * 0.85 // 15% discount for annual billing
        : plan.price

    // Update the subscription with the new plan
    const updatedSubscription = await db
      .update(tables.subscriptions)
      .set({
        planId: planId,
        interval: billingInterval,
        price,
        updatedAt: new Date(),
        metadata: {
          ...((subscription.metadata as Record<string, any>) || {}),
          previousPlanId: subscription.planId,
          planChangedAt: new Date().toISOString(),
        },
      })
      .where(eq(tables.subscriptions.id, subscription.id))
      .returning()

    // Get the plan details for the token
    const planDetails = await db.query.plans.findFirst({
      where: eq(tables.plans.id, planId),
    })

    // Calculate expiry date based on billing interval
    const now = new Date()
    const expiryDate = new Date(now)
    if (billingInterval === 'year') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1)
    }

    // Generate a new token with updated subscription information
    // Ensure we're using the plan ID (as a number) for the token, not the plan name
    const newToken = generateToken({
      id: userId,
      subscriptionPlan: planDetails?.id?.toString() || '',
      subscriptionExpiry: Math.floor(expiryDate.getTime() / 1000),
    })

    // Create a payment record for the plan change (only for paid plans)
    if (plan.price > 0) {
      console.log('Creating subscription payment record for plan change')
      try {
        // Use the provided payment reference if available, otherwise generate one
        const reference = paymentReference || `plan-change-${Date.now()}`

        const paymentRecord = await db
          .insert(tables.subscriptionPayments)
          .values({
            userId: Number(userId),
            subscriptionId: subscription.id,
            amount: price,
            currency: 'NGN',
            status: 'successful',
            reference: reference,
            description: `Subscription changed to ${plan.name} (${billingInterval === 'year' ? 'yearly' : 'monthly'})`,
            provider: 'paystack',
            metadata: {
              planId: plan.id,
              previousPlanId: subscription.planId,
              billingInterval: billingInterval,
              planChangedAt: new Date().toISOString(),
            },
          })
          .returning()

        console.log('Created subscription payment record:', paymentRecord[0]?.id)

        // Create or update payment method if card details are provided
        if (cardDetails) {
          console.log('Processing payment method for plan change')

          // Check if the user already has a payment method
          const existingPaymentMethod = await db.query.paymentMethods.findFirst({
            where: eq(tables.paymentMethods.userId, Number(userId)),
          })

          if (existingPaymentMethod) {
            // Update the existing payment method
            console.log('Updating existing payment method for user ID:', userId)

            await db
              .update(tables.paymentMethods)
              .set({
                type: cardDetails.type || 'card',
                last4: cardDetails.last4,
                expiryMonth: cardDetails.expiryMonth,
                expiryYear: cardDetails.expiryYear,
                brand: cardDetails.brand,
                provider: 'paystack',
                providerId: cardDetails.providerId || reference,
                metadata: cardDetails.metadata || {},
                updatedAt: new Date(),
              })
              .where(eq(tables.paymentMethods.id, existingPaymentMethod.id))
          } else {
            // Create a new payment method
            console.log('Creating new payment method for user ID:', userId)

            await db.insert(tables.paymentMethods).values({
              userId: Number(userId),
              type: cardDetails.type || 'card',
              last4: cardDetails.last4,
              expiryMonth: cardDetails.expiryMonth,
              expiryYear: cardDetails.expiryYear,
              brand: cardDetails.brand,
              isDefault: true, // Always true since it's the only one
              provider: 'paystack',
              providerId: cardDetails.providerId || reference,
              metadata: cardDetails.metadata || {},
            })
          }
        }
      } catch (paymentError) {
        // Log the error but don't fail the whole operation
        console.error('Failed to process payment information:', paymentError)
      }
    }

    return {
      success: true,
      message: 'Subscription plan changed successfully',
      data: updatedSubscription[0],
      token: newToken,
    }
  } catch (error: any) {
    console.error('Error changing subscription plan:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'An error occurred while changing subscription plan',
    })
  }
})
