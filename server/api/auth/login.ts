import bcrypt from 'bcryptjs'
import { useDrizzle, tables, eq } from '~/server/utils/drizzle'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  try {
    // Get request body
    const { email, password, remember = false } = await readBody(event)
    
    // Validate required fields
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        message: 'Email and password are required'
      })
    }

    // Get database connection
    const db = useDrizzle()
    
    // Find user by email
    const users = await db
      .select()
      .from(tables.users)
      .where(eq(tables.users.email, email.toLowerCase()))
      .limit(1)
    
    // Check if user exists
    const user = users[0]
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid credentials'
      })
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid credentials'
      })
    }
    
    // Set user session with nuxt-auth-utils
    await setUserSession(event, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionPlan: 'free' // Default to free plan if not specified in user record
      },
      // Add any additional session data here
      loggedInAt: new Date()
    })

    // Generate JWT token for the client
    const config = useRuntimeConfig()
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionPlan: 'free' // Default to free plan if not specified in user record
      },
      config.jwtSecret,
      { 
        expiresIn: remember ? '30d' : '7d' 
      }
    )

    // Return user data and token without sensitive fields
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionPlan: 'free' // Default to free plan if not specified in user record
      },
      token
    }
  } catch (error: any) {
    console.error('Login error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Login failed'
    })
  }
}) 