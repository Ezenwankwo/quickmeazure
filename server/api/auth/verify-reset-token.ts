import jwt from 'jsonwebtoken'

// Define the token payload type
interface TokenPayload {
  userId: number
  iat?: number
  exp?: number
}

export default defineEventHandler(async event => {
  try {
    // Get request body
    const { token } = await readBody(event)

    // Validate token
    if (!token) {
      return {
        valid: false,
        message: 'Token is required',
      }
    }

    // Verify token
    const config = useRuntimeConfig()

    try {
      // Verify the token
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload

      // Check if token contains necessary data
      if (!decoded || !decoded.userId) {
        return {
          valid: false,
          message: 'Invalid token',
        }
      }

      return {
        valid: true,
      }
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError)

      return {
        valid: false,
        message: 'Token is invalid or has expired',
      }
    }
  } catch (error: any) {
    console.error('Verify reset token error:', error)

    return {
      valid: false,
      message: 'An error occurred while verifying token',
    }
  }
})
