/**
 * Client related types
 */

export interface Client {
  id: number
  userId?: number
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
  hasOrders?: boolean
  createdAt: string
  updatedAt?: string
}

export interface ClientMeasurement {
  id: number
  clientId: number
  values: Record<string, any>
  notes?: string
  lastUpdated: string
  createdAt: string
}

export interface ClientFilterOptions {
  search?: string
  sortBy?: 'name' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface ClientStats {
  total: number
  withMeasurements: number
  averageMeasurements: number
}
