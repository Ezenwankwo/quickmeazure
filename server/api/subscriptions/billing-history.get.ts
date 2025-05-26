import { defineEventHandler, createError, getRequestHeaders } from 'h3'
import jwt from 'jsonwebtoken'
import { useDrizzle, tables, eq, desc } from '~/server/utils/drizzle'

/**
 * Get the current user's billing history
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

    console.log('Verifying token for billing history endpoint')

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

      // Find the user's subscription payment history
      // Using a simpler query approach to avoid relation errors
      console.log('Querying for subscription payment history for user ID:', userId)

      const payments = await db
        .select()
        .from(tables.subscriptionPayments)
        .where(eq(tables.subscriptionPayments.userId, Number(userId)))
        .orderBy(desc(tables.subscriptionPayments.createdAt))
        .limit(10) // Limit to last 10 payments
        .execute()

      return {
        success: true,
        data: payments.map(payment => ({
          id: payment.id,
          date: payment.createdAt,
          description: payment.description || 'Subscription Payment',
          amount: payment.amount,
          status: payment.status,
          reference: payment.reference,
          metadata: payment.metadata,
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
    console.error('Error retrieving billing history:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Internal server error',
    })
  }
})
