import { defineEventHandler, createError, getRequestHeaders } from 'h3'
import { useDrizzle, tables, eq, and } from '~/server/utils/drizzle'
import { verifyToken, generateToken } from '~/server/utils/auth'

/**
 * Get the current user's active subscription
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

    // Find the active subscription for the user
    // Using a simpler query approach to avoid relation errors
    console.log('Querying for active subscription for user ID:', userId)

    const subscription = await db
      .select()
      .from(tables.subscriptions)
      .where(
        and(
          eq(tables.subscriptions.userId, Number(userId)),
          eq(tables.subscriptions.status, 'active')
        )
      )
      .limit(1)
      .execute()

    // Get the plan details if we found a subscription
    let plan = null
    if (subscription && subscription.length > 0) {
      console.log('Found active subscription:', subscription[0].id)
      plan = await db
        .select()
        .from(tables.plans)
        .where(eq(tables.plans.id, subscription[0].planId))
        .limit(1)
        .execute()
    }

    // Check if the user has a free plan (all users have at least a free plan)
    if (!subscription || subscription.length === 0) {
      console.log('No active subscription found for user, assigning free plan')

      // Find the free plan
      const freePlan = await db
        .select()
        .from(tables.plans)
        .where(eq(tables.plans.name, 'Free'))
        .limit(1)
        .execute()

      // Generate a new token with free plan information
      let newToken = null
      if (freePlan && freePlan.length > 0) {
        plan = freePlan
        newToken = generateToken({
          id: userId,
          subscriptionPlan: 'Free',
          // Free plan doesn't expire
          subscriptionExpiry: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year from now
        })
      }

      return {
        success: true,
        message: 'No active subscription found, using free plan',
        data: {
          active: true,
          planId: freePlan && freePlan.length > 0 ? freePlan[0].id : null,
          trialEndsAt: null,
          currentPeriodEndsAt: null,
          canceledAt: null,
          pastDue: false,
          plan: freePlan && freePlan.length > 0 ? freePlan[0] : null,
        },
        token: newToken,
      }
    }

    // Get the first subscription (we limited to 1 in the query)
    const sub = subscription[0]

    // Include the plan details directly in the response
    const planDetails = plan && plan.length > 0 ? plan[0] : null

    console.log('Found plan details:', planDetails)

    // Generate a new token with updated subscription information
    let newToken = null
    if (planDetails) {
      // Calculate expiry date based on subscription data
      const expiryDate = sub.currentPeriodEndsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      newToken = generateToken({
        id: userId,
        subscriptionPlan: planDetails.name,
        subscriptionExpiry: Math.floor(new Date(expiryDate).getTime() / 1000),
      })
    }

    return {
      success: true,
      data: {
        active: true,
        planId: sub.planId,
        trialEndsAt: sub.trialEndsAt,
        currentPeriodEndsAt: sub.currentPeriodEndsAt,
        canceledAt: sub.canceledAt,
        pastDue: sub.pastDue,
        // Include the complete plan object
        plan: planDetails
          ? {
              id: planDetails.id,
              name: planDetails.name,
              description: planDetails.description,
              price: planDetails.price,
              interval: planDetails.interval,
              features: planDetails.features,
              isActive: planDetails.isActive,
              maxClients: planDetails.maxClients,
              maxStyles: planDetails.maxStyles,
              maxStorage: planDetails.maxStorage,
            }
          : null,
      },
      token: newToken,
    }
  } catch (error: any) {
    console.error('Error retrieving subscription:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'An error occurred while retrieving subscription',
    })
  }
})
