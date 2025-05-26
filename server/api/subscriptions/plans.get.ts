import { defineEventHandler, createError, getRequestHeaders } from 'h3'
import jwt from 'jsonwebtoken'
import { useDrizzle, tables, eq } from '~/server/utils/drizzle'

/**
 * Get available subscription plans from the database
 */
export default defineEventHandler(async event => {
  try {
    // Get user from auth token
    const headers = getRequestHeaders(event)
    const authHeader = headers.authorization || ''

    // Check for token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - Authentication required',
      })
    }

    // Extract and verify token
    const token = authHeader.split(' ')[1]
    const config = useRuntimeConfig()

    console.log('Verifying token for plans endpoint')

    try {
      // Make sure we have a valid JWT secret
      if (!config.jwtSecret) {
        console.error('JWT_SECRET is not configured properly')
        throw createError({
          statusCode: 500,
          message: 'Server configuration error',
        })
      }

      const decoded = jwt.verify(token, config.jwtSecret) as { id: string | number }
      console.log('Token verified, user ID:', decoded?.id)

      if (!decoded || !decoded.id) {
        console.error('Invalid token payload, missing ID')
        throw new Error('Invalid token payload')
      }
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError)
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - Invalid token',
      })
    }

    console.log('Fetching subscription plans from database')

    // Get database instance
    const db = useDrizzle()

    // Query active plans from the database
    const dbPlans = await db
      .select()
      .from(tables.plans)
      .where(eq(tables.plans.isActive, true))
      .execute()

    console.log(`Found ${dbPlans.length} active plans in database`)

    // Transform database plans to match the expected format
    const plans = dbPlans.map(plan => {
      // Parse features from JSON if it exists
      let features = []
      try {
        if (plan.features) {
          features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
        }
      } catch (e) {
        console.error('Error parsing plan features:', e)
        features = []
      }

      // Create a standardized plan object
      return {
        id: String(plan.id),
        name: plan.name,
        description: plan.description,
        price: Number(plan.price),
        interval: plan.interval === 'annual' ? 'year' : plan.interval, // Normalize interval naming
        features: features,
        limits: {
          clients: plan.maxClients || 0,
          templates: plan.maxStyles || 0,
          users: 1, // Default to 1 user
          storage: plan.maxStorage || 0,
        },
        isFeatured: plan.isFeatured || false,
      }
    })

    // Sort plans by price
    plans.sort((a, b) => a.price - b.price)

    console.log(
      'Returning plans:',
      plans.map(p => `${p.name} (${p.id}): ${p.price}`)
    )
    return plans
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch subscription plans',
    })
  }
})
