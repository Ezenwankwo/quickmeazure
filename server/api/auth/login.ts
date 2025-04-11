import { db } from '~/server/database';
import { users } from '~/server/database/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Define event handler for login
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  
  // Only allow POST requests
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
    });
  }

  try {
    const body = await readBody(event);
    
    // Validate required fields
    if (!body.email || !body.password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required',
      });
    }

    // Find user by email
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email.toLowerCase()));

    if (userResults.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email or password',
      });
    }

    const user = userResults[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Return user data and token (excluding password)
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiry: user.subscriptionExpiry,
      },
      token,
    };
  } catch (error: any) {
    console.error('Login error:', error);
    if (error.statusCode) {
      throw error; // Re-throw validation errors
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred during login',
    });
  }
});