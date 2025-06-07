/**
 * Delete the payment method for the user
 * This endpoint is called when a user wants to remove their payment method
 * In the single payment method approach, this completely removes the user's payment information
 */
import { useDrizzle, tables, eq, and } from '~/server/utils/drizzle'
import { verifyToken } from '~/server/utils/auth'

export default defineEventHandler(async event => {
  try {
    // Get payment method ID from the URL
    const id = event.context.params?.id

    if (!id || isNaN(Number(id))) {
      return {
        statusCode: 400,
        success: false,
        message: 'Invalid payment method ID',
      }
    }

    // Get authenticated user from event context (set by auth middleware)
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      return {
        statusCode: 401,
        success: false,
        message: 'Unauthorized',
      }
    }

    console.log('Authenticated user ID:', auth.userId)
    const userId = auth.userId

    if (!userId) {
      return {
        statusCode: 401,
        success: false,
        message: 'Unauthorized: Invalid token',
      }
    }

    // Initialize the database
    const db = useDrizzle()

    // Check if the payment method exists and belongs to the user
    const paymentMethod = await db
      .select()
      .from(tables.paymentMethods)
      .where(
        and(
          eq(tables.paymentMethods.id, Number(id)),
          eq(tables.paymentMethods.userId, Number(userId))
        )
      )
      .limit(1)

    if (!paymentMethod || paymentMethod.length === 0) {
      return {
        statusCode: 404,
        success: false,
        message: 'Payment method not found or does not belong to the user',
      }
    }

    // Delete the payment method
    console.log('Deleting payment method with ID:', id, 'for user:', userId)

    const deletedPaymentMethod = await db
      .delete(tables.paymentMethods)
      .where(
        and(
          eq(tables.paymentMethods.id, Number(id)),
          eq(tables.paymentMethods.userId, Number(userId))
        )
      )
      .returning()

    if (!deletedPaymentMethod || deletedPaymentMethod.length === 0) {
      throw new Error('Failed to delete payment method')
    }

    return {
      statusCode: 200,
      success: true,
      message: 'Payment method deleted successfully',
      data: {
        id: Number(id),
        deleted: true,
      },
    }
  } catch (err: any) {
    console.error('Error deleting payment method:', err)
    return {
      statusCode: 500,
      success: false,
      message: err.message || 'An error occurred while deleting the payment method',
    }
  }
})
