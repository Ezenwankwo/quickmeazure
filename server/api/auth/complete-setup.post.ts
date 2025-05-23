import { useDrizzle, tables, eq } from '~/server/utils/drizzle'

export default defineEventHandler(async event => {
  try {
    // Get the current user
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Not authenticated',
      })
    }

    // Get database connection
    const db = useDrizzle()

    // Update the user to mark setup as complete
    await db
      .update(tables.users)
      .set({
        hasCompletedSetup: true,
        updatedAt: new Date(),
      })
      .where(eq(tables.users.id, user.id))

    // Update the session
    await setUserSession(event, {
      user: {
        ...event.context.user,
        hasCompletedSetup: true,
      },
      loggedInAt: new Date(),
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error completing setup:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to complete setup',
    })
  }
})
