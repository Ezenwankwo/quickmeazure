/**
 * Style and product related types
 */

export interface Style {
  id: number
  userId: number
  name: string
  description?: string
  imageUrl?: string
  category?: string
  measurements: Record<string, StyleMeasurement>
  templateId?: number
  template?: StyleTemplate
  notes?: string
  clientId?: number
  client?: {
    id: number
    name: string
  }
  createdAt: string
  updatedAt: string
}

export interface StyleFilterOptions {
  search?: string
  category?: string
  clientId?: number
  templateId?: number
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
