import { db } from '~/server/database';
import { clients } from '~/server/database/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

// Define event handler for GET requests
export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  const userId = '1'; // In a real app, this would come from authentication

  // Handle GET request to fetch all clients
  if (method === 'GET') {
    try {
      const allClients = await db.select().from(clients).where(eq(clients.userId, userId));
      return allClients;
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
      if (!body.name || !body.phone) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Name and phone are required fields',
        });
      }

      // Check client limit based on subscription plan
      const clientCount = await db.select({ count: count() }).from(clients).where(eq(clients.userId, userId));
      const currentCount = clientCount[0]?.count || 0;
      
      // For demo purposes, we'll use a hardcoded limit of 100 for free plan
      // In a real app, this would be fetched from the user's subscription
      const clientLimit = 100;
      
      if (clientLimit && currentCount >= clientLimit) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Client limit reached for your subscription plan. Please upgrade to add more clients.',
        });
      }

      // Create new client
      const newClient = {
        id: uuidv4(),
        userId,
        name: body.name,
        email: body.email || null,
        phone: body.phone,
        address: body.address || null,
        notes: body.notes || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.insert(clients).values(newClient);
      return newClient;
    } catch (error) {
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