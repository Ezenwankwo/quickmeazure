import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '~/server/database'
import { businessProfiles } from '~/server/database/schema'

export default defineEventHandler(async event => {
  try {
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    const body = await readBody(event)
    const {
      shopName,
      businessType,
      yearsInBusiness,
      businessDescription,
      phone,
      address,
      city,
      state,
      specializations,
      services,
    } = body

    // Check if business profile exists
    const existingProfile = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, auth.userId))
      .limit(1)

    let result
    if (existingProfile.length) {
      // Update existing profile
      result = await db
        .update(businessProfiles)
        .set({
          shopName,
          businessType,
          yearsInBusiness,
          businessDescription,
          phone,
          address,
          city,
          state,
          specializations,
          services,
          updatedAt: new Date(),
        })
        .where(eq(businessProfiles.userId, auth.userId))
        .returning()
    } else {
      // Create new profile
      result = await db
        .insert(businessProfiles)
        .values({
          id: uuidv4(),
          userId: auth.userId,
          shopName,
          businessType,
          yearsInBusiness,
          businessDescription,
          phone,
          address,
          city,
          state,
          specializations,
          services,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
    }

    if (!result.length) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update business profile',
      })
    }

    return {
      success: true,
      data: result[0],
    }
  } catch (error: any) {
    console.error('Error updating business profile:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update business profile',
    })
  }
})
