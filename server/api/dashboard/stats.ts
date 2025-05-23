import type { H3Event, EventHandlerRequest } from 'h3'
import { createError } from 'h3'
import { count } from 'drizzle-orm'
import { useDrizzle, tables, eq, and, sql, desc } from '~/server/utils/drizzle'

interface DashboardStats {
  totalClients: number
  newClientsThisMonth: number
  activeOrders: number
  completedOrdersThisMonth: number
  totalRevenue: number
  revenueGrowth: number
  subscriptionPlan: string
  clientsRemaining: number
}

export default defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  try {
    // Get authenticated user from event context
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      })
    }

    const userId = auth.userId

    // Get database connection
    const db = useDrizzle()

    // Get current date info for month calculations
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)

    // Format dates for SQL queries
    const firstDayOfMonthStr = firstDayOfMonth.toISOString()
    const lastDayOfMonthStr = lastDayOfMonth.toISOString()

    // Previous month date range for comparisons
    const firstDayOfPrevMonth = new Date(currentYear, currentMonth - 1, 1)
    const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0)

    // Format previous month dates for SQL queries
    const firstDayOfPrevMonthStr = firstDayOfPrevMonth.toISOString()
    const lastDayOfPrevMonthStr = lastDayOfPrevMonth.toISOString()

    // 1. Total clients count
    const totalClientsResult = await db
      .select({ count: count() })
      .from(tables.clients)
      .where(eq(tables.clients.userId, userId))

    const totalClients = totalClientsResult[0]?.count || 0

    // 2. New clients this month
    const newClientsResult = await db
      .select({ count: count() })
      .from(tables.clients)
      .where(
        and(
          eq(tables.clients.userId, userId),
          sql`${tables.clients.createdAt} >= ${firstDayOfMonthStr}`,
          sql`${tables.clients.createdAt} <= ${lastDayOfMonthStr}`
        )
      )

    const newClientsThisMonth = newClientsResult[0]?.count || 0

    // 3. Active orders - using case-insensitive pattern matching for more robust status detection
    const activeOrdersResult = await db
      .select({ count: count() })
      .from(tables.orders)
      .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
      .where(
        and(
          eq(tables.clients.userId, userId),
          sql`(${tables.orders.status} ILIKE '%pending%' OR ${tables.orders.status} ILIKE '%progress%')`
        )
      )

    const activeOrders = activeOrdersResult[0]?.count || 0

    // 4. Completed orders this month - using case-insensitive pattern matching
    const completedOrdersResult = await db
      .select({ count: count() })
      .from(tables.orders)
      .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
      .where(
        and(
          eq(tables.clients.userId, userId),
          sql`(${tables.orders.status} ILIKE '%complete%' OR ${tables.orders.status} ILIKE '%done%' OR ${tables.orders.status} ILIKE '%finished%')`,
          sql`${tables.orders.updatedAt} >= ${firstDayOfMonthStr}`,
          sql`${tables.orders.updatedAt} <= ${lastDayOfMonthStr}`
        )
      )

    const completedOrdersThisMonth = completedOrdersResult[0]?.count || 0

    // 5. Total revenue (current month) - get from payments table for accuracy
    const currentMonthRevenueResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${tables.payments.amount}), 0)`,
      })
      .from(tables.payments)
      .innerJoin(tables.orders, eq(tables.payments.orderId, tables.orders.id))
      .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
      .where(
        and(
          eq(tables.clients.userId, userId),
          sql`${tables.payments.paymentDate} >= ${firstDayOfMonthStr}`,
          sql`${tables.payments.paymentDate} <= ${lastDayOfMonthStr}`
        )
      )

    const totalRevenue = currentMonthRevenueResult[0]?.total || 0

    // 6. Previous month revenue - get from payments table for accuracy
    const prevMonthRevenueResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${tables.payments.amount}), 0)`,
      })
      .from(tables.payments)
      .innerJoin(tables.orders, eq(tables.payments.orderId, tables.orders.id))
      .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
      .where(
        and(
          eq(tables.clients.userId, userId),
          sql`${tables.payments.paymentDate} >= ${firstDayOfPrevMonthStr}`,
          sql`${tables.payments.paymentDate} <= ${lastDayOfPrevMonthStr}`
        )
      )

    const prevMonthRevenue = prevMonthRevenueResult[0]?.total || 0

    // Calculate revenue growth percentage
    let revenueGrowth = 0
    if (prevMonthRevenue > 0) {
      revenueGrowth = Math.round(((totalRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
    } else if (totalRevenue > 0) {
      revenueGrowth = 100 // If no previous revenue but current revenue exists, show 100% growth
    }

    // 7. Get user's current active subscription information
    const subscriptionResult = await db
      .select({
        name: tables.plans.name,
        maxClients: tables.plans.maxClients,
        status: tables.subscriptions.status,
        endDate: tables.subscriptions.endDate,
      })
      .from(tables.subscriptions)
      .innerJoin(tables.plans, eq(tables.subscriptions.planId, tables.plans.id))
      .where(
        and(eq(tables.subscriptions.userId, userId), eq(tables.subscriptions.status, 'active'))
      )
      .orderBy(desc(tables.subscriptions.createdAt))
      .limit(1)

    let subscriptionPlan = 'Free Plan'
    let clientLimit = 100 // Default for free plan

    if (subscriptionResult.length > 0) {
      const subscription = subscriptionResult[0]

      // Check if subscription is active and not expired
      const isExpired = subscription.endDate ? new Date(subscription.endDate) < now : false

      if (subscription.status === 'active' && !isExpired) {
        subscriptionPlan = subscription.name
        clientLimit = subscription.maxClients || 0
      }
    }

    // Calculate clients remaining based on limit
    let clientsRemaining = 0
    if (clientLimit > 0) {
      clientsRemaining = Math.max(0, clientLimit - totalClients) // Ensure we don't show negative numbers
    } else {
      // For unlimited plans
      clientsRemaining = -1
    }

    // Assemble the stats object
    const stats: DashboardStats = {
      totalClients,
      newClientsThisMonth,
      activeOrders,
      completedOrdersThisMonth,
      totalRevenue,
      revenueGrowth,
      subscriptionPlan,
      clientsRemaining: clientsRemaining < 0 ? Infinity : clientsRemaining,
    }

    return stats
  } catch (error: any) {
    console.error('Dashboard stats API error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch dashboard statistics',
    })
  }
})
