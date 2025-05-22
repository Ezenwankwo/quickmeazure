import { useDrizzle, eq, and } from './drizzle';
import { measurementTemplates, measurementFields } from '../database/schema';

/**
 * Get all measurement templates for a user
 * @param userId The user ID
 * @param includeArchived Whether to include archived templates
 * @returns Array of measurement templates with their fields
 */
export async function getUserTemplates(userId: number, includeArchived: boolean = false) {
  try {
    // Get database connection
    const db = useDrizzle();
    
    // Query to get templates
    const query = and(
      eq(measurementTemplates.userId, userId),
      includeArchived ? undefined : eq(measurementTemplates.isArchived, false)
    );

    // Get templates
    const templates = await db.query.measurementTemplates.findMany({
      where: query,
      with: {
        fields: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    return templates;
  } catch (error) {
    console.error('Error in getUserTemplates:', error);
    throw error;
  }
}