import { H3Event } from 'h3';

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get the authenticated user
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    // Get query parameters
    const query = getQuery(event);
    const includeArchived = query.includeArchived === 'true';

    // Get user's templates
    const templates = await getUserTemplates(user.id, includeArchived);

    return {
      success: true,
      data: templates,
    };
  } catch (error: any) {
    console.error('Error fetching measurement templates:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch measurement templates',
    };
  }
});
