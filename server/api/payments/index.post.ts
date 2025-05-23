import { defineEventHandler, readBody, getRequestHeaders } from 'h3'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { useDrizzle } from '~/server/utils/drizzle'
import { orders, payments } from '~/server/database/schema'

/**
 * Record payment for an order
 */
export default defineEventHandler(async event => {
  try {
    // Verify auth token
    const headers = getRequestHeaders(event)
    const authHeader = headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: {
          success: false,
          message: 'Authentication required',
        },
      }
    }

    const token = authHeader.split(' ')[1]
    const config = useRuntimeConfig()

    // Verify JWT token
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string }
      if (!decoded || !decoded.id) {
        throw new Error('Invalid token payload')
      }

      const userId = decoded.id

      // Read request body
      const body = await readBody(event)

      const { orderId, amount, paymentMethod, paymentDate, notes = '' } = body

      // Validate required fields
      if (!orderId) {
        return {
          statusCode: 400,
          body: {
            success: false,
            message: 'Order ID is required',
          },
        }
      }

      if (!amount || amount <= 0) {
        return {
          statusCode: 400,
          body: {
            success: false,
            message: 'Valid payment amount is required',
          },
        }
      }

      if (!paymentMethod) {
        return {
          statusCode: 400,
          body: {
            success: false,
            message: 'Payment method is required',
          },
        }
      }

      if (!paymentDate) {
        return {
          statusCode: 400,
          body: {
            success: false,
            message: 'Payment date is required',
          },
        }
      }

      // Get database instance
      const db = useDrizzle()

      // Check if order exists
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      })

      if (!order) {
        return {
          statusCode: 404,
          body: {
            success: false,
            message: 'Order not found',
          },
        }
      }

      // Create payment record in database
      const createdAt = new Date()

      // Insert the payment record
      const result = await db
        .insert(payments)
        .values({
          orderId: Number(orderId), // Ensure orderId is a number
          amount: Number(amount), // Ensure amount is a number
          paymentMethod,
          paymentDate: new Date(paymentDate), // Convert timestamp to Date
          notes: notes || '',
          createdAt,
          createdBy: userId,
        })
        .returning({ id: payments.id })

      // Get the generated payment ID
      const paymentId = result[0]?.id

      return {
        success: true,
        message: 'Payment recorded successfully',
        data: {
          paymentId,
          amount,
          orderId,
        },
      }
    } catch (tokenError) {
      console.error('Token verification error:', tokenError)
      return {
        statusCode: 401,
        body: {
          success: false,
          message: 'Invalid or expired authentication token',
        },
      }
    }
  } catch (error: any) {
    console.error('Error recording payment:', error)

    return {
      statusCode: 500,
      body: {
        success: false,
        message: 'An error occurred while recording payment',
      },
    }
  }
})
