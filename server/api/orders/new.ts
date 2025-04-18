import { db } from '~/server/database';
import { orders, clients, styles } from '~/server/database/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';

// Define a specialized endpoint just for creating orders
export default defineEventHandler(async (event) => {
  // Only allow POST requests
  const method = getMethod(event);
  if (method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
    });
  }
  
  // Verify authentication
  const auth = event.context.auth;
  if (!auth || !auth.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    // Read request body
    const body = await readBody(event);
    console.log('CREATE ENDPOINT: Received order data:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.clientId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Client ID is required',
      });
    }
    
    if (body.totalAmount === undefined || body.totalAmount === null) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Total amount is required',
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
        statusMessage: 'Client not found or does not belong to current user',
      });
    }
    
    // Verify style exists and belongs to user if provided
    let styleData = null;
    if (body.styleId) {
      const styleExists = await db.select()
        .from(styles)
        .where(and(
          eq(styles.id, body.styleId),
          eq(styles.userId, auth.userId)
        ));

      if (styleExists.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Style not found or does not belong to current user',
        });
      }
      styleData = styleExists[0];
    }
    
    // Ensure proper numeric conversion with fallbacks
    const depositAmount = typeof body.depositAmount !== 'undefined' ? parseFloat(body.depositAmount) || 0 : 0;
    const totalAmount = typeof body.totalAmount !== 'undefined' ? parseFloat(body.totalAmount) || 0 : 0;
    
    // Validate total amount
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Total amount must be a valid positive number',
      });
    }
    
    const balanceAmount = totalAmount - depositAmount;
    
    // Create new order - KEEP THIS SIMPLE, EXACTLY LIKE OTHER WORKING ENDPOINTS
    const newOrder = {
      id: uuidv4(),
      clientId: body.clientId,
      measurementId: body.measurementId || null,
      styleId: body.styleId || null,
      status: body.status || 'pending',
      dueDate: undefined,
      totalAmount: totalAmount,
      depositAmount: depositAmount,
      balanceAmount: balanceAmount,
      notes: body.notes || null,
    };
    
    console.log('CREATE ENDPOINT: Inserting order:', {
      ...newOrder,
      dueDate: null,
      createdAt: 'DEFAULT',
      updatedAt: 'DEFAULT',
    });
    
    try {
      // Insert the order - KEEP THIS SIMPLE
      try {
        console.log('CREATE ENDPOINT: Using ORM insert attempt...');
        await db.insert(orders).values({
          id: newOrder.id,
          clientId: newOrder.clientId,
          measurementId: newOrder.measurementId,
          styleId: newOrder.styleId,
          status: newOrder.status,
          // No timestamps or date fields
          totalAmount: newOrder.totalAmount,
          depositAmount: newOrder.depositAmount,
          balanceAmount: newOrder.balanceAmount,
          notes: newOrder.notes,
        });
        console.log('CREATE ENDPOINT: ORM insert successful!');
      } catch (ormError) {
        // If ORM fails, try direct SQL as fallback
        console.error('CREATE ENDPOINT: ORM insert failed:', ormError);
        console.log('CREATE ENDPOINT: Falling back to direct SQL...');
        
        try {
          // Import necessary for direct SQL
          const { createClient } = await import('@libsql/client');
          
          const client = createClient({
            url: 'file:./quickmeazure.db',
          });
          
          // Use direct SQL with minimal fields
          const sql = `
            INSERT INTO orders (
              id, client_id, measurement_id, style_id, status,
              total_amount, deposit_amount, balance_amount, notes
            ) VALUES (
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?
            )
          `;
          
          const params = [
            newOrder.id,
            newOrder.clientId,
            newOrder.measurementId,
            newOrder.styleId,
            newOrder.status,
            newOrder.totalAmount,
            newOrder.depositAmount,
            newOrder.balanceAmount,
            newOrder.notes
          ];
          
          console.log('CREATE ENDPOINT: Executing SQL with params:', params);
          await client.execute({ sql, args: params });
          console.log('CREATE ENDPOINT: Direct SQL insert successful!');
        } catch (sqlError: any) {
          console.error('CREATE ENDPOINT: Direct SQL insert also failed:', sqlError);
          throw new Error(`All insert attempts failed: ${sqlError.message || 'Unknown error'}`);
        }
      }
      
      console.log('CREATE ENDPOINT: Order inserted successfully with ID:', newOrder.id);
    } catch (dbError: any) {
      console.error('CREATE ENDPOINT: Database error:', dbError);
      throw new Error(`Database error: ${dbError.message || 'Unknown error'}`);
    }
    
    // Format the response
    return {
      ...newOrder,
      dueDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientName: clientExists[0].name,
      styleName: styleData?.name || null,
      styleImageUrl: styleData?.imageUrl || null
    };
  } catch (error: any) {
    console.error('CREATE ENDPOINT: Error creating order:', error);
    
    // Re-throw validation errors
    if (error.statusCode) {
      throw error;
    }
    
    // Handle any other errors
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create order: ${error.message || 'Unknown error'}`,
    });
  }
}); 