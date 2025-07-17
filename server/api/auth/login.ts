import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { useDrizzle, tables, eq, desc } from '~/server/utils/drizzle'
import { handleApiError } from '~/utils/error-handling'

export default defineEventHandler(async event => {
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
      .where(eq(tables.users.email, email.toLowerCase()))
      .limit(1)

    // Check if user exists
    const user = users[0]
    if (!user) {
      throw createError({
        statusCode: 400,
        message: 'Invalid credentials',
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw createError({
        statusCode: 400,
        message: 'Invalid credentials',
      })
    }

    // Get user's subscription info, if any
    const subscriptions = await db
      .select()
      .from(tables.subscriptions)
      .where(eq(tables.subscriptions.userId, user.id))
      .orderBy(desc(tables.subscriptions.createdAt))
      .limit(1)

    // Determine subscription plan
    let subscriptionPlan = 'free'
    let subscriptionExpiry = null

    if (subscriptions.length > 0) {
      const subscription = subscriptions[0]
      if (subscription.status === 'active') {
        // Get plan details
        const plans = await db
          .select()
          .from(tables.plans)
          .where(eq(tables.plans.id, subscription.planId))
          .limit(1)

        if (plans.length > 0) {
          subscriptionPlan = plans[0].name.toLowerCase()
        }

        // Set expiry if available
        if (subscription.endDate) {
          subscriptionExpiry = new Date(subscription.endDate).getTime()
        }
      }
    }

    // Generate JWT token with 90-day expiry for WhatsApp-like persistence
    const config = useRuntimeConfig()
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionPlan,
        subscriptionExpiry,
      },
      config.jwtSecret,
      {
        expiresIn: '90d',
      }
    )

    // Set user session with nuxt-auth-utils with full user data
    await setUserSession(event, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        businessName: user.businessName,
        phone: user.phone,
        location: user.location,
        bio: user.bio,
        specializations: user.specializations,
        services: user.services,
        hasCompletedSetup: user.hasCompletedSetup,
        subscriptionPlan,
        subscriptionExpiry,
      },
    })

    // Set the token as cookie for API access with 90-day expiry
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 90, // 90 days
      path: '/',
    })

    // Return full user data and token similar to profile endpoint
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        businessName: user.businessName,
        phone: user.phone,
        location: user.location,
        bio: user.bio,
        specializations: user.specializations,
        services: user.services,
        hasCompletedSetup: user.hasCompletedSetup,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        subscription: {
          plan: subscriptionPlan,
          status:
            subscriptions.length > 0 && subscriptions[0].status === 'active'
              ? 'active'
              : 'inactive',
          expiryDate: subscriptionExpiry ? new Date(subscriptionExpiry) : null,
        },
      },
      token,
    }
  } catch (error: unknown) {
    handleApiError(error, 'user login')
  }
})
