import { db } from '~/server/database';
import { users } from '~/server/database/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Define a map to store reset tokens (in a real app, you would use a database table)
export const passwordResetTokens = new Map();

export default defineEventHandler(async (event) => {
  // Only allow POST requests
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
    });
  }

  // Skip authentication check - this is a public endpoint that doesn't require auth

  try {
    const body = await readBody(event);
    
    // Validate required fields
    if (!body.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required',
      });
    }

    // Find user by email
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email.toLowerCase()));

    // Don't reveal if a user exists for security reasons
    if (userResults.length === 0) {
      // Return success even if no user found (to prevent email enumeration)
      return {
        success: true,
      };
    }

    const user = userResults[0];

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Store token (in a real app, you'd store this in a database table)
    passwordResetTokens.set(resetToken, {
      userId: user.id,
      expiry: tokenExpiry
    });

    // In a real application, you would send an email with the reset link
    const resetUrl = `${process.env.APP_URL}/auth/reset-password/${resetToken}`;
    console.log(`Password reset link: ${resetUrl}`);

    // Return success
    return {
      success: true,
      // Include the reset URL in the response for development/testing
      // In production, you would NOT include this in the response
      resetUrl: `${useRuntimeConfig().public.appUrl || 'http://localhost:3000'}/auth/reset-password/${resetToken}`
    };
  } catch (error: any) {
    console.error('Forgot password error:', error);
    if (error.statusCode) {
      throw error; // Re-throw validation errors
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred processing your request',
    });
  }
}); 