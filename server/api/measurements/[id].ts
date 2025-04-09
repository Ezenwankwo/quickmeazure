import { db } from '~/server/database';
import { measurements, clients } from '~/server/database/schema';
import { eq, and } from 'drizzle-orm';

// Define event handler for measurement-specific operations
export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  const userId = '1'; // In a real app, this would come from authentication
  const measurementId = getRouterParam(event, 'id');

  // Verify measurement exists and belongs to user's client
  const measurementData = await db
    .select({
      measurement: measurements,
      clientUserId: clients.userId
    })
    .from(measurements)
    .innerJoin(clients, eq(measurements.clientId, clients.id))
    .where(and(
      eq(measurements.id, measurementId),
      eq(clients.userId, userId)
    ));

  if (measurementData.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Measurement not found',
    });
  }

  const existingMeasurement = measurementData[0].measurement;

  // Handle GET request to fetch a specific measurement
  if (method === 'GET') {
    try {
      return existingMeasurement;
    } catch (error) {
      console.error('Error fetching measurement:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch measurement',
      });
    }
  }

  // Handle PUT request to update a measurement
  if (method === 'PUT') {
    try {
      const body = await readBody(event);
      
      // Validate client ID if provided
      if (body.clientId) {
        // Verify client exists and belongs to user
        const clientExists = await db.select()
          .from(clients)
          .where(and(
            eq(clients.id, body.clientId),
            eq(clients.userId, userId)
          ));

        if (clientExists.length === 0) {
          throw createError({
            statusCode: 404,
            statusMessage: 'Client not found',
          });
        }
      }

      // Update measurement
      const updatedMeasurement = {
        clientId: body.clientId || existingMeasurement.clientId,
        bust: body.bust !== undefined ? body.bust : existingMeasurement.bust,
        waist: body.waist !== undefined ? body.waist : existingMeasurement.waist,
        hip: body.hip !== undefined ? body.hip : existingMeasurement.hip,
        shoulder: body.shoulder !== undefined ? body.shoulder : existingMeasurement.shoulder,
        sleeve: body.sleeve !== undefined ? body.sleeve : existingMeasurement.sleeve,
        inseam: body.inseam !== undefined ? body.inseam : existingMeasurement.inseam,
        neck: body.neck !== undefined ? body.neck : existingMeasurement.neck,
        chest: body.chest !== undefined ? body.chest : existingMeasurement.chest,
        back: body.back !== undefined ? body.back : existingMeasurement.back,
        thigh: body.thigh !== undefined ? body.thigh : existingMeasurement.thigh,
        calf: body.calf !== undefined ? body.calf : existingMeasurement.calf,
        ankle: body.ankle !== undefined ? body.ankle : existingMeasurement.ankle,
        wrist: body.wrist !== undefined ? body.wrist : existingMeasurement.wrist,
        armhole: body.armhole !== undefined ? body.armhole : existingMeasurement.armhole,
        customMeasurements: body.customMeasurements ? JSON.stringify(body.customMeasurements) : existingMeasurement.customMeasurements,
        updatedAt: Date.now(),
      };

      await db.update(measurements)
        .set(updatedMeasurement)
        .where(eq(measurements.id, measurementId));

      return { ...existingMeasurement, ...updatedMeasurement };
    } catch (error) {
      console.error('Error updating measurement:', error);
      if (error.statusCode) {
        throw error; // Re-throw validation errors
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update measurement',
      });
    }
  }

  // Handle DELETE request to delete a measurement
  if (method === 'DELETE') {
    try {
      await db.delete(measurements)
        .where(eq(measurements.id, measurementId));

      return { success: true, message: 'Measurement deleted successfully' };
    } catch (error) {
      console.error('Error deleting measurement:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete measurement',
      });
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
});