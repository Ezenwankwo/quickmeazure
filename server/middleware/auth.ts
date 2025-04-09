import { db } from '~/server/database';
import { users } from '~/server/database/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
  // Skip auth check for public routes
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
  ];
  
  const path = getRequestURL(event).pathname;
  if (publicRoutes.includes(path) || !path.startsWith('/api/')) {
    return;
  }

  try {
    // Get authorization header
    const authHeader = getRequestHeader(event, 'authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    // Extract token
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
    
    // Get user from database
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId));

    if (userResults.length === 0) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User not found',
      });
    }

    // Set user in event context
    event.context.auth = {
      userId: userResults[0].id,
      user: userResults[0],
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }
});