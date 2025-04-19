import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { useDrizzle, tables, eq } from '~/server/utils/drizzle'

// Define the token payload type
interface TokenPayload {
  userId: number;
  iat?: number;
  exp?: number;
}

export default defineEventHandler(async (event) => {
  try {
    // Get request body
    const { token, password } = await readBody(event)
    
    // Validate inputs
    if (!token || !password) {
      return {
        success: false,
        message: 'Token and password are required'
      }
    }

    // Validate password
    if (password.length < 8) {
      return {
        success: false,
        message: 'Password must be at least 8 characters long'
      }
    }

    // Check for password complexity
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(password)

    if (!(hasUppercase && hasLowercase && hasNumber && hasSpecialChar)) {
      return {
        success: false,
        message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
      }
    }

    // Verify token
    const config = useRuntimeConfig()
    
    let userId: number;
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload
      
      // Check if token contains necessary data
      if (!decoded || !decoded.userId) {
        return {
          success: false,
          message: 'Invalid token'
        }
      }
      
      userId = decoded.userId
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError)
      
      return {
        success: false,
        message: 'Token is invalid or has expired'
      }
    }

    // Get database connection
    const db = useDrizzle()
    
    // Find user by ID
    const users = await db
      .select()
      .from(tables.users)
      .where(eq(tables.users.id, userId))
      .limit(1)
    
    // Check if user exists
    if (users.length === 0) {
      return {
        success: false,
        message: 'User not found'
      }
    }
    
    // Generate a secure salt and hash the password
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)
    
    // Update user's password
    await db
      .update(tables.users)
      .set({
        password: hashedPassword
      })
      .where(eq(tables.users.id, userId))
    
    return {
      success: true,
      message: 'Password has been reset successfully'
    }
  } catch (error: any) {
    console.error('Reset password error:', error)
    
    return {
      success: false,
      message: 'An error occurred while resetting your password'
    }
  }
}) 