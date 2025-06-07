import { defineEventHandler, createError, readBody, getRequestHeaders } from 'h3'
import jwt from 'jsonwebtoken'
import { useDrizzle, tables, eq, and } from '~/server/utils/drizzle'

/**
 * Cancel the current user's subscription
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

    // Read request body (optional cancellation reason)
    const { reason } = await readBody(event)

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

    // Update the subscription status to canceled
    const canceledSubscription = await db
      .update(tables.subscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        metadata: {
          ...((subscription.metadata as Record<string, any>) || {}),
          cancellationReason: reason || 'User requested cancellation',
        },
        updatedAt: new Date(),
      })
      .where(eq(tables.subscriptions.id, subscription.id))
      .returning()

    return {
      success: true,
      message: 'Subscription canceled successfully',
      data: canceledSubscription[0],
    }
  } catch (error: any) {
    console.error('Error canceling subscription:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'An error occurred while canceling subscription',
    })
  }
})
