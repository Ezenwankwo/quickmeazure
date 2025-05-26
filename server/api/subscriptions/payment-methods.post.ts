/**
 * Create a new payment method for the user
 * This endpoint is called after a successful Paystack payment verification
 */
import { useDrizzle, tables, eq } from '~/server/utils/drizzle'
import { verifyToken } from '~/server/utils/auth'

export default defineEventHandler(async event => {
  try {
    // Get request body
    const body = await readBody(event)
    const { reference, cardDetails } = body

    if (!reference) {
      return {
        statusCode: 400,
        success: false,
        message: 'Payment reference is required',
      }
    }

    // Verify user token
    console.log('Verifying token for payment method creation endpoint')
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        success: false,
        message: 'Unauthorized: Missing or invalid token',
      }
    }

    // Extract and verify token
    const token = authHeader.substring(7)

    // Verify the token
    const decoded = await verifyToken(token)

    if (!decoded || !decoded.id) {
      return {
        statusCode: 401,
        success: false,
        message: 'Unauthorized: Invalid token',
      }
    }

    const userId = decoded.id

    // Initialize the database
    const db = useDrizzle()

    // Insert the new payment method
    console.log('Creating payment method for user ID:', userId)

    const newPaymentMethod = await db
      .insert(tables.paymentMethods)
      .values({
        userId: Number(userId),
        type: cardDetails.type || 'card',
        last4: cardDetails.last4,
        expiryMonth: cardDetails.expiryMonth,
        expiryYear: cardDetails.expiryYear,
        brand: cardDetails.brand,
        isDefault: true, // Make this the default payment method
        provider: 'paystack',
        providerId: cardDetails.providerId || reference,
        metadata: cardDetails.metadata || {},
      })
      .returning()

    // If this is the first payment method or set as default,
    // update any existing payment methods to not be default
    if (newPaymentMethod.length > 0 && newPaymentMethod[0].isDefault) {
      await db
        .update(tables.paymentMethods)
        .set({ isDefault: false })
        .where(
          eq(tables.paymentMethods.userId, Number(userId)) &&
            eq(tables.paymentMethods.id, newPaymentMethod[0].id, true)
        )
    }

    return {
      statusCode: 201,
      success: true,
      message: 'Payment method created successfully',
      data: {
        id: newPaymentMethod[0].id,
        type: newPaymentMethod[0].type,
        last4: newPaymentMethod[0].last4,
        expiryMonth: newPaymentMethod[0].expiryMonth,
        expiryYear: newPaymentMethod[0].expiryYear,
        brand: newPaymentMethod[0].brand,
        isDefault: newPaymentMethod[0].isDefault,
        createdAt: newPaymentMethod[0].createdAt,
      },
    }
  } catch (err: any) {
    console.error('Error creating payment method:', err)
    return {
      statusCode: 500,
      success: false,
      message: err.message || 'An error occurred while creating the payment method',
    }
  }
})
