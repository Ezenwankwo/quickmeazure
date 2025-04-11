import { createError, getMethod } from 'h3';
import { and, eq } from 'drizzle-orm';
import { db } from '~/server/database';
import { styles } from '~/server/database/schema';
import { extractFileFromMultipart, extractFieldsFromMultipart } from '~/server/utils/multipart';
import { uploadFileToS3, getFileExtension, getContentType } from '~/server/utils/s3';

// Define event handler for style-specific operations
export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  
  // Get style ID from route params
  const styleId = event.context.params?.id;
  if (!styleId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Style ID is required',
    });
  }
  
  // Get user ID from auth context
  const auth = event.context.auth;
  const userId = auth?.userId;

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }
  
  // Check if style exists and belongs to the user
  const styleExists = await db
    .select()
    .from(styles)
    .where(and(
      eq(styles.id, styleId),
      eq(styles.userId, userId)
    ));
  
  if (!styleExists || styleExists.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Style not found',
    });
  }
  
  // Handle GET request to get a style
  if (method === 'GET') {
    try {
      return { style: styleExists[0] };
    } catch (error) {
      console.error('Error fetching style:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch style',
      });
    }
  }
  
  // Handle PUT request to update a style
  if (method === 'PUT') {
    try {
      // Check if content type is multipart/form-data
      const contentType = event.node.req.headers['content-type'] || '';
      const isMultipart = contentType.includes('multipart/form-data');
      
      let styleName = '';
      let styleDescription = null;
      let imageUrl = styleExists[0].imageUrl; // Keep existing image URL by default
      
      if (isMultipart) {
        // Parse multipart form data
        const fields = await extractFieldsFromMultipart(event);
        const file = await extractFileFromMultipart(event);
        
        styleName = fields.name || '';
        styleDescription = fields.description || null;
        
        // Handle file upload to S3 if a file was provided
        if (file) {
          const fileExt = getFileExtension(file.filename);
          const contentType = getContentType(fileExt);
          
          // Upload to S3
          imageUrl = await uploadFileToS3(
            file.buffer,
            file.filename,
            contentType
          );
        }
      } else {
        // Regular JSON body
        const body = await readBody(event);
        styleName = body.name;
        styleDescription = body.description || null;
        
        // If there's a base64 image, handle it
        if (body.imageBase64) {
          // Decode base64
          const matches = body.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          
          if (matches && matches.length === 3) {
            const contentType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const fileExt = contentType.split('/')[1] || 'jpg';
            
            // Upload to S3
            imageUrl = await uploadFileToS3(
              buffer,
              `image.${fileExt}`,
              contentType
            );
          }
        } else if (body.imageUrl !== undefined) {
          // If imageUrl is explicitly set, use it (including null to remove image)
          imageUrl = body.imageUrl;
        }
      }
      
      // Validate required fields
      if (!styleName) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Style name is required',
        });
      }

      // Update style
      const updatedStyle = {
        name: styleName,
        description: styleDescription,
        imageUrl: imageUrl,
        updatedAt: new Date(),
      };

      await db
        .update(styles)
        .set(updatedStyle)
        .where(and(
          eq(styles.id, styleId),
          eq(styles.userId, userId)
        ));

      return { ...styleExists[0], ...updatedStyle };
    } catch (error: any) {
      console.error('Error updating style:', error);
      if (error.statusCode) {
        throw error; // Re-throw validation errors
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update style',
      });
    }
  }

  // Handle DELETE request to delete a style
  if (method === 'DELETE') {
    try {
      await db
        .delete(styles)
        .where(and(
          eq(styles.id, styleId),
          eq(styles.userId, userId)
        ));

      return { success: true, message: 'Style deleted successfully' };
    } catch (error) {
      console.error('Error deleting style:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete style',
      });
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
});