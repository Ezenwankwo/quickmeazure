import { H3Event, readMultipartFormData } from 'h3';

/**
 * Extract a file from multipart form data
 * @param event - The H3Event object
 * @returns An object containing the file buffer, filename, and content type
 */
export async function extractFileFromMultipart(event: H3Event) {
  try {
    const formData = await readMultipartFormData(event);
    
    if (!formData || formData.length === 0) {
      return null;
    }
    
    // Find the file part (typically has a filename)
    const filePart = formData.find(part => part.filename);
    
    if (!filePart || !filePart.filename) {
      return null;
    }
    
    return {
      buffer: filePart.data,
      filename: filePart.filename,
      contentType: filePart.type || 'application/octet-stream'
    };
  } catch (error) {
    console.error('Error extracting file from multipart form data:', error);
    return null;
  }
}

/**
 * Extract field values from multipart form data
 * @param event - The H3Event object
 * @returns An object containing the field names and values
 */
export async function extractFieldsFromMultipart(event: H3Event) {
  try {
    const formData = await readMultipartFormData(event);
    
    if (!formData || formData.length === 0) {
      return {};
    }
    
    const fields: Record<string, string> = {};
    
    // Process each part
    for (const part of formData) {
      // Skip file parts
      if (part.filename) continue;
      
      // If it has a name, treat it as a field
      if (part.name) {
        fields[part.name] = part.data.toString();
      }
    }
    
    return fields;
  } catch (error) {
    console.error('Error extracting fields from multipart form data:', error);
    return {};
  }
} 