import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get the authenticated user
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    // Get the template ID from the route
    const templateId = parseInt(event.context.params?.id, 10)
    if (isNaN(templateId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid template ID',
      })
    }

    // Delete the template
    await deleteTemplate(templateId, user.id)

    return {
      success: true,
      message: 'Template deleted successfully',
    }
  } catch (error: any) {
    console.error('Error deleting measurement template:', error)
    return {
      success: false,
      message: error.message || 'Failed to delete measurement template',
    }
  }
})
