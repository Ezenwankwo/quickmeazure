/**
 * Create or update a payment method for the user
 * This endpoint is called after a successful Paystack payment verification
 * Using the single payment method approach - each user has only one payment method
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
    console.log('Verifying token for payment method endpoint')
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

    // Check if the user already has a payment method
    const existingPaymentMethod = await db.query.paymentMethods.findFirst({
      where: eq(tables.paymentMethods.userId, Number(userId)),
    })

    let paymentMethod

    if (existingPaymentMethod) {
      // Update the existing payment method
      console.log('Updating existing payment method for user ID:', userId)

      paymentMethod = await db
        .update(tables.paymentMethods)
        .set({
          type: cardDetails.type || 'card',
          last4: cardDetails.last4,
          expiryMonth: cardDetails.expiryMonth,
          expiryYear: cardDetails.expiryYear,
          brand: cardDetails.brand,
          provider: 'paystack',
          providerId: cardDetails.providerId || reference,
          metadata: cardDetails.metadata || {},
          updatedAt: new Date(),
        })
        .where(eq(tables.paymentMethods.id, existingPaymentMethod.id))
        .returning()
    } else {
      // Create a new payment method
      console.log('Creating new payment method for user ID:', userId)

      paymentMethod = await db
        .insert(tables.paymentMethods)
        .values({
          userId: Number(userId),
          type: cardDetails.type || 'card',
          last4: cardDetails.last4,
          expiryMonth: cardDetails.expiryMonth,
          expiryYear: cardDetails.expiryYear,
          brand: cardDetails.brand,
          isDefault: true, // Always true since it's the only one
          provider: 'paystack',
          providerId: cardDetails.providerId || reference,
          metadata: cardDetails.metadata || {},
        })
        .returning()
    }

    const result = paymentMethod[0]

    return {
      statusCode: existingPaymentMethod ? 200 : 201,
      success: true,
      message: existingPaymentMethod
        ? 'Payment method updated successfully'
        : 'Payment method created successfully',
      data: {
        id: result.id,
        type: result.type,
        last4: result.last4,
        expiryMonth: result.expiryMonth,
        expiryYear: result.expiryYear,
        brand: result.brand,
        isDefault: true, // Always true in the single payment method approach
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
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
