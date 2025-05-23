import { clearUserSession } from '#imports'

export default defineEventHandler(async event => {
  try {
    // Clear the nuxt-auth-utils session
    await clearUserSession(event)

    // Clear the auth_token cookie
    deleteCookie(event, 'auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
    })

    return {
      success: true,
      message: 'Logged out successfully',
    }
  } catch (error) {
    console.error('Logout error:', error)

    return {
      success: false,
      message: 'Error during logout',
    }
  }
})
