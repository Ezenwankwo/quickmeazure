import { db } from '~/server/database';
import { clients } from '~/server/database/schema';
import { eq } from 'drizzle-orm';

// Define event handler for client-specific operations
export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  const userId = '1'; // In a real app, this would come from authentication
  const clientId = getRouterParam(event, 'id');

  // Verify client exists and belongs to user
  const clientExists = await db.select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .where(eq(clients.userId, userId));

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
      if (!body.name || !body.phone) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Name and phone are required fields',
        });
      }

      // Update client
      const updatedClient = {
        name: body.name,
        email: body.email || null,
        phone: body.phone,
        address: body.address || null,
        notes: body.notes || null,
        updatedAt: Date.now(),
      };

      await db.update(clients)
        .set(updatedClient)
        .where(eq(clients.id, clientId))
        .where(eq(clients.userId, userId));

      return { ...clientExists[0], ...updatedClient };
    } catch (error) {
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
      await db.delete(clients)
        .where(eq(clients.id, clientId))
        .where(eq(clients.userId, userId));

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