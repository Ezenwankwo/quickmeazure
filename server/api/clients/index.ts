// uuid import removed as it's not being used
import { eq, count, exists, desc, asc, sql, and } from 'drizzle-orm'
import { db } from '~/server/database'
import { clients, orders, measurements, users } from '~/server/database/schema'

// Define event handler for GET requests
export default defineEventHandler(async event => {
  const method = getMethod(event)

  // Get authenticated user from event context
  const auth = event.context.auth
  console.log('Auth context:', auth)
  if (!auth || !auth.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }
  console.log('Authenticated user ID:', auth.userId)

  // Handle GET request to fetch all clients
  if (method === 'GET') {
    try {
      // Get query parameters
      const query = getQuery(event)
      const page = parseInt((query.page as string) || '1')
      const limit = parseInt((query.limit as string) || '10')
      const sortField = (query.sortField as string) || 'name'
      const sortOrder = (query.sortOrder as string) || 'asc'
      const search = query.search as string | undefined

      const hasOrdersFilter = query.hasOrders !== undefined ? query.hasOrders === 'true' : undefined

      // Debug: Log query parameters
      console.log('Query parameters:', {
        page,
        limit,
        sortField,
        sortOrder,
        search,
        hasOrdersFilter,
      })

      // Validate pagination parameters
      if (isNaN(page) || page < 1) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid page parameter',
        })
      }

      if (isNaN(limit) || limit < 1 || limit > 100) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid limit parameter (must be between 1 and 100)',
        })
      }

      // Calculate offset
      const offset = (page - 1) * limit

      // Build where conditions for filtering
      const whereConditions = []

      // Always filter by user ID (ensure integer comparison)
      const userIdAsInt = typeof auth.userId === 'string' ? parseInt(auth.userId) : auth.userId
      whereConditions.push(eq(clients.userId, userIdAsInt))
      console.log('Where conditions for user ID:', auth.userId, 'converted to:', userIdAsInt)

      // Add search condition if provided
      if (search && search.trim() !== '') {
        whereConditions.push(
          sql`(lower(${clients.name}) like ${`%${search.toLowerCase()}%`} OR 
              lower(${clients.email}) like ${`%${search.toLowerCase()}%`} OR 
              ${clients.phone} like ${`%${search}%`})`
        )
      }

      // Add orders filter if provided
      if (hasOrdersFilter !== undefined) {
        if (hasOrdersFilter) {
          whereConditions.push(
            exists(db.select().from(orders).where(eq(orders.clientId, clients.id)))
          )
        } else {
          whereConditions.push(
            sql`NOT ${exists(db.select().from(orders).where(eq(orders.clientId, clients.id)))}`
          )
        }
      }

      // Debug: Log whereConditions before building query
      console.log('whereConditions array:', whereConditions)
      console.log('whereConditions length:', whereConditions.length)
      console.log('userIdAsInt:', userIdAsInt)

      // Build base query with all conditions
      const baseQuery = db
        .select({
          id: clients.id,
          name: clients.name,
          email: clients.email,
          phone: clients.phone,
          address: clients.address,
          notes: clients.notes,
          createdAt: clients.createdAt,

          // Check if client has orders
          hasOrders: exists(db.select().from(orders).where(eq(orders.clientId, clients.id))),
        })
        .from(clients)
        .where(and(...whereConditions))

      // Build count query with same conditions
      const countQuery = db
        .select({
          count: count(),
        })
        .from(clients)
        .where(and(...whereConditions))

      // Determine sort direction
      const sortDirection = sortOrder === 'asc' ? asc : desc

      // Apply sorting
      let orderByClause
      switch (sortField) {
        case 'name':
          orderByClause = sortDirection(clients.name)
          break
        case 'email':
          orderByClause = sortDirection(clients.email)
          break
        case 'createdAt':
          orderByClause = sortDirection(clients.createdAt)
          break
        case 'updatedAt':
          orderByClause = sortDirection(clients.createdAt)
          break
        default:
          orderByClause = sortDirection(clients.name)
          break
      }

      // Apply sorting, pagination, and execute query
      const clientsData = await baseQuery.orderBy(orderByClause).limit(limit).offset(offset)
      console.log('Query result - clients data:', clientsData)
      console.log('Number of clients found:', clientsData.length)

      // Get total count
      const totalCountResult = await countQuery
      const totalCount = totalCountResult[0]?.count || 0
      console.log('Total count result:', totalCountResult)
      console.log('Total count:', totalCount)

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limit)

      // Additional debugging: Let's check if there are ANY clients in the database
      const allClientsCount = await db.select({ count: count() }).from(clients)
      console.log('Total clients in database (all users):', allClientsCount[0]?.count || 0)

      // Check if there are any users in the database
      const allUsersCount = await db.select({ count: count() }).from(users)
      console.log('Total users in database:', allUsersCount[0]?.count || 0)

      return {
        data: clientsData,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch clients',
      })
    }
  }

  // Handle POST request to create a new client
  if (method === 'POST') {
    try {
      const body = await readBody(event)

      // Validate required fields
      if (!body.name) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Name is required',
        })
      }

      // Create new client
      const newClient = await db
        .insert(clients)
        .values({
          name: body.name,
          email: body.email || null,
          phone: body.phone || null,
          address: body.address || null,
          notes: body.notes || null,
          userId: auth.userId,
        })
        .returning()

      // If client was created successfully and measurements are provided
      if (newClient.length > 0 && body.measurements) {
        const clientId = newClient[0].id

        // Process measurements for the current database schema
        const processedMeasurements = {
          clientId,
          // Store all measurements in the values field
          values: {} as Record<string, any>,
          notes: body.measurements.notes || null,
          lastUpdated: new Date(),
        }

        // Extract values from the client request
        // If the client is sending data in the new format (with values field)
        if (body.measurements.values) {
          processedMeasurements.values = body.measurements.values
        }
        // Handle legacy format where measurements are sent as individual fields
        else {
          // Remove non-measurement fields
          const { notes: _notes, templateId: _templateId, ...measurementData } = body.measurements

          // Process each measurement field
          Object.entries(measurementData).forEach(([key, value]) => {
            // Skip empty values and non-measurement fields
            if (value === null || value === '' || typeof value === 'object' || value === undefined)
              return

            // Add to values with basic metadata
            processedMeasurements.values[key] = {
              value: parseFloat(String(value)),
              unit: 'in', // Default unit
              name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            }
          })

          // If additionalMeasurements exists, merge it into values
          if (body.measurements.additionalMeasurements) {
            Object.entries(body.measurements.additionalMeasurements).forEach(([key, value]) => {
              processedMeasurements.values[key] = value
            })
          }
        }

        // Create measurement record
        await db.insert(measurements).values(processedMeasurements)
      }

      return newClient[0]
    } catch (error) {
      console.error('Error creating client:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create client',
      })
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  })
})
