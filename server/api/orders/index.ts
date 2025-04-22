import { db } from '~/server/database';
import { orders, clients, styles, measurements } from '~/server/database/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, asc, sql, count } from 'drizzle-orm';

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
      // Get query parameters
      const query = getQuery(event);
      const clientId = query.clientId ? parseInt(query.clientId as string) : undefined;
      const page = parseInt(query.page as string || '1');
      const limit = parseInt(query.limit as string || '10');
      const sortField = (query.sortField as string) || 'createdAt';
      const sortOrder = (query.sortOrder as string) || 'desc';
      const search = query.search as string | undefined;
      const status = query.status as string | undefined;
      const dueDateStart = query.dueDateStart as string | undefined;
      const dueDateEnd = query.dueDateEnd as string | undefined;
      
      // Validate pagination parameters
      if (isNaN(page) || page < 1) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid page parameter',
        });
      }
      
      if (isNaN(limit) || limit < 1 || limit > 100) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid limit parameter (must be between 1 and 100)',
        });
      }
      
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Build where conditions for filtering
      const whereConditions = [];
      
      // Always filter by user ID (via clients table)
      whereConditions.push(eq(clients.userId, auth.userId));
      
      // Add client filter if provided
      if (clientId) {
        whereConditions.push(eq(orders.clientId, clientId));
      }
      
      // Add search filter if provided
      if (search && search.trim() !== '') {
        whereConditions.push(
          sql`(lower(${clients.name}) like ${`%${search.toLowerCase()}%`} OR
               ${orders.id} like ${`%${search}%`})`
        );
      }
      
      // Add status filter if provided
      if (status) {
        whereConditions.push(eq(orders.status, status));
      }
      
      // Add due date range filters if provided
      if (dueDateStart) {
        whereConditions.push(sql`${orders.dueDate} >= ${dueDateStart}`);
      }
      
      if (dueDateEnd) {
        whereConditions.push(sql`${orders.dueDate} <= ${dueDateEnd}`);
      }
      
      // Build base query with all conditions
      const baseQuery = db
        .select({
          id: orders.id,
          clientId: orders.clientId,
          dueDate: orders.dueDate,
          totalAmount: orders.totalAmount,
          status: orders.status,
          description: orders.description,
          details: orders.details,
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
        .leftJoin(measurements, eq(measurements.clientId, clients.id))
        .leftJoin(styles, eq(styles.id, sql`CAST((${orders.details}->>'styleId') AS INTEGER)`))
        .where(and(...whereConditions));
      
      // Build count query with same conditions
      const countQuery = db
        .select({
          count: count()
        })
        .from(orders)
        .innerJoin(clients, eq(orders.clientId, clients.id))
        .where(and(...whereConditions));
      
      // Determine sort direction
      const sortDirection = sortOrder === 'asc' ? asc : desc;
      
      // Apply sorting
      let orderByClause;
      switch (sortField) {
        case 'client':
          orderByClause = sortDirection(clients.name);
          break;
        case 'dueDate':
          orderByClause = sortDirection(orders.dueDate);
          break;
        case 'status':
          orderByClause = sortDirection(orders.status);
          break;
        case 'totalAmount':
          orderByClause = sortDirection(orders.totalAmount);
          break;
        case 'createdAt':
          orderByClause = sortDirection(orders.createdAt);
          break;
        case 'updatedAt':
          orderByClause = sortDirection(orders.updatedAt);
          break;
        default:
          orderByClause = sortDirection(orders.createdAt);
          break;
      }
      
      // Apply sorting, pagination, and execute query
      const ordersData = await baseQuery
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);
      
      // Get total count
      const countResult = await countQuery;
      const total = countResult[0]?.count || 0;
      
      // Calculate total pages
      const totalPages = Math.ceil(total / limit);
      
      // Return data with pagination info
      return {
        data: ordersData,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
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
          eq(clients.userId, auth.userId)
        ));

      if (clientExists.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Client not found',
        });
      }
      
      // Store additional details in the details JSON field
      const orderDetails = {
        styleId: body.styleId ? parseInt(body.styleId) : null,
        measurementId: body.measurementId ? parseInt(body.measurementId) : null,
        depositAmount: body.depositAmount ? parseFloat(body.depositAmount) : 0,
        balanceAmount: parseFloat(body.totalAmount) - (body.depositAmount ? parseFloat(body.depositAmount) : 0),
        notes: body.notes || null
      };

      // Create new order
      const newOrder = {
        clientId: parseInt(body.clientId),
        dueDate: body.dueDate ? body.dueDate : null,
        totalAmount: parseFloat(body.totalAmount),
        status: body.status || 'Pending',
        description: body.description || null,
        details: orderDetails,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.insert(orders).values(newOrder).returning();
      const insertedOrder = result[0];
      
      // Return the new order with client and style info
      return {
        ...insertedOrder,
        clientName: clientExists[0].name,
        styleName: body.styleId ? (await db.select().from(styles).where(eq(styles.id, body.styleId)))[0]?.name : null,
        styleImageUrl: body.styleId ? (await db.select().from(styles).where(eq(styles.id, body.styleId)))[0]?.imageUrl : null,
        ...orderDetails
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