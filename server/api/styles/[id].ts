import { db } from '~/server/database';
import { styles } from '~/server/database/schema';
import { eq } from 'drizzle-orm';

// Define event handler for style-specific operations
export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  const userId = '1'; // In a real app, this would come from authentication
  const styleId = getRouterParam(event, 'id');

  // Verify style exists and belongs to user
  const styleExists = await db.select()
    .from(styles)
    .where(eq(styles.id, styleId))
    .where(eq(styles.userId, userId));

  if (styleExists.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Style not found',
    });
  }

  // Handle GET request to fetch a specific style
  if (method === 'GET') {
    try {
      return styleExists[0];
    } catch (error) {
      console.error('Error fetching style:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch style',
      });
    }
  }

  // Handle PUT request to update a style
  if (method === 'PUT') {
    try {
      const body = await readBody(event);
      
      // Validate required fields
      if (!body.name) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Style name is required',
        });
      }

      // Update style
      const updatedStyle = {
        name: body.name,
        description: body.description || null,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : styleExists[0].imageUrl,
        updatedAt: Date.now(),
      };

      await db.update(styles)
        .set(updatedStyle)
        .where(eq(styles.id, styleId))
        .where(eq(styles.userId, userId));

      return { ...styleExists[0], ...updatedStyle };
    } catch (error) {
      console.error('Error updating style:', error);
      if (error.statusCode) {
        throw error; // Re-throw validation errors
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update style',
      });
    }
  }

  // Handle DELETE request to delete a style
  if (method === 'DELETE') {
    try {
      await db.delete(styles)
        .where(eq(styles.id, styleId))
        .where(eq(styles.userId, userId));

      return { success: true, message: 'Style deleted successfully' };
    } catch (error) {
      console.error('Error deleting style:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete style',
      });
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
});