/**
 * Subscription and billing related types
 */

export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'pending' | 'past_due'

export interface Plan {
  id: number
  name: string
  description: string
  price: number
  interval: 'monthly' | 'annual' | 'one_time'
  features: Record<string, any>
  isActive: boolean
  isFeatured: boolean
  maxClients?: number
  maxStyles?: number
  maxStorage?: number
  createdAt: string
  updatedAt?: string
}

export interface Subscription {
  id: number
  userId: number
  planId: number
  status: SubscriptionStatus
  startDate: string
  endDate?: string
  billingPeriod: 'monthly' | 'annual'
  amount: number
  nextBillingDate?: string
  canceledAt?: string
  paymentMethod: string
  paymentReference?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt?: string
}

export interface PaymentMethod {
  id: number
  userId: number
  type: 'card' | 'bank' | 'mobile_money'
  provider: 'paystack' | 'flutterwave' | 'stripe'
  isDefault: boolean
  details: Record<string, any>
  last4?: string
  expMonth?: number
  expYear?: number
  createdAt: string
  updatedAt?: string
}

export interface Invoice {
  id: number
  subscriptionId: number
  userId: number
  amount: number
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  dueDate: string
  paidAt?: string
  paymentMethodId?: number
  paymentReference?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt?: string
}

export interface Payment {
  id: number
  orderId?: number
  subscriptionId?: number
  userId: number
  amount: number
  currency: string
  paymentMethod: string
  paymentMethodId?: number
  paymentDate: string
  status: 'successful' | 'failed' | 'pending'
  reference?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt?: string
}
