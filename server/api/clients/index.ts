import { db } from '~/server/database';
import { clients, users, orders, measurements } from '~/server/database/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, count, exists, desc, asc, sql, and } from 'drizzle-orm';

// Define event handler for GET requests
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

  // Handle GET request to fetch all clients
  if (method === 'GET') {
    try {
      // Get query parameters
      const query = getQuery(event);
      const page = parseInt(query.page as string || '1');
      const limit = parseInt(query.limit as string || '10');
      const sortField = (query.sortField as string) || 'name';
      const sortOrder = (query.sortOrder as string) || 'asc';
      const search = query.search as string | undefined;
      const hasMeasurementsFilter = query.hasMeasurements !== undefined 
        ? query.hasMeasurements === 'true' 
        : undefined;
      const hasOrdersFilter = query.hasOrders !== undefined 
        ? query.hasOrders === 'true' 
        : undefined;
      
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
      
      // Always filter by user ID
      whereConditions.push(eq(clients.userId, auth.userId));
      
      // Add search condition if provided
      if (search && search.trim() !== '') {
        whereConditions.push(
          sql`(lower(${clients.name}) like ${`%${search.toLowerCase()}%`} OR 
              lower(${clients.email}) like ${`%${search.toLowerCase()}%`} OR 
              ${clients.phone} like ${`%${search}%`})`
        );
      }
      
      // Add measurements filter if provided
      if (hasMeasurementsFilter !== undefined) {
        if (hasMeasurementsFilter) {
          whereConditions.push(
            exists(
              db.select().from(measurements).where(eq(measurements.clientId, clients.id))
            )
          );
        } else {
          whereConditions.push(
            sql`NOT ${exists(
              db.select().from(measurements).where(eq(measurements.clientId, clients.id))
            )}`
          );
        }
      }
      
      // Add orders filter if provided
      if (hasOrdersFilter !== undefined) {
        if (hasOrdersFilter) {
          whereConditions.push(
            exists(
              db.select().from(orders).where(eq(orders.clientId, clients.id))
            )
          );
        } else {
          whereConditions.push(
            sql`NOT ${exists(
              db.select().from(orders).where(eq(orders.clientId, clients.id))
            )}`
          );
        }
      }
      
      // Build base query with all conditions
      const baseQuery = db.select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        phone: clients.phone,
        address: clients.address,
        notes: clients.notes,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
        // Check if client has measurements
        hasMeasurements: exists(
          db.select().from(measurements).where(eq(measurements.clientId, clients.id))
        ),
        // Check if client has orders
        hasOrders: exists(
          db.select().from(orders).where(eq(orders.clientId, clients.id))
        ),
      })
      .from(clients)
      .where(and(...whereConditions));
      
      // Build count query with same conditions
      const countQuery = db.select({
        count: count()
      })
      .from(clients)
      .where(and(...whereConditions));
      
      // Determine sort direction
      const sortDirection = sortOrder === 'asc' ? asc : desc;
      
      // Apply sorting
      let orderByClause;
      switch (sortField) {
        case 'name':
          orderByClause = sortDirection(clients.name);
          break;
        case 'email':
          orderByClause = sortDirection(clients.email);
          break;
        case 'createdAt':
          orderByClause = sortDirection(clients.createdAt);
          break;
        case 'updatedAt':
          orderByClause = sortDirection(clients.updatedAt);
          break;
        default:
          orderByClause = sortDirection(clients.name);
          break;
      }
      
      // Apply sorting, pagination, and execute query
      const clientsData = await baseQuery
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
        data: clientsData,
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
      console.error('Error fetching clients:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch clients',
      });
    }
  }

  // Handle POST request to create a new client
  if (method === 'POST') {
    try {
      const body = await readBody(event);
      
      // Validate required fields
      if (!body.name) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Name is required',
        });
      }

      // Get user subscription plan
      const userData = await db.select().from(users).where(eq(users.id, auth.userId));
      if (!userData.length) {
        throw createError({
          statusCode: 404,
          statusMessage: 'User not found',
        });
      }
      
      const userSubscription = userData[0].subscriptionPlan;

      // Check client limit based on subscription plan
      const clientCount = await db.select({ count: count() }).from(clients).where(eq(clients.userId, auth.userId));
      const currentCount = clientCount[0]?.count || 0;
      
      // Set client limit based on subscription plan
      let clientLimit = 100; // Default for free plan
      if (userSubscription === 'standard') {
        clientLimit = 500;
      } else if (userSubscription === 'premium') {
        clientLimit = Infinity; // Unlimited
      }
      
      if (clientLimit !== Infinity && currentCount >= clientLimit) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Client limit reached for your subscription plan. Please upgrade to add more clients.',
        });
      }

      // Create new client
      const newClient = {
        id: uuidv4(),
        userId: auth.userId,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        notes: body.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(clients).values(newClient);
      return newClient;
    } catch (error: any) {
      console.error('Error creating client:', error);
      if (error.statusCode) {
        throw error; // Re-throw validation errors
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create client',
      });
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
});