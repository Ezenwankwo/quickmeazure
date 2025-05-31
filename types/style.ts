/**
 * Style and product related types
 */

export interface Style {
  id: number
  userId: number
  name: string
  description?: string
  imageUrl?: string
  details?: Record<string, any>
  category?: string
  createdAt: string
  updatedAt?: string
}

export interface StyleFilterOptions {
  search?: string
  category?: string
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface StyleStats {
  total: number
  byCategory: Array<{ category: string; count: number }>
  recentStyles: Style[]
}
