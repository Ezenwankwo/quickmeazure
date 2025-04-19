import jwt from 'jsonwebtoken'
import { useDrizzle, tables, eq } from '~/server/utils/drizzle'

// Define the token payload type
interface TokenPayload {
  id: string | number;
  email: string;
  name: string;
  subscriptionPlan?: string;
  subscriptionExpiry?: number | null;
  iat?: number;
  exp?: number;
}

export default defineEventHandler(async (event) => {
  // Skip auth check for this endpoint
  event.context.auth = { skip: true };
  
  try {
    // First check for existing session
    const session = await getUserSession(event)
    
    // Get the JWT token from Authorization header (using Bearer token)
    const headers = getRequestHeaders(event)
    const authHeader = headers.authorization || ''
    let token = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    
    // If no token, check if token is in cookies
    if (!token) {
      token = getCookie(event, 'auth_token')
    }
    
    // If no token found, check if we have a session
    if (!token && session && session.user) {
      // We have a session but no token - just refresh the session
      return {
        success: true,
        user: session.user
      }
    }
    
    // If no token found and no session, throw error
    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'No valid token found'
      })
    }
    
    // Verify and decode the token
    const config = useRuntimeConfig()
    let decoded: TokenPayload
    
    try {
      decoded = jwt.verify(token, config.jwtSecret) as TokenPayload
    } catch (error) {
      // If token verification fails but we have a session, use the session
      if (session && session.user) {
        return {
          success: true,
          user: session.user
        }
      }
      
      // If token verification fails and no session, throw error
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token'
      })
    }
    
    // Get user ID from decoded token and ensure it's a number
    const userId = typeof decoded.id === 'string' ? parseInt(decoded.id, 10) : decoded.id
    
    // Get database connection
    const db = useDrizzle()
    
    // Fetch user from database
    const users = await db
      .select()
      .from(tables.users)
      .where(eq(tables.users.id, userId))
      .limit(1)
    
    if (users.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'User not found'
      })
    }
    
    const user = users[0]
    
    // Check for active subscription
    let subscriptionPlan = 'free'
    let subscriptionExpiry = null
    
    const subscriptions = await db
      .select()
      .from(tables.subscriptions)
      .where(eq(tables.subscriptions.userId, user.id))
      .limit(1)
    
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
    
    // Generate new JWT token with longer expiry
    const newToken = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionPlan,
        subscriptionExpiry
      },
      config.jwtSecret,
      { 
        expiresIn: '7d' // 7 days
      }
    )
    
    // Create user object for session and response
    const userObj = {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionPlan,
      subscriptionExpiry,
      token: newToken // Include token in user object for client access
    }
    
    // Update the user session with nuxt-auth-utils
    await setUserSession(event, {
      user: userObj
    })
    
    // Set the token as cookie
    setCookie(event, 'auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })
    
    return {
      success: true,
      user: userObj,
      token: newToken
    }
  } catch (error: any) {
    console.error('Token refresh error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to refresh token'
    })
  }
}) 