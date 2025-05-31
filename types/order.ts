/**
 * Order related types
 */

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'

export interface Order {
  id: number
  clientId: number
  dueDate?: string
  totalAmount: number
  status: OrderStatus
  description?: string
  details?: Record<string, any>
  createdAt: string
  updatedAt?: string
}

export interface OrderFilterOptions {
  clientId?: number
  status?: OrderStatus[]
  dateFrom?: string
  dateTo?: string
  sortBy?: 'createdAt' | 'dueDate' | 'totalAmount'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface OrderStats {
  total: number
  totalRevenue: number
  averageOrderValue: number
  byStatus: Array<{ status: OrderStatus; count: number; amount: number }>
  recentOrders: Order[]
}
