import { getUserSession } from '#imports'
import { defineEventHandler, createError, getRequestHeaders } from 'h3'
import jwt from 'jsonwebtoken'

// Define the token payload type
interface TokenPayload {
  id: string | number;
  email?: string;
  name?: string;
  subscriptionPlan?: string;
  subscriptionExpiry?: number | null;
  iat?: number;
  exp?: number;
}

export default defineEventHandler(async (event) => {
  const path = event.path || ''
  
  // Only apply auth checks to /api routes, skipping frontend routes entirely
  if (!path.startsWith('/api')) {
    return
  }
  
  // Skip auth for public API routes
  if (
    path.startsWith('/api/auth') || 
    path.startsWith('/api/public') ||
    path.includes('reset-password') ||
    path === '/api/test/config'
  ) {
    return
  }

  // Check if auth should be skipped (for specific endpoints)
  if (event.context.auth?.skip) {
    return
  }

  // Get user session from nuxt-auth-utils
  const session = await getUserSession(event)
  
  // If we have a valid session, continue
  if (session && session.user) {
    // Attach user to context for use in API routes
    event.context.user = session.user
    
    // Set auth context for backward compatibility with existing API endpoints
    // Use type assertion to access id property safely
    const user = session.user as any
    event.context.auth = {
      userId: user.id,
      user: session.user
    }
    
    return
  }

  // If no valid session, check for Authorization header (JWT token)
  const headers = getRequestHeaders(event)
  const authHeader = headers.authorization || ''
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized - Authentication required'
    })
  }
  
  // Extract token from header
  const token = authHeader.substring(7)
  
  // Verify JWT token
  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload
    
    // Set auth context with user ID from token
    event.context.auth = {
      userId: decoded.id,
      user: decoded
    }
  } catch (error) {
    console.error('JWT verification failed:', error)
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired token'
    })
  }
}) 