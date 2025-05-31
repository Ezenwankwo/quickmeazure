import { eq } from 'drizzle-orm'
import { db } from '~/server/database'
import { users } from '~/server/database/schema'
import { readMultipartFormData } from 'h3'
import { uploadFileToS3, getFileExtension, getContentType } from '~/server/utils/s3'

export default defineEventHandler(async event => {
  try {
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    // Get the current user
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1)
      .then(results => results[0])

    if (!currentUser) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      })
    }

    // Parse the multipart form data
    const formData = await readMultipartFormData(event)
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No file uploaded',
      })
    }

    const avatarFile = formData.find(part => part.name === 'avatar')
    if (!avatarFile || !avatarFile.data) {
      throw createError({
        statusCode: 400,
        message: 'Invalid file upload',
      })
    }

    // Get the file extension and content type
    const fileName = avatarFile.filename || `avatar-${Date.now()}.jpg`
    const fileExt = getFileExtension(fileName)
    const contentType = getContentType(fileExt)

    // Upload the file to S3
    let avatarUrl: string
    try {
      avatarUrl = await uploadFileToS3(avatarFile.data, fileName, contentType)
    } catch (uploadError) {
      console.error('Error uploading avatar to S3:', uploadError)
      throw createError({
        statusCode: 500,
        message: 'Failed to upload avatar to storage',
      })
    }

    // Update the user's avatar in the database
    const result = await db
      .update(users)
      .set({
        avatar: avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, auth.userId))
      .returning()

    if (!result.length) {
      throw createError({
        statusCode: 500,
        message: 'Failed to update avatar',
      })
    }

    // Return the updated user data
    return {
      success: true,
      avatarUrl,
      message: 'Avatar updated successfully',
    }
  } catch (error: any) {
    console.error('Error uploading avatar:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to upload avatar',
    })
  }
})
