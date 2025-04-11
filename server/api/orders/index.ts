import { db } from '~/server/database';
import { orders, clients, styles, measurements } from '~/server/database/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';

// Define event handler for orders API
export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  
  // Get authenticated user from event context
  const auth = event.context.auth;
  if (!auth || !auth.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  // Handle GET request to fetch all orders
  if (method === 'GET') {
    try {
      // Check for clientId filter
      const query = getQuery(event);
      const clientId = query.clientId as string;
      
      // Build where condition based on clientId filter
      const whereCondition = clientId 
        ? and(eq(clients.userId, auth.userId), eq(orders.clientId, clientId))
        : eq(clients.userId, auth.userId);
      
      // Execute query with the appropriate filter
      const allOrders = await db
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
          // Include client name for display
          clientName: clients.name,
          // Include style name if available
          styleName: styles.name,
          styleImageUrl: styles.imageUrl
        })
        .from(orders)
        .innerJoin(clients, eq(orders.clientId, clients.id))
        .leftJoin(styles, eq(orders.styleId, styles.id))
        .where(whereCondition);

      return allOrders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch orders',
      });
    }
  }

  // Handle POST request to create a new order
  if (method === 'POST') {
    try {
      const body = await readBody(event);
      
      // Validate required fields
      if (!body.clientId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Client ID is required',
        });
      }
      
      if (!body.measurementId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Measurement ID is required',
        });
      }

      if (!body.totalAmount) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Total amount is required',
        });
      }

      // Verify client exists and belongs to user
      const clientExists = await db.select()
        .from(clients)
        .where(and(
          eq(clients.id, body.clientId),
          eq(clients.userId, auth.userId)
        ));

      if (clientExists.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Client not found',
        });
      }
      
      // Verify measurement exists and belongs to this client
      const measurementExists = await db.select()
        .from(measurements)
        .where(and(
          eq(measurements.id, body.measurementId),
          eq(measurements.clientId, body.clientId)
        ));
        
      if (measurementExists.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Measurement not found or does not belong to this client',
        });
      }

      // Verify style exists and belongs to user if provided
      if (body.styleId) {
        const styleExists = await db.select()
          .from(styles)
          .where(and(
            eq(styles.id, body.styleId),
            eq(styles.userId, auth.userId)
          ));

        if (styleExists.length === 0) {
          throw createError({
            statusCode: 404,
            statusMessage: 'Style not found',
          });
        }
      }

      // Calculate balance amount
      const depositAmount = body.depositAmount || 0;
      const totalAmount = body.totalAmount;
      const balanceAmount = totalAmount - depositAmount;

      // Create new order
      const newOrder = {
        id: uuidv4(),
        clientId: body.clientId,
        measurementId: body.measurementId,
        styleId: body.styleId || null,
        status: body.status || 'pending',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        totalAmount,
        depositAmount,
        balanceAmount,
        notes: body.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(orders).values(newOrder);
      
      // Return the new order with client and style info
      return {
        ...newOrder,
        clientName: clientExists[0].name,
        styleName: body.styleId ? (await db.select().from(styles).where(eq(styles.id, body.styleId)))[0]?.name : null,
        styleImageUrl: body.styleId ? (await db.select().from(styles).where(eq(styles.id, body.styleId)))[0]?.imageUrl : null
      };
    } catch (error: any) {
      console.error('Error creating order:', error);
      if (error.statusCode) {
        throw error; // Re-throw validation errors
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create order',
      });
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
});