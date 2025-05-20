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

    // Parse the request body
    const body = await readBody(event);
    
    // Validate required fields
    if (!body.name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Template name is required',
      });
    }

    // Create the template
    const template = await createTemplate(
      user.id,
      {
        name: body.name,
        gender: body.gender || 'unisex',
        isArchived: false,
      },
      body.fields || []
    );

    return {
      success: true,
      data: template,
    };
  } catch (error: any) {
    console.error('Error creating measurement template:', error);
    return {
      success: false,
      message: error.message || 'Failed to create measurement template',
    };
  }
});
