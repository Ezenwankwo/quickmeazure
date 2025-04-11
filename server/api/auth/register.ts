import { db } from '~/server/database';
import { users } from '~/server/database/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Define event handler for registration
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
    if (!body.name || !body.email || !body.password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name, email, and password are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format',
      });
    }

    // Validate password strength
    if (body.password.length < 8) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 8 characters long',
      });
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email.toLowerCase()));

    if (existingUser.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email already in use',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Validate and set subscription plan
    const validPlans = ['free', 'standard', 'premium'];
    const subscriptionPlan = validPlans.includes(body.subscriptionPlan) 
      ? body.subscriptionPlan 
      : 'free';
    
    // Calculate subscription expiry for paid plans
    let subscriptionExpiry = null;
    if (subscriptionPlan !== 'free') {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month from now
      subscriptionExpiry = expiryDate.getTime();
    }

    // Create new user
    const newUser = {
      id: uuidv4(),
      name: body.name,
      email: body.email.toLowerCase(),
      password: hashedPassword,
      subscriptionPlan,
      subscriptionExpiry: subscriptionExpiry ? new Date(subscriptionExpiry) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(users).values(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    // Return user data and token (excluding password)
    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        subscriptionPlan: newUser.subscriptionPlan,
        subscriptionExpiry: newUser.subscriptionExpiry,
      },
      token,
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.statusCode) {
      throw error; // Re-throw validation errors
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred during registration',
    });
  }
});