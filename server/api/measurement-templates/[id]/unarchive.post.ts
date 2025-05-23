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

    // Unarchive the template
    const template = await unarchiveTemplate(templateId, user.id)

    return {
      success: true,
      data: template,
    }
  } catch (error: any) {
    console.error('Error unarchiving measurement template:', error)
    return {
      success: false,
      message: error.message || 'Failed to unarchive measurement template',
    }
  }
})
