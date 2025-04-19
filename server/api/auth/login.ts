import bcrypt from 'bcryptjs'
import { useDrizzle, tables, eq, desc } from '~/server/utils/drizzle'
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
    
    // Get user's subscription info, if any
    const subscriptions = await db
      .select()
      .from(tables.subscriptions)
      .where(
        eq(tables.subscriptions.userId, user.id)
      )
      .orderBy(desc(tables.subscriptions.createdAt))
      .limit(1)
    
    // Determine subscription plan
    let subscriptionPlan = 'free'
    let subscriptionExpiry = null
    
    if (subscriptions.length > 0) {
      const subscription = subscriptions[0]
      if (subscription.status === 'active') {
        // Get plan details
        const plans = await db
          .select()
          .from(tables.plans)
          .where(eq(tables.plans.id, subscription.planId))
          .limit(1)
        
        if (plans.length > 0) {
          subscriptionPlan = plans[0].name.toLowerCase()
        }
        
        // Set expiry if available
        if (subscription.endDate) {
          subscriptionExpiry = new Date(subscription.endDate).getTime()
        }
      }
    }

    // Generate JWT token
    const config = useRuntimeConfig()
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionPlan,
        subscriptionExpiry
      },
      config.jwtSecret,
      { 
        expiresIn: remember ? '30d' : '7d' 
      }
    )

    // Set user session with nuxt-auth-utils
    await setUserSession(event, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionPlan,
        subscriptionExpiry
      }
    })
    
    // Set the token as cookie for API access
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7, // 30 days or 7 days
      path: '/'
    })

    // Return user data and token without sensitive fields
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionPlan,
        subscriptionExpiry
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