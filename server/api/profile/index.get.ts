import { eq, and, desc, isNull, or, gt } from 'drizzle-orm'
import { db } from '~/server/database'
import { users, subscriptions, plans } from '~/server/database/schema'

export default defineEventHandler(async event => {
  try {
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    // Get user data with their latest active subscription
    const userData = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        businessName: users.businessName,
        phone: users.phone,
        location: users.location,
        bio: users.bio,
        specializations: users.specializations,
        services: users.services,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1)
      .then(results => results[0])

    if (!userData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    // Get the user's active subscription
    const activeSubscription = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        planName: plans.name,
      })
      .from(subscriptions)
      .leftJoin(plans, eq(subscriptions.planId, plans.id))
      .where(
        and(
          eq(subscriptions.userId, auth.userId),
          eq(subscriptions.status, 'active'),
          or(isNull(subscriptions.endDate), gt(subscriptions.endDate, new Date()))
        )
      )
      .orderBy(desc(subscriptions.startDate))
      .limit(1)
      .then(results => results[0] || null)

    // Combine user data with subscription info
    return {
      ...userData,
      subscription: activeSubscription
        ? {
            plan: activeSubscription.planName,
            status: activeSubscription.status,
            expiryDate: activeSubscription.endDate,
          }
        : {
            plan: 'free',
            status: 'inactive',
            expiryDate: null,
          },
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
