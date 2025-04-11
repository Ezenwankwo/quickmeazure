import { db } from '~/server/database';
import { clients } from '~/server/database/schema';
import { eq, and } from 'drizzle-orm';

// Define event handler for client-specific operations
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
  
  const clientId = getRouterParam(event, 'id');
  if (!clientId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Client ID is required',
    });
  }

  // Verify client exists and belongs to user
  const clientExists = await db.select()
    .from(clients)
    .where(and(
      eq(clients.id, clientId),
      eq(clients.userId, auth.userId)
    ));

  if (clientExists.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Client not found',
    });
  }

  // Handle GET request to fetch a specific client
  if (method === 'GET') {
    try {
      return clientExists[0];
    } catch (error) {
      console.error('Error fetching client:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch client',
      });
    }
  }

  // Handle PUT request to update a client
  if (method === 'PUT') {
    try {
      const body = await readBody(event);
      
      // Validate required fields
      if (!body.name) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Name is required',
        });
      }

      // Update client
      const updatedClient = {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        notes: body.notes || null,
        updatedAt: new Date(),
      };

      await db.update(clients)
        .set(updatedClient)
        .where(and(
          eq(clients.id, clientId),
          eq(clients.userId, auth.userId)
        ));

      return { ...clientExists[0], ...updatedClient };
    } catch (error: any) {
      console.error('Error updating client:', error);
      if (error.statusCode) {
        throw error; // Re-throw validation errors
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update client',
      });
    }
  }

  // Handle DELETE request to delete a client
  if (method === 'DELETE') {
    try {
      const result = await db.delete(clients)
        .where(and(
          eq(clients.id, clientId),
          eq(clients.userId, auth.userId)
        ));

      return { success: true, message: 'Client deleted successfully' };
    } catch (error) {
      console.error('Error deleting client:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete client',
      });
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
});