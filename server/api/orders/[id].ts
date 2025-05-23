import { eq, and, sql } from 'drizzle-orm'
import { db } from '~/server/database'
import { orders, clients, styles, measurements } from '~/server/database/schema'

// Define interfaces for our data structures
interface OrderDetails {
  styleId?: number | null
  measurementId?: number | null
  depositAmount?: number
  balanceAmount?: number
  notes?: string | null
  [key: string]: any // Allow for additional properties
}

interface OrderUpdateData {
  status?: string
  description?: string | null
  dueDate?: string | null
  totalAmount?: number
  details?: OrderDetails
  updatedAt: Date
}

// Define event handler for individual order operations
export default defineEventHandler(async event => {
  const method = getMethod(event)
  const orderId = getRouterParam(event, 'id')

  // Get authenticated user from event context
  const auth = event.context.auth
  if (!auth || !auth.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  if (!orderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Order ID is required',
    })
  }

  // Verify order exists and belongs to this user
  const orderWithClient = await db
    .select({
      id: orders.id,
      clientId: orders.clientId,
      status: orders.status,
      dueDate: orders.dueDate,
      totalAmount: orders.totalAmount,
      description: orders.description,
      details: orders.details,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      // Include client name
      clientName: clients.name,
      // Include style if available
      styleName: styles.name,
      styleImageUrl: styles.imageUrl,
    })
    .from(orders)
    .innerJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(styles, eq(sql`CAST((${orders.details}->>'styleId') AS INTEGER)`, styles.id))
    .where(and(eq(orders.id, parseInt(orderId)), eq(clients.userId, auth.userId)))

  if (orderWithClient.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found',
    })
  }

  // Handle GET request to fetch a single order
  if (method === 'GET') {
    // Extract values from details JSON
    const details = (orderWithClient[0].details || {}) as OrderDetails
    return {
      ...orderWithClient[0],
      measurementId: details.measurementId,
      styleId: details.styleId,
      depositAmount: details.depositAmount || 0,
      balanceAmount: details.balanceAmount || 0,
      notes: details.notes,
    }
  }

  // Handle PATCH request to update order
  if (method === 'PATCH' || method === 'PUT') {
    try {
      const body = await readBody(event)
      console.log('Received update data:', JSON.stringify(body, null, 2))

      // Get existing order details
      const currentDetails = (orderWithClient[0].details || {}) as OrderDetails

      // Create updated details object
      const updatedDetails: OrderDetails = {
        ...currentDetails,
        ...(body.styleId !== undefined && {
          styleId: body.styleId === '' ? null : parseInt(body.styleId),
        }),
        ...(body.measurementId !== undefined && {
          measurementId: body.measurementId === '' ? null : parseInt(body.measurementId),
        }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.depositAmount !== undefined && { depositAmount: Number(body.depositAmount) || 0 }),
      }

      // Create a new update data object with explicit values
      const finalUpdateData: OrderUpdateData = {
        // Only include fields that were sent
        ...(body.status !== undefined && { status: body.status }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.totalAmount !== undefined && { totalAmount: Number(body.totalAmount) || 0 }),

        // Set updatedAt timestamp
        updatedAt: new Date(Date.now()),
      }

      // If details were updated, include them
      if (JSON.stringify(currentDetails) !== JSON.stringify(updatedDetails)) {
        finalUpdateData.details = updatedDetails
      }

      // Handle measurementId separately due to validation requirement
      if (body.measurementId !== undefined && body.measurementId !== currentDetails.measurementId) {
        // Additional check to ensure measurement belongs to this client
        const measurement = await db.query.measurements.findFirst({
          where: and(
            eq(measurements.id, parseInt(body.measurementId)),
            eq(measurements.clientId, orderWithClient[0].clientId)
          ),
        })

        if (!measurement && body.measurementId) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Measurement does not exist or does not belong to this client',
          })
        }
      }

      // Handle due date separately to avoid getTime errors
      if (body.dueDate !== undefined) {
        if (body.dueDate === null || body.dueDate === '') {
          finalUpdateData.dueDate = null
        } else if (typeof body.dueDate === 'number') {
          // Parse as date string instead of Date object to match schema
          finalUpdateData.dueDate = new Date(body.dueDate).toISOString().split('T')[0]
        } else {
          // Don't try to parse the date, just use null
          finalUpdateData.dueDate = null
        }
      }

      // Calculate balance amount
      if (finalUpdateData.totalAmount !== undefined || updatedDetails.depositAmount !== undefined) {
        const totalAmount =
          finalUpdateData.totalAmount !== undefined
            ? Number(finalUpdateData.totalAmount)
            : Number(orderWithClient[0].totalAmount)

        const depositAmount =
          updatedDetails.depositAmount !== undefined
            ? Number(updatedDetails.depositAmount || 0)
            : Number(currentDetails.depositAmount || 0)

        updatedDetails.balanceAmount = totalAmount - depositAmount

        // Update the details object with new balance
        if (!finalUpdateData.details) {
          finalUpdateData.details = updatedDetails
        }
      }

      console.log('Final update data:', finalUpdateData)

      // If no fields to update, return existing order
      if (Object.keys(finalUpdateData).length === 0) {
        // Extract values from details JSON
        const details = (orderWithClient[0].details || {}) as OrderDetails
        return {
          ...orderWithClient[0],
          measurementId: details.measurementId,
          styleId: details.styleId,
          depositAmount: details.depositAmount || 0,
          balanceAmount: details.balanceAmount || 0,
          notes: details.notes,
        }
      }

      // Perform update
      console.log(`Executing UPDATE for order ${orderId} with data:`, finalUpdateData)

      // Use try/catch specifically for the database operation
      try {
        await db
          .update(orders)
          .set(finalUpdateData)
          .where(eq(orders.id, parseInt(orderId)))

        console.log('Order updated successfully')
      } catch (dbError: any) {
        console.error('Database operation failed:', dbError)
        throw new Error(`Database operation failed: ${dbError.message || 'Unknown error'}`)
      }

      // Return updated order with combined data
      const updatedOrderData = {
        ...orderWithClient[0],
        ...finalUpdateData,
        // Extract fields from details
        measurementId: updatedDetails.measurementId,
        styleId: updatedDetails.styleId,
        depositAmount: updatedDetails.depositAmount || 0,
        balanceAmount: updatedDetails.balanceAmount || 0,
        notes: updatedDetails.notes,
      }

      return updatedOrderData
    } catch (error: any) {
      console.error('Error updating order:', error)
      if (error.statusCode) {
        throw error // Re-throw validation errors
      }
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message || 'Unknown error'}`,
      })
    }
  }

  // Handle DELETE request to delete order
  if (method === 'DELETE') {
    try {
      await db.delete(orders).where(eq(orders.id, parseInt(orderId)))
      return { success: true }
    } catch (error: any) {
      console.error('Error deleting order:', error)
      if (error.statusCode) {
        throw error // Re-throw validation errors
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete order',
      })
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  })
})
