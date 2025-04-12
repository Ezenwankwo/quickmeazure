import { db } from '~/server/database';
import { users } from '~/server/database/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '~/utils/email';

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
      console.log(`No user found with email: ${body.email}`);
      // Return success even if no user found (to prevent email enumeration)
      return {
        success: true,
      };
    }

    const user = userResults[0];
    console.log(`User found: ${user.id} (${user.email})`);

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Store token (in a real app, you'd store this in a database table)
    passwordResetTokens.set(resetToken, {
      userId: user.id,
      expiry: tokenExpiry
    });

    // Create the reset URL
    const config = useRuntimeConfig();
    const resetUrl = `${config.public.appUrl}/auth/reset-password/${resetToken}`;
    
    console.log(`Generated reset URL: ${resetUrl}`);
    console.log(`Brevo API key available: ${!!config.brevoApiKey}`);
    
    // Send the password reset email
    try {
      const emailResult = await sendPasswordResetEmail(user.email, resetUrl);
      
      // Check if email was sent successfully
      if (!emailResult || !emailResult.success) {
        console.error('Failed to send password reset email:', emailResult?.error || 'Unknown error');
        // Don't expose the error to the client but log it for troubleshooting
      } else {
        console.log(`Password reset email sent to ${user.email} with messageId: ${emailResult.messageId}`);
      }
    } catch (emailError) {
      console.error('Exception when sending password reset email:', emailError);
      // Don't fail the request if email sending fails
    }

    // Return success response with reset URL in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Including reset URL in response (development mode only)');
      return {
        success: true,
        resetUrl: resetUrl
      };
    } else {
      return { success: true };
    }
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