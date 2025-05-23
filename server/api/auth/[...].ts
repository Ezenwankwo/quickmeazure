import bcrypt from 'bcryptjs'
import { useDrizzle, tables, eq } from '~/server/utils/drizzle'

// Create a route that will handle user login with credentials
export default defineEventHandler(async event => {
  // Get the HTTP method
  const method = getMethod(event)

  // Handle POST requests (login)
  if (method === 'POST') {
    try {
      // Get request body
      const { email, password } = await readBody(event)

      // Validate required fields
      if (!email || !password) {
        throw createError({
          statusCode: 400,
          message: 'Email and password are required',
        })
      }

      // Get database connection
      const db = useDrizzle()

      // Find user by email
      const users = await db
        .select()
        .from(tables.users)
        .where(eq(tables.users.email, email))
        .limit(1)

      // Check if user exists
      const user = users[0]
      if (!user) {
        throw createError({
          statusCode: 401,
          message: 'Invalid credentials',
        })
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        throw createError({
          statusCode: 401,
          message: 'Invalid credentials',
        })
      }

      // Set user session with nuxt-auth-utils
      await setUserSession(event, {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
        // Add any additional session data here
        loggedInAt: new Date(),
      })

      // Return user data without sensitive fields
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      throw createError({
        statusCode: error.statusCode || 500,
        message: error.message || 'Authentication failed',
      })
    }
  }

  // Handle GET requests (get current session)
  else if (method === 'GET') {
    // Get the current user session
    const session = await getUserSession(event)

    // Return the user data if they are logged in
    if (session?.user) {
      return { user: session.user }
    }

    // Return null if no active session
    return { user: null }
  }

  // Handle DELETE requests (logout)
  else if (method === 'DELETE') {
    // Clear the user session
    await clearUserSession(event)
    return { success: true }
  }

  // Handle other methods
  else {
    throw createError({
      statusCode: 405,
      message: 'Method not allowed',
    })
  }
})
