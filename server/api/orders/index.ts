import { db } from '~/server/database';
import { orders, clients, styles } from '~/server/database/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';

// Define event handler for orders API
export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  const userId = '1'; // In a real app, this would come from authentication

  // Handle GET request to fetch all orders
  if (method === 'GET') {
    try {
      // Join with clients to ensure we only get orders for this user's clients
      const allOrders = await db
        .select({
          id: orders.id,
          clientId: orders.clientId,
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
        .where(eq(clients.userId, userId));

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
          eq(clients.userId, userId)
        ));

      if (clientExists.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Client not found',
        });
      }

      // Verify style exists and belongs to user if provided
      if (body.styleId) {
        const styleExists = await db.select()
          .from(styles)
          .where(and(
            eq(styles.id, body.styleId),
            eq(styles.userId, userId)
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
        styleId: body.styleId || null,
        status: body.status || 'Pending',
        dueDate: body.dueDate || null,
        totalAmount,
        depositAmount,
        balanceAmount,
        notes: body.notes || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.insert(orders).values(newOrder);
      
      // Return the new order with client and style info
      return {
        ...newOrder,
        clientName: clientExists[0].name,
        styleName: body.styleId ? (await db.select().from(styles).where(eq(styles.id, body.styleId)))[0]?.name : null,
        styleImageUrl: body.styleId ? (await db.select().from(styles).where(eq(styles.id, body.styleId)))[0]?.imageUrl : null
      };
    } catch (error) {
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