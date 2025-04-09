import { db } from '~/server/database';
import { styles } from '~/server/database/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

// Define event handler for styles API
export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  const userId = '1'; // In a real app, this would come from authentication

  // Handle GET request to fetch all styles
  if (method === 'GET') {
    try {
      const allStyles = await db.select().from(styles).where(eq(styles.userId, userId));
      return allStyles;
    } catch (error) {
      console.error('Error fetching styles:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch styles',
      });
    }
  }

  // Handle POST request to create a new style
  if (method === 'POST') {
    try {
      const body = await readBody(event);
      
      // Validate required fields
      if (!body.name) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Style name is required',
        });
      }

      // Check if user's subscription plan allows style catalog
      // For demo purposes, we'll assume all plans allow styles
      // In a real app, this would check the user's subscription plan

      // Create new style
      const newStyle = {
        id: uuidv4(),
        userId,
        name: body.name,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.insert(styles).values(newStyle);
      return newStyle;
    } catch (error) {
      console.error('Error creating style:', error);
      if (error.statusCode) {
        throw error; // Re-throw validation errors
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create style',
      });
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
});