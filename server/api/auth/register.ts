import bcrypt from 'bcryptjs'
import { useDrizzle, tables, eq } from '~/server/utils/drizzle'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  try {
    // Get request body
    const { name, email, password, subscriptionPlan = 'free' } = await readBody(event)
    
    // Validate required fields
    if (!name || !email || !password) {
      throw createError({
        statusCode: 400,
        message: 'Name, email, and password are required'
      })
    }

    // Validate name (not empty)
    const trimmedName = name.trim()
    if (!trimmedName) {
      throw createError({
        statusCode: 400,
        message: 'Name cannot be empty'
      })
    }

    // Validate email format more strictly
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid email format'
      })
    }

    // Enhanced password validation
    if (password.length < 8) {
      throw createError({
        statusCode: 400,
        message: 'Password must be at least 8 characters long'
      })
    }

    // Check for password complexity
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(password)

    if (!(hasUppercase && hasLowercase && hasNumber && hasSpecialChar)) {
      throw createError({
        statusCode: 400,
        message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
      })
    }

    // Get database connection
    const db = useDrizzle()
    
    // Check if user with this email already exists
    try {
      const existingUsers = await db
        .select()
        .from(tables.users)
        .where(eq(tables.users.email, email.toLowerCase()))
        .limit(1)
      
      if (existingUsers.length > 0) {
        throw createError({
          statusCode: 409,
          message: 'Email is already registered'
        })
      }
    } catch (dbError: any) {
      // If the error is already a structured error (like the 409 we throw above), rethrow it
      if (dbError.statusCode) {
        throw dbError;
      }
      
      console.error('Database error checking for existing user:', dbError)
      // In development with SKIP_MIGRATIONS=true, we'll mock the registration process
      if (process.env.SKIP_MIGRATIONS === 'true' && process.env.NODE_ENV === 'development') {
        console.log('Running in mock mode due to SKIP_MIGRATIONS=true')
        
        // Create a mock user object
        const mockUser = {
          id: Math.floor(Math.random() * 1000).toString(),
          name: trimmedName,
          email: email.toLowerCase(),
        }
        
        // Set mock user session
        await setUserSession(event, {
          user: {
            ...mockUser,
            subscriptionPlan
          },
          loggedInAt: new Date()
        })
        
        // Generate JWT token
        const config = useRuntimeConfig()
        const token = jwt.sign(
          { 
            ...mockUser,
            subscriptionPlan
          },
          config.jwtSecret,
          { expiresIn: '7d' }
        )
        
        // Return mock response
        return {
          user: {
            ...mockUser,
            subscriptionPlan
          },
          token
        }
      } else {
        // In production or if not skipping migrations, throw the original error
        throw createError({
          statusCode: 500,
          message: 'Database error: ' + (dbError.message || 'Unknown database error')
        })
      }
    }
    
    // Generate a secure salt and hash the password
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)
    
    // Create the new user
    const newUser = {
      name: trimmedName,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date()
    }
    
    // Insert user into database
    let user;
    try {
      const result = await db
        .insert(tables.users)
        .values(newUser)
        .returning({
          id: tables.users.id,
          name: tables.users.name,
          email: tables.users.email,
          createdAt: tables.users.createdAt
        })
      
      user = result[0]
    } catch (dbError: any) {
      console.error('Database error inserting new user:', dbError)
      // In development with SKIP_MIGRATIONS=true, we'll mock the registration process
      if (process.env.SKIP_MIGRATIONS === 'true' && process.env.NODE_ENV === 'development') {
        console.log('Running in mock mode due to SKIP_MIGRATIONS=true')
        
        // Create a mock user object
        user = {
          id: Math.floor(Math.random() * 1000).toString(),
          name: trimmedName,
          email: email.toLowerCase(),
          createdAt: new Date()
        }
      } else {
        // In production or if not skipping migrations, throw the original error
        throw createError({
          statusCode: 500,
          message: 'Database error: ' + (dbError.message || 'Unknown database error')
        })
      }
    }

    // Set user session with nuxt-auth-utils
    await setUserSession(event, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionPlan
      },
      // Add any additional session data here
      loggedInAt: new Date()
    })

    // Generate JWT token for the client
    const config = useRuntimeConfig()
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionPlan
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    )

    // Set the token as cookie for API access
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    // Return user data and token without sensitive fields
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionPlan
      },
      token
    }
  } catch (error: any) {
    console.error('Registration error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Registration failed'
    })
  }
}) 