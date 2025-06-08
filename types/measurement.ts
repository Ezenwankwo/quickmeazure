/**
 * Measurement related types
 */

import type { MeasurementValues, UnknownRecord } from './enhanced'

export interface Measurement {
  id: number
  clientId: number
  values: MeasurementValues
  notes?: string
  lastUpdated: string
  createdAt: string
}

export interface MeasurementTemplate {
  id: number
  userId: number
  name: string
  description?: string
  fields: MeasurementField[]
  isDefault: boolean
  archived?: boolean
  gender?: string
  createdAt: string
  updatedAt?: string
}

export interface MeasurementField {
  id: string
  name: string
  type: 'number' | 'text' | 'select'
  required: boolean
  defaultValue?: string | number
  options?: string[]
  unit?: string
  min?: number
  max?: number
  step?: number
  category?: string
  order: number
  isDefault?: boolean
}

export interface ClientMeasurement {
  id: number
  clientId: number
  templateId: number
  values: MeasurementValues
  notes?: string
  lastUpdated: string
  createdAt: string
}

export interface MeasurementStats {
  total: number
  byClient: Record<number, number> // clientId: count
  lastUpdated: string | null
}
