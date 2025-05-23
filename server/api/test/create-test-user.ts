import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { users } from '~/server/database/schema'
import { db } from '~/server/database'

export default defineEventHandler(async event => {
  // Skip authentication check for this endpoint
  event.context.auth = { skip: true }

  // Only available in development mode
  if (process.env.NODE_ENV !== 'development') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not found',
    })
  }

  // Only allow POST requests
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
    })
  }

  try {
    const body = await readBody(event)

    // Validate required fields
    if (!body.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required',
      })
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email.toLowerCase()))

    if (existingUser.length > 0) {
      return {
        message: 'User already exists',
        userId: existingUser[0].id,
        email: existingUser[0].email,
        name: existingUser[0].name,
      }
    }

    // Hash password (default: 'password123')
    const hashedPassword = await bcrypt.hash(body.password || 'password123', 10)

    // Create user
    const newUser = {
      id: uuidv4(),
      name: body.name || 'Test User',
      email: body.email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      subscriptionPlan: 'free',
      subscriptionExpiry: null,
    }

    // Insert user
    await db.insert(users).values(newUser)

    return {
      message: 'Test user created successfully',
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    }
  } catch (error: any) {
    console.error('Create test user error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create test user',
    })
  }
})
