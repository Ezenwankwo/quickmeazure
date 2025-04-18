import { useDrizzle, tables, eq } from '~/server/utils/drizzle'
import { H3Event, createError } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get authenticated user from event context
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }

    const userId = auth.userId
    const clientId = getQuery(event).clientId as string | undefined
    
    // Get database connection
    const db = useDrizzle()
    
    // If clientId is provided, get measurements for that specific client
    if (clientId) {
      // First check if client belongs to user
      const client = await db
        .select()
        .from(tables.clients)
        .where(
          eq(tables.clients.id, parseInt(clientId))
        )
        .limit(1)
      
      if (!client.length || client[0].userId !== userId) {
        throw createError({
          statusCode: 404,
          message: 'Client not found or not authorized'
        })
      }
      
      // Get measurements for the client
      const measurement = await db
        .select()
        .from(tables.measurements)
        .where(
          eq(tables.measurements.clientId, parseInt(clientId))
        )
        .limit(1)
      
      return {
        success: true,
        measurement: measurement[0] || null
      }
    }
    
    // Otherwise, get all measurements for all clients that belong to this user
    const measurements = await db
      .select({
        measurementId: tables.measurements.id,
        clientId: tables.clients.id,
        clientName: tables.clients.name,
        height: tables.measurements.height,
        bust: tables.measurements.bust,
        waist: tables.measurements.waist,
        hip: tables.measurements.hip,
        lastUpdated: tables.measurements.lastUpdated
      })
      .from(tables.measurements)
      .innerJoin(
        tables.clients,
        eq(tables.measurements.clientId, tables.clients.id)
      )
      .where(
        eq(tables.clients.userId, userId)
      )
    
    return {
      success: true,
      measurements
    }
  } catch (error: any) {
    console.error('Error fetching measurements:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch measurements'
    })
  }
}) 