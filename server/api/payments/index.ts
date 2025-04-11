import { db } from '~/server/database';
import { payments, orders, clients } from '~/server/database/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, SQL } from 'drizzle-orm';

// Define event handler for payments API
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

  // Handle GET request to fetch all payments for a user
  if (method === 'GET') {
    try {
      // Get order ID from query params if available
      const query = getQuery(event);
      const orderId = query.orderId?.toString();
      
      // Build the query to join with orders and clients
      let queryBuilder = db
        .select({
          id: payments.id,
          orderId: payments.orderId,
          amount: payments.amount,
          paymentMethod: payments.paymentMethod,
          paymentDate: payments.paymentDate,
          notes: payments.notes,
          createdAt: payments.createdAt,
          // Include order and client info
          clientId: clients.id,
          clientName: clients.name,
        })
        .from(payments)
        .innerJoin(orders, eq(payments.orderId, orders.id))
        .innerJoin(clients, eq(orders.clientId, clients.id))
        .where(eq(clients.userId, auth.userId));
      
      // Add order ID filter if provided
      if (orderId) {
        // Create a new query with an additional filter
        queryBuilder = db
          .select({
            id: payments.id,
            orderId: payments.orderId,
            amount: payments.amount,
            paymentMethod: payments.paymentMethod,
            paymentDate: payments.paymentDate,
            notes: payments.notes,
            createdAt: payments.createdAt,
            // Include order and client info
            clientId: clients.id,
            clientName: clients.name,
          })
          .from(payments)
          .innerJoin(orders, eq(payments.orderId, orders.id))
          .innerJoin(clients, eq(orders.clientId, clients.id))
          .where(and(
            eq(clients.userId, auth.userId),
            eq(payments.orderId, orderId)
          ));
      }
      
      const allPayments = await queryBuilder;
      return allPayments;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch payments',
      });
    }
  }

  // Handle POST request to create a new payment
  if (method === 'POST') {
    try {
      const body = await readBody(event);
      
      // Validate required fields
      if (!body.orderId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Order ID is required',
        });
      }

      if (!body.amount || body.amount <= 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Valid payment amount is required',
        });
      }

      // Verify order exists and belongs to this user
      const orderWithClient = await db
        .select({
          id: orders.id,
          clientId: orders.clientId,
          totalAmount: orders.totalAmount,
          depositAmount: orders.depositAmount,
          balanceAmount: orders.balanceAmount,
          clientName: clients.name,
        })
        .from(orders)
        .innerJoin(clients, eq(orders.clientId, clients.id))
        .where(and(
          eq(orders.id, body.orderId),
          eq(clients.userId, auth.userId)
        ));

      if (orderWithClient.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Order not found',
        });
      }

      const order = orderWithClient[0];
      const balanceAmount = order.balanceAmount || 0;
      
      // Verify payment amount doesn't exceed balance
      if (body.amount > balanceAmount) {
        throw createError({
          statusCode: 400,
          statusMessage: `Payment amount exceeds remaining balance of ${balanceAmount}`,
        });
      }

      // Create new payment
      const newPayment = {
        id: uuidv4(),
        orderId: body.orderId,
        amount: body.amount,
        paymentMethod: body.paymentMethod || 'Other',
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        notes: body.notes || null,
        createdAt: new Date(),
      };

      await db.insert(payments).values(newPayment);
      
      // Return the new payment with order and client info
      return {
        ...newPayment,
        clientId: order.clientId,
        clientName: order.clientName,
      };
    } catch (error: any) {
      console.error('Error creating payment:', error);
      if (error.statusCode) {
        throw error; // Re-throw validation errors
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create payment',
      });
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
}); 