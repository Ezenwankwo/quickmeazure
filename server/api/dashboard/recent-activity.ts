import { useDrizzle, tables, eq, and, sql, desc } from '~/server/utils/drizzle'
import { H3Event, EventHandlerRequest, createError } from 'h3'

interface ActivityItem {
  id: number;
  type: string;  // 'client', 'order', 'payment', 'measurement'
  action: string; // 'created', 'updated', 'completed', etc.
  entity: string; // Entity name (client name, order ID, etc.)
  message: string;
  time: string;
  icon: string;
  metadata?: Record<string, any>;
}

// Map activity types to icons
const activityIcons: Record<string, Record<string, string>> = {
  client: {
    created: 'i-heroicons-user-plus',
    updated: 'i-heroicons-user'
  },
  measurement: {
    created: 'i-heroicons-variable',
    updated: 'i-heroicons-variable'
  },
  order: {
    created: 'i-heroicons-shopping-bag',
    updated: 'i-heroicons-shopping-bag',
    completed: 'i-heroicons-check-circle'
  },
  payment: {
    created: 'i-heroicons-currency-dollar',
    received: 'i-heroicons-currency-dollar'
  }
};

// Helper function to format relative time
const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) {
    return new Date(date).toLocaleDateString();
  } else if (diffDay > 0) {
    return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
  } else if (diffHour > 0) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  } else if (diffMin > 0) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

export default defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  try {
    // Get authenticated user from event context
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }

    const userId = auth.userId;
    const limit = parseInt(event.context.query?.limit as string || '10');
    
    // Get database connection
    const db = useDrizzle();
    
    // Get recent clients (created or updated)
    const recentClients = await db
      .select({
        id: tables.clients.id,
        name: tables.clients.name,
        createdAt: tables.clients.createdAt,
        action: sql<string>`'created'::text`
      })
      .from(tables.clients)
      .where(eq(tables.clients.userId, userId))
      .orderBy(desc(tables.clients.createdAt))
      .limit(limit);
    
    // Get recent orders
    const recentOrders = await db
      .select({
        id: tables.orders.id,
        clientId: tables.orders.clientId,
        status: tables.orders.status,
        createdAt: tables.orders.createdAt,
        updatedAt: tables.orders.updatedAt,
        clientName: tables.clients.name
      })
      .from(tables.orders)
      .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
      .where(eq(tables.clients.userId, userId))
      .orderBy(desc(tables.orders.updatedAt))
      .limit(limit);
    
    // Get recent payments
    const recentPayments = await db
      .select({
        id: tables.payments.id,
        orderId: tables.payments.orderId,
        amount: tables.payments.amount,
        paymentDate: tables.payments.paymentDate,
        clientName: tables.clients.name
      })
      .from(tables.payments)
      .innerJoin(tables.orders, eq(tables.payments.orderId, tables.orders.id))
      .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
      .where(eq(tables.clients.userId, userId))
      .orderBy(desc(tables.payments.paymentDate))
      .limit(limit);
    
    // Get recent measurements
    const recentMeasurements = await db
      .select({
        id: tables.measurements.id,
        clientId: tables.measurements.clientId,
        lastUpdated: tables.measurements.lastUpdated,
        clientName: tables.clients.name
      })
      .from(tables.measurements)
      .innerJoin(tables.clients, eq(tables.measurements.clientId, tables.clients.id))
      .where(eq(tables.clients.userId, userId))
      .orderBy(desc(tables.measurements.lastUpdated))
      .limit(limit);
    
    // Now combine and format all activities
    const activities: ActivityItem[] = [
      // Format client activities
      ...recentClients.map(client => ({
        id: client.id,
        type: 'client',
        action: 'created',
        entity: client.name,
        message: `Added new client <strong>${client.name}</strong>`,
        time: getRelativeTime(new Date(client.createdAt || new Date())),
        icon: activityIcons.client.created
      })),
      
      // Format order activities
      ...recentOrders.map(order => {
        const isCompleted = order.status === 'Completed';
        const timestamp = isCompleted 
          ? (order.updatedAt || order.createdAt || new Date())
          : (order.createdAt || new Date());
        
        return {
          id: order.id,
          type: 'order',
          action: isCompleted ? 'completed' : 'created',
          entity: `Order #${order.id}`,
          message: isCompleted 
            ? `Completed order for <strong>${order.clientName}</strong>`
            : `New order created for <strong>${order.clientName}</strong>`,
          time: getRelativeTime(new Date(timestamp)),
          icon: activityIcons.order[isCompleted ? 'completed' : 'created']
        };
      }),
      
      // Format payment activities
      ...recentPayments.map(payment => ({
        id: payment.id,
        type: 'payment',
        action: 'received',
        entity: `Payment for Order #${payment.orderId}`,
        message: `Received payment of <strong>₦${payment.amount.toLocaleString()}</strong> from <strong>${payment.clientName}</strong>`,
        time: getRelativeTime(new Date(payment.paymentDate || new Date())),
        icon: activityIcons.payment.received
      })),
      
      // Format measurement activities
      ...recentMeasurements.map(measurement => {
        const lastUpdated = measurement.lastUpdated || new Date();
        return {
          id: measurement.id,
          type: 'measurement',
          action: 'updated',
          entity: measurement.clientName,
          message: `Updated measurements for <strong>${measurement.clientName}</strong>`,
          time: getRelativeTime(new Date(lastUpdated)),
          icon: activityIcons.measurement.updated
        };
      })
    ];
    
    // Sort all activities by time (most recent first)
    activities.sort((a, b) => {
      // Use string comparison for the relative time strings
      // This will work well enough for our relative time format
      return a.time.localeCompare(b.time);
    });
    
    // Return the limited number of activities
    return activities.slice(0, limit);
    
  } catch (error: any) {
    console.error('Dashboard recent activity API error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch recent activity'
    })
  }
}) 