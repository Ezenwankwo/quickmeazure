import { db } from '~/server/database';
import { orders, clients, styles, measurements } from '~/server/database/schema';
import { eq, and } from 'drizzle-orm';

// Define event handler for individual order operations
export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  const orderId = getRouterParam(event, 'id');
  
  // Get authenticated user from event context
  const auth = event.context.auth;
  if (!auth || !auth.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  if (!orderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Order ID is required',
    });
  }

  // Verify order exists and belongs to this user
  const orderWithClient = await db
    .select({
      id: orders.id,
      clientId: orders.clientId,
      measurementId: orders.measurementId,
      styleId: orders.styleId,
      status: orders.status,
      dueDate: orders.dueDate,
      totalAmount: orders.totalAmount,
      depositAmount: orders.depositAmount,
      balanceAmount: orders.balanceAmount,
      notes: orders.notes,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      // Include client name
      clientName: clients.name,
      // Include style if available
      styleName: styles.name,
      styleImageUrl: styles.imageUrl
    })
    .from(orders)
    .innerJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(styles, eq(orders.styleId, styles.id))
    .where(and(
      eq(orders.id, orderId),
      eq(clients.userId, auth.userId)
    ));

  if (orderWithClient.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found',
    });
  }

  // Handle GET request to fetch a single order
  if (method === 'GET') {
    return orderWithClient[0];
  }

  // Handle PATCH request to update order
  if (method === 'PATCH' || method === 'PUT') {
    try {
      const body = await readBody(event);
      console.log('Received update data:', JSON.stringify(body, null, 2));
      
      // Create a new update data object with explicit values
      // Type the update data to match the orders table schema
      const finalUpdateData: Partial<typeof orders.$inferInsert> = {
        // Only include fields that were sent
        ...(body.status !== undefined && { status: body.status }),
        ...(body.styleId !== undefined && { styleId: body.styleId === '' ? null : body.styleId }),
        ...(body.notes !== undefined && { notes: body.notes }),
        
        // Handle numeric values explicitly
        ...(body.totalAmount !== undefined && { 
          totalAmount: Number(body.totalAmount) || 0 
        }),
        
        ...(body.depositAmount !== undefined && { 
          depositAmount: Number(body.depositAmount) || 0 
        }),
        
        // Set updatedAt timestamp
        updatedAt: new Date(Date.now())
      };
      
      // Handle measurementId separately due to validation requirement
      if (body.measurementId !== undefined && body.measurementId !== orderWithClient[0].measurementId) {
        // Additional check to ensure measurement belongs to this client
        const measurement = await db.query.measurements.findFirst({
          where: and(
            eq(measurements.id, body.measurementId),
            eq(measurements.clientId, orderWithClient[0].clientId)
          ),
        });
        
        if (!measurement) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Measurement does not exist or does not belong to this client',
          });
        }
        
        finalUpdateData.measurementId = body.measurementId;
      }
      
      // Handle due date separately to avoid getTime errors
      if (body.dueDate !== undefined) {
        if (body.dueDate === null || body.dueDate === '') {
          finalUpdateData.dueDate = null;
        } else if (typeof body.dueDate === 'number') {
          finalUpdateData.dueDate = new Date(body.dueDate);
        } else {
          // Don't try to parse the date, just use null
          finalUpdateData.dueDate = null;
        }
      }
      
      // Calculate balance amount
      if (finalUpdateData.totalAmount !== undefined || finalUpdateData.depositAmount !== undefined) {
        const totalAmount = finalUpdateData.totalAmount !== undefined 
          ? Number(finalUpdateData.totalAmount)
          : Number(orderWithClient[0].totalAmount);
          
        const depositAmount = finalUpdateData.depositAmount !== undefined 
          ? Number(finalUpdateData.depositAmount || 0)
          : Number(orderWithClient[0].depositAmount || 0);
          
        finalUpdateData.balanceAmount = totalAmount - depositAmount;
      }
      
      console.log('Final update data:', finalUpdateData);

      // If no fields to update, return existing order
      if (Object.keys(finalUpdateData).length === 0) {
        return orderWithClient[0];
      }
      
      // Perform update
      console.log(`Executing UPDATE for order ${orderId} with data:`, finalUpdateData);
      
      // Use try/catch specifically for the database operation
      try {
        await db.update(orders)
          .set(finalUpdateData)
          .where(eq(orders.id, orderId));
          
        console.log('Order updated successfully');
      } catch (dbError: any) {
        console.error('Database operation failed:', dbError);
        throw new Error(`Database operation failed: ${dbError.message || 'Unknown error'}`);
      }
      
      // Return updated order
      return {
        ...orderWithClient[0],
        ...finalUpdateData
      };
    } catch (error: any) {
      console.error('Error updating order:', error);
      if (error.statusCode) {
        throw error; // Re-throw validation errors
      }
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message || 'Unknown error'}`,
      });
    }
  }

  // Handle DELETE request to delete order
  if (method === 'DELETE') {
    try {
      await db.delete(orders).where(eq(orders.id, orderId));
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting order:', error);
      if (error.statusCode) {
        throw error; // Re-throw validation errors
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete order',
      });
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
}); 