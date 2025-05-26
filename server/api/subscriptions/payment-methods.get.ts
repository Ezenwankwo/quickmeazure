import { defineEventHandler, createError, getRequestHeaders } from 'h3'
import jwt from 'jsonwebtoken'
import { useDrizzle, tables, eq } from '~/server/utils/drizzle'

/**
 * Get the current user's payment methods
 */
export default defineEventHandler(async event => {
  try {
    // Get user from auth token
    const headers = getRequestHeaders(event)
    const authHeader = headers.authorization || ''

    // Check for token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - No valid token provided',
      })
    }

    // Extract and verify token
    const token = authHeader.split(' ')[1]
    const config = useRuntimeConfig()

    console.log('Verifying token for payment methods endpoint')

    try {
      // Make sure we have a valid JWT secret
      if (!config.jwtSecret) {
        console.error('JWT_SECRET is not configured properly')
        throw createError({
          statusCode: 500,
          message: 'Server configuration error',
        })
      }

      const decoded = jwt.verify(token, config.jwtSecret) as { id: string | number }
      console.log('Token verified, user ID:', decoded?.id)

      if (!decoded || !decoded.id) {
        console.error('Invalid token payload, missing ID')
        throw new Error('Invalid token payload')
      }

      const userId = decoded.id

      // Get database instance
      const db = useDrizzle()

      // Find the user's payment methods
      console.log('Querying for payment methods for user ID:', userId)

      const paymentMethods = await db
        .select()
        .from(tables.paymentMethods)
        .where(eq(tables.paymentMethods.userId, Number(userId)))
        .execute()

      return {
        success: true,
        data: paymentMethods.map(method => ({
          id: method.id,
          type: method.type,
          last4: method.last4,
          expiryMonth: method.expiryMonth,
          expiryYear: method.expiryYear,
          isDefault: method.isDefault,
          brand: method.brand,
          createdAt: method.createdAt,
        })),
      }
    } catch (tokenError) {
      console.error('Token verification error:', tokenError)
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - Invalid token',
      })
    }
  } catch (err) {
    console.error('Error retrieving payment methods:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Internal server error',
    })
  }
})
