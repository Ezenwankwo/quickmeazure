import jwt from 'jsonwebtoken'
import { useDrizzle, tables, eq } from '~/server/utils/drizzle'
import { sendPasswordResetEmail } from '~/utils/email'

export default defineEventHandler(async event => {
  try {
    // Get request body
    const { email } = await readBody(event)

    // Validate email
    if (!email) {
      throw createError({
        statusCode: 400,
        message: 'Email is required',
      })
    }

    // Get database connection
    const db = useDrizzle()

    // Check if user exists
    const users = await db
      .select()
      .from(tables.users)
      .where(eq(tables.users.email, email.toLowerCase()))
      .limit(1)

    const user = users[0]

    // Even if user doesn't exist, we'll still return success
    // for security reasons (prevents email enumeration)
    if (!user) {
      return {
        success: true,
      }
    }

    // Generate a reset token
    const config = useRuntimeConfig()
    const resetToken = jwt.sign(
      { userId: user.id },
      config.jwtSecret,
      { expiresIn: '1h' } // Token expires in 1 hour
    )

    // Get the app URL from config
    const appUrl = config.public.appUrl || 'http://localhost:3000'
    // Create reset URL - using query parameter format
    const resetUrl = `${appUrl}/auth/reset-password?token=${resetToken}`

    const isDev = process.env.NODE_ENV === 'development'

    if (isDev) {
      console.log('Password reset token for', email, resetToken)
      console.log('Reset URL:', resetUrl)
    }

    // Send the password reset email
    const emailResult = await sendPasswordResetEmail(email, resetUrl)

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error)
    }

    return {
      success: true,
      message: 'Password reset link sent',
      ...(isDev ? { resetUrl } : {}), // Only include reset URL in development
    }
  } catch (error: any) {
    console.error('Forgot password error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: 'An error occurred processing your request',
    })
  }
})
