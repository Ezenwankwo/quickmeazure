import { defineEventHandler, readBody, createError, getRequestHeaders } from 'h3'
import jwt from 'jsonwebtoken'
import { useDrizzle, tables, eq, and } from '~/server/utils/drizzle'
// Subscription type import removed as it's not being used

/**
 * Create a new subscription after successful payment
 * Also handles free/growth plan subscriptions
 */
export default defineEventHandler(async event => {
  try {
    // Get user from auth token
    const headers = getRequestHeaders(event)
    const authHeader = headers.authorization || ''

    // Check for token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - No valid token provided',
      })
    }

    // Extract and verify token
    const token = authHeader.split(' ')[1]
    const config = useRuntimeConfig()

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string | number }
      if (!decoded || !decoded.id) {
        throw new Error('Invalid token payload')
      }

      const userId = decoded.id

      // Read request body
      const {
        planId,
        planName = '',
        paymentReference,
        billingPeriod,
        amount,
      } = await readBody(event)

      // Validate required fields - planId and billingPeriod are always required
      if (!planId || !billingPeriod) {
        throw createError({
          statusCode: 400,
          message: 'Missing required fields: planId and billingPeriod are required',
        })
      }

      // Check if this is a free/growth plan (no payment required)
      const isFreeOrGrowthPlan =
        planName?.toLowerCase() === 'growth' || planName?.toLowerCase() === 'free'

      // For paid plans, validate payment information
      if (!isFreeOrGrowthPlan && (!paymentReference || !amount)) {
        throw createError({
          statusCode: 400,
          message: 'Payment reference and amount are required for paid plans',
        })
      }

      // Get database instance
      const db = useDrizzle()

      // Find the plan
      const plan = await db.query.plans.findFirst({
        where: eq(tables.plans.id, planId),
      })

      if (!plan) {
        throw createError({
          statusCode: 404,
          message: 'Plan not found',
        })
      }

      // Calculate subscription end date based on billing period
      const startDate = new Date()
      const endDate = new Date(startDate)

      if (billingPeriod === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1)
      } else if (billingPeriod === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1)
      } else {
        throw createError({
          statusCode: 400,
          message: 'Invalid billing period',
        })
      }

      // Check if user already has an active subscription
      const existingSubscription = await db.query.subscriptions.findFirst({
        where: and(
          eq(tables.subscriptions.userId, Number(userId)),
          eq(tables.subscriptions.status, 'active')
        ),
      })

      const subscriptionData = {
        planId,
        billingPeriod,
        startDate,
        endDate,
        nextBillingDate: endDate,
        // For free/growth plans, we don't require payment info
        amount: isFreeOrGrowthPlan ? 0 : amount,
        paymentReference: isFreeOrGrowthPlan ? 'free-plan' : paymentReference,
        updatedAt: new Date(),
      }

      if (existingSubscription) {
        // Update existing subscription
        const updatedSubscription = await db
          .update(tables.subscriptions)
          .set(subscriptionData)
          .where(eq(tables.subscriptions.id, existingSubscription.id))
          .returning()

        return {
          success: true,
          message: 'Subscription updated successfully',
          data: updatedSubscription[0],
        }
      } else {
        // Create new subscription
        const newSubscription = await db
          .insert(tables.subscriptions)
          .values({
            userId: userId as number,
            planId: planId as number,
            status: 'active',
            startDate: new Date(),
            billingPeriod,
            amount: amount || 0,
            paymentReference: paymentReference || null,
            paymentMethod: paymentReference ? 'paystack' : 'free',
            nextBillingDate:
              billingPeriod === 'monthly'
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
                : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          })
          .returning()

        // Update user's hasCompletedSetup to false to ensure they complete the setup
        await db
          .update(tables.users)
          .set({
            hasCompletedSetup: false,
            updatedAt: new Date(),
          })
          .where(eq(tables.users.id, userId))

        return {
          success: true,
          message: 'Subscription created successfully',
          data: newSubscription[0],
        }
      }
    } catch (tokenError) {
      console.error('Token verification error:', tokenError)
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - Invalid token',
      })
    }
  } catch (error: any) {
    console.error('Error creating subscription:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'An error occurred while creating subscription',
    })
  }
})
