import { defineEventHandler, createError, getRequestHeaders } from 'h3';
import { useDrizzle, tables, eq, and } from '~/server/utils/drizzle';
import jwt from 'jsonwebtoken';

/**
 * Get the current user's active subscription
 */
export default defineEventHandler(async (event) => {
  try {
    // Get user from auth token
    const headers = getRequestHeaders(event);
    const authHeader = headers.authorization || '';
    
    // Check for token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - No valid token provided'
      });
    }
    
    // Extract and verify token
    const token = authHeader.split(' ')[1];
    const config = useRuntimeConfig();
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string | number };
      if (!decoded || !decoded.id) {
        throw new Error('Invalid token payload');
      }
      
      const userId = decoded.id;

      // Get database instance
      const db = useDrizzle();

      // Find the active subscription for the user
      const subscription = await db.query.subscriptions.findFirst({
        where: and(
          eq(tables.subscriptions.userId, Number(userId)),
          eq(tables.subscriptions.status, 'active')
        ),
        with: {
          plan: true,
        }
      });

      if (!subscription) {
        return {
          success: true,
          message: 'No active subscription found',
          data: null
        };
      }

      return {
        success: true,
        data: subscription
      };
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - Invalid token'
      });
    }
  } catch (error: any) {
    console.error('Error retrieving subscription:', error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: 'An error occurred while retrieving subscription'
    });
  }
}); 