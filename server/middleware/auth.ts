import { defineEventHandler, createError, getRequestHeader, getRequestURL } from 'h3';
import jwt from 'jsonwebtoken';
import { db } from '~/server/database';
import { users } from '~/server/database/schema';
import { eq } from 'drizzle-orm';

type JwtPayload = { userId: string };

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  
  // Skip auth check for public routes
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
  ];
  
  const path = getRequestURL(event).pathname;
  
  // Skip auth check for development test routes
  if (process.env.NODE_ENV === 'development' && path.startsWith('/api/test/')) {
    console.log('Skipping auth check for development test endpoint:', path);
    return;
  }
  
  if (publicRoutes.includes(path) || !path.startsWith('/api/')) {
    return;
  }

  try {
    // Get authorization header
    const authHeader = getRequestHeader(event, 'authorization');
    console.log('Auth header received:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.log('Request path:', path);
      console.log('Request headers:', event.headers);
      throw createError({
        statusCode: 401,
        statusMessage: 'Missing authorization header',
      });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Invalid auth header format:', authHeader.substring(0, 10) + '...');
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid authorization header format',
      });
    }

    // Extract token
    const token = authHeader.substring(7);
    
    let decoded: JwtPayload;
    
    // Verify token
    try {
      decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch (tokenError: any) {
      // Handle JWT verification errors with specific messages
      console.error('JWT verification error:', tokenError.name, tokenError.message);
      
      if (tokenError.name === 'TokenExpiredError') {
        throw createError({
          statusCode: 401,
          statusMessage: 'Token expired',
        });
      } else if (tokenError.name === 'JsonWebTokenError') {
        throw createError({
          statusCode: 401,
          statusMessage: 'Invalid token format',
        });
      }
      
      // Generic JWT error
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid or expired token',
      });
    }
    
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
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    if (error.statusCode) {
      throw error; // Re-throw validation errors
    }
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication failed',
    });
  }
});