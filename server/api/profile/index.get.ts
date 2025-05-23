import { eq } from 'drizzle-orm'
import { db } from '~/server/database'
import { users, businessProfiles } from '~/server/database/schema'

export default defineEventHandler(async event => {
  try {
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    const result = await db
      .select({
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          subscriptionPlan: users.subscriptionPlan,
          subscriptionExpiry: users.subscriptionExpiry,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        business: {
          id: businessProfiles.id,
          shopName: businessProfiles.shopName,
          businessType: businessProfiles.businessType,
          yearsInBusiness: businessProfiles.yearsInBusiness,
          businessDescription: businessProfiles.businessDescription,
          phone: businessProfiles.phone,
          address: businessProfiles.address,
          city: businessProfiles.city,
          state: businessProfiles.state,
          specializations: businessProfiles.specializations,
          services: businessProfiles.services,
          createdAt: businessProfiles.createdAt,
          updatedAt: businessProfiles.updatedAt,
        },
      })
      .from(users)
      .leftJoin(businessProfiles, eq(users.id, businessProfiles.userId))
      .where(eq(users.id, auth.userId))
      .limit(1)

    if (!result.length) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    return result[0]
  } catch (error) {
    console.error('Error fetching profile:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
