import { db } from '~/server/database'
import { users } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody(event)
    const { name, email, notifications, currentPassword, newPassword } = body

    // Get current user
    const currentUser = await db.select()
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1)
      .then(results => results[0])

    if (!currentUser) {
      throw createError({
        statusCode: 404,
        message: 'User not found'
      })
    }

    // Build update object
    const updateData: any = {
      name,
      email,
      updatedAt: new Date()
    }

    // Handle password change if provided
    if (currentPassword && newPassword) {
      // Verify the current password
      const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password)
      if (!isPasswordValid) {
        throw createError({
          statusCode: 400,
          message: 'Current password is incorrect'
        })
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      
      // Update the password in the database
      updateData.password = hashedPassword
    }

    // Handle notifications update if provided
    if (notifications) {
      // In a real app, we would store these in a user_preferences table
      // For now, we'll just acknowledge the update
      console.log('Notification preferences updated:', notifications)
    }

    // Update user
    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, auth.userId))
      .returning()

    if (!result.length) {
      throw createError({
        statusCode: 500,
        message: 'Failed to update user'
      })
    }

    // Return updated user (exclude password)
    const updatedUser = result[0]
    return {
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        notifications: notifications || { email: false, push: false }
      }
    }
  } catch (error: any) {
    console.error('Error updating user profile:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update user profile'
    })
  }
}) 