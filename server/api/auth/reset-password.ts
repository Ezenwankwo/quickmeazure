import { db } from '~/server/database';
import { users } from '~/server/database/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Import the password reset tokens map 
// In a real application, you would retrieve this from a database
import { passwordResetTokens } from './forgot-password';

export default defineEventHandler(async (event) => {
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
    if (!body.token || !body.password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Token and password are required',
      });
    }

    // Verify the token
    const tokenData = passwordResetTokens.get(body.token);
    
    if (!tokenData) {
      throw createError({
        statusCode: 400,
        message: 'Invalid or expired token',
      });
    }

    // Check if token is expired
    if (tokenData.expiry < Date.now()) {
      // Remove expired token
      passwordResetTokens.delete(body.token);
      
      throw createError({
        statusCode: 400,
        message: 'Token has expired',
      });
    }

    // Get the user
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenData.userId));

    if (userResults.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      });
    }

    const user = userResults[0];

    // Hash the new password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Update the user's password
    await db.update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    // Delete the token after it's been used
    passwordResetTokens.delete(body.token);

    // Return success
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Reset password error:', error);
    if (error.statusCode) {
      throw error; // Re-throw validation errors
    }
    throw createError({
      statusCode: 500,
      message: 'An error occurred processing your request',
    });
  }
}); 