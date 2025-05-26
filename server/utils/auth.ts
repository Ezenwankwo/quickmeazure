/**
 * Authentication utility functions for server-side operations
 */
import jwt from 'jsonwebtoken'

// Define the token payload type
export interface TokenPayload {
  id: string | number // Using id instead of userId to match the middleware
  email?: string
  name?: string
  subscriptionPlan?: string
  subscriptionExpiry?: number | null
  iat?: number
  exp?: number
}

/**
 * Verify a JWT token and return the decoded payload
 * @param token JWT token to verify
 * @param requireSubscription Whether to verify if the user has an active subscription
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = async (
  token: string,
  requireSubscription: boolean = false
): Promise<TokenPayload | null> => {
  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload

    // If subscription verification is required, check if the token contains subscription data
    if (requireSubscription) {
      if (!decoded.subscriptionPlan) {
        console.error('No subscription plan found in token')
        throw new Error('No active subscription found')
      }

      // Check if subscription has expired
      if (decoded.subscriptionExpiry && decoded.subscriptionExpiry < Date.now() / 1000) {
        console.error('Subscription has expired')
        throw new Error('Subscription has expired')
      }
    }

    // Return the decoded token payload
    return decoded
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

/**
 * Generate a JWT token for a user
 * @param payload Data to include in the token
 * @param expiresIn Token expiration time (default: '7d')
 * @returns Generated JWT token
 */
export const generateToken = (payload: TokenPayload, expiresIn: string = '7d'): string => {
  const config = useRuntimeConfig()
  return jwt.sign(payload, config.jwtSecret, { expiresIn })
}
