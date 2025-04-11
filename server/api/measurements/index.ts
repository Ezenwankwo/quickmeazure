import { db } from '~/server/database';
import { measurements, clients, orders } from '~/server/database/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, exists } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';

// Define event handler for GET requests
export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  
  // Get authenticated user from event context
  const auth = event.context.auth;
  if (!auth || !auth.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  // Handle GET request to fetch all measurements
  if (method === 'GET') {
    try {
      // Get the clientId from query parameters if provided
      const query = getQuery(event);
      const clientId = query.clientId as string | undefined;
      
      // Build query based on whether clientId is provided
      let measurementsQuery;
      
      if (clientId) {
        // Query with clientId filter
        measurementsQuery = db
          .select({
            id: measurements.id,
            clientId: measurements.clientId,
            clientName: clients.name,
            bust: measurements.bust,
            waist: measurements.waist,
            hip: measurements.hip,
            shoulder: measurements.shoulder,
            sleeve: measurements.sleeve,
            inseam: measurements.inseam,
            neck: measurements.neck,
            chest: measurements.chest,
            back: measurements.back,
            thigh: measurements.thigh,
            calf: measurements.calf,
            ankle: measurements.ankle,
            wrist: measurements.wrist,
            armhole: measurements.armhole,
            customMeasurements: measurements.customMeasurements,
            notes: measurements.notes,
            createdAt: measurements.createdAt,
            updatedAt: measurements.updatedAt,
            // Check if client has orders
            hasOrders: exists(
              db.select().from(orders).where(eq(orders.clientId, measurements.clientId))
            ),
          })
          .from(measurements)
          .innerJoin(clients, eq(measurements.clientId, clients.id))
          .where(and(
            eq(clients.userId, auth.userId),
            eq(measurements.clientId, clientId)
          ));
      } else {
        // Query without clientId filter
        measurementsQuery = db
          .select({
            id: measurements.id,
            clientId: measurements.clientId,
            clientName: clients.name,
            bust: measurements.bust,
            waist: measurements.waist,
            hip: measurements.hip,
            shoulder: measurements.shoulder,
            sleeve: measurements.sleeve,
            inseam: measurements.inseam,
            neck: measurements.neck,
            chest: measurements.chest,
            back: measurements.back,
            thigh: measurements.thigh,
            calf: measurements.calf,
            ankle: measurements.ankle,
            wrist: measurements.wrist,
            armhole: measurements.armhole,
            customMeasurements: measurements.customMeasurements,
            notes: measurements.notes,
            createdAt: measurements.createdAt,
            updatedAt: measurements.updatedAt,
            // Check if client has orders
            hasOrders: exists(
              db.select().from(orders).where(eq(orders.clientId, measurements.clientId))
            ),
          })
          .from(measurements)
          .innerJoin(clients, eq(measurements.clientId, clients.id))
          .where(eq(clients.userId, auth.userId));
      }
      
      const allMeasurements = await measurementsQuery;
      return allMeasurements;
    } catch (error) {
      console.error('Error fetching measurements:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch measurements',
      });
    }
  }

  // Handle POST request to create a new measurement
  if (method === 'POST') {
    try {
      const body = await readBody(event);
      
      // Validate required fields
      if (!body.clientId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Client ID is required',
        });
      }

      // Verify client exists and belongs to user
      const clientExists = await db.select()
        .from(clients)
        .where(and(
          eq(clients.id, body.clientId),
          eq(clients.userId, auth.userId)
        ));

      if (clientExists.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Client not found',
        });
      }

      // Create new measurement
      const newMeasurement = {
        id: uuidv4(),
        clientId: body.clientId,
        bust: body.bust || null,
        waist: body.waist || null,
        hip: body.hip || null,
        shoulder: body.shoulder || null,
        sleeve: body.sleeve || null,
        inseam: body.inseam || null,
        neck: body.neck || null,
        chest: body.chest || null,
        back: body.back || null,
        thigh: body.thigh || null,
        calf: body.calf || null,
        ankle: body.ankle || null,
        wrist: body.wrist || null,
        armhole: body.armhole || null,
        customMeasurements: body.customMeasurements ? JSON.stringify(body.customMeasurements) : null,
        notes: body.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(measurements).values(newMeasurement);
      
      // Return the new measurement with client name
      return {
        ...newMeasurement,
        clientName: clientExists[0].name
      };
    } catch (error: any) {
      console.error('Error creating measurement:', error);
      if (error.statusCode) {
        throw error; // Re-throw validation errors
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create measurement',
      });
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
});