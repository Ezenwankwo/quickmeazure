<template>
  <div class="billing-tab">
    <h2 class="text-xl font-semibold mb-6">Billing & Subscription</h2>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading subscription information...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">!</div>
      <p>{{ error }}</p>
      <button class="retry-button" @click="refreshSubscription">Retry</button>
    </div>

    <div v-else class="subscription-info">
      <!-- Subscription Status Card -->
      <div class="status-card">
        <div class="status-header">
          <h3 class="text-lg font-medium">Subscription Status</h3>
          <span :class="['status-badge', statusClass]">{{ statusText }}</span>
        </div>

        <div v-if="isTrialing" class="trial-info">
          <p><strong>Trial Period:</strong> {{ trialDaysLeft }} days remaining</p>
          <div class="progress-bar">
            <div class="progress" :style="{ width: trialProgressPercentage + '%' }"></div>
          </div>
        </div>

        <div v-if="currentPlan" class="plan-details">
          <h4 class="text-md font-medium">{{ currentPlan.name }}</h4>
          <p class="plan-description">{{ currentPlan.description }}</p>
          <p class="plan-price">
            {{ formatPrice(currentPlan.price) }} / {{ currentPlan.interval }}
          </p>

          <div v-if="status.currentPeriodEndsAt" class="renewal-info">
            <p>
              <span v-if="isCanceled">
                Access until: {{ formatDate(status.currentPeriodEndsAt) }}
              </span>
              <span v-else> Next billing date: {{ formatDate(status.currentPeriodEndsAt) }} </span>
            </p>
          </div>
        </div>

        <div v-else-if="isSubscribed || isTrialing" class="no-plan-info">
          <p>Your subscription is active, but we couldn't load your plan details.</p>
          <button class="refresh-button" @click="refreshSubscription">Refresh</button>
        </div>

        <div v-else class="no-subscription">
          <p>You don't have an active subscription.</p>
        </div>
      </div>

      <!-- Plan Features and Limits -->
      <div v-if="currentPlan" class="plan-features-limits">
        <div class="plan-limits">
          <h4 class="text-md font-medium mb-2">Plan Limits</h4>
          <ul>
            <li>
              <span class="limit-name">Clients:</span>
              <span class="limit-value">{{ currentPlan.limits.clients }}</span>
            </li>
            <li>
              <span class="limit-name">Templates:</span>
              <span class="limit-value">{{ currentPlan.limits.templates }}</span>
            </li>
            <li>
              <span class="limit-name">Users:</span>
              <span class="limit-value">{{ currentPlan.limits.users }}</span>
            </li>
            <li>
              <span class="limit-name">Storage:</span>
              <span class="limit-value">{{ formatStorage(currentPlan.limits.storage) }}</span>
            </li>
          </ul>
        </div>

        <div class="plan-features">
          <h4 class="text-md font-medium mb-2">Features</h4>
          <ul>
            <li
              v-for="feature in currentPlan.features"
              :key="feature.id"
              :class="{ included: feature.included }"
            >
              <span class="feature-icon">
                {{ feature.included ? '✓' : '✗' }}
              </span>
              <span class="feature-name">{{ feature.name }}</span>
              <span v-if="feature.description" class="feature-description">
                {{ feature.description }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Available Plans Section -->
      <div v-if="plans.length > 0" class="available-plans">
        <h3 class="text-lg font-medium mb-4">Available Plans</h3>

        <div class="plans-grid">
          <div
            v-for="plan in plans"
            :key="plan.id"
            class="plan-card"
            :class="{ 'current-plan': currentPlan && currentPlan.id === plan.id }"
          >
            <div class="plan-header">
              <h4 class="text-md font-medium">{{ plan.name }}</h4>
              <span v-if="currentPlan && currentPlan.id === plan.id" class="current-plan-badge">
                Current Plan
              </span>
            </div>

            <p class="plan-description">{{ plan.description }}</p>

            <div class="plan-price">
              <span class="price">{{ formatPrice(plan.price) }}</span>
              <span class="interval">/ {{ plan.interval }}</span>
            </div>

            <div class="plan-actions">
              <button
                v-if="currentPlan && currentPlan.id === plan.id && !isCanceled"
                disabled
                class="current-plan-button"
              >
                Current Plan
              </button>

              <button
                v-else-if="currentPlan && currentPlan.id === plan.id && isCanceled"
                class="reactivate-button"
                @click="reactivateSubscription"
              >
                Reactivate
              </button>

              <button v-else class="subscribe-button" @click="subscribeToPlan(plan.id)">
                {{ isSubscribed ? 'Switch Plan' : 'Subscribe' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Subscription Actions -->
      <div v-if="isSubscribed && !isCanceled" class="subscription-actions">
        <h3 class="text-lg font-medium mb-4">Subscription Management</h3>
        <button class="cancel-button" @click="showCancelDialog">Cancel Subscription</button>
      </div>

      <!-- Payment Methods Section -->
      <div class="payment-methods">
        <h3 class="text-lg font-medium mb-4">Payment Methods</h3>
        <p class="text-gray-500 mb-4">Manage your payment methods and billing information.</p>

        <!-- This would be replaced with actual payment method components -->
        <div class="payment-method-placeholder">
          <p>Payment method management will be implemented here.</p>
        </div>
      </div>

      <!-- Billing History Section -->
      <div class="billing-history">
        <h3 class="text-lg font-medium mb-4">Billing History</h3>
        <p class="text-gray-500 mb-4">View your past invoices and payment history.</p>

        <!-- This would be replaced with actual billing history components -->
        <div class="billing-history-placeholder">
          <p>Billing history will be displayed here.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSubscriptionStore } from '~/store/modules/subscription'

// Use the Nuxt UI toast composable
const toast = useToast()
const subscriptionStore = useSubscriptionStore()

// Destructure store properties
const {
  plans,
  currentPlan,
  status,
  loading,
  error,
  isSubscribed,
  isTrialing,
  isCanceled,
  isPastDue,
  trialDaysLeft,
} = subscriptionStore

// Computed properties
const statusClass = computed(() => {
  if (isSubscribed.value) return 'active'
  if (isTrialing.value) return 'trial'
  if (isPastDue.value) return 'past-due'
  if (isCanceled.value) return 'canceled'
  return 'inactive'
})

const statusText = computed(() => {
  if (isSubscribed.value && !isCanceled.value) return 'Active'
  if (isTrialing.value) return 'Trial'
  if (isPastDue.value) return 'Past Due'
  if (isCanceled.value) return 'Canceled'
  return 'Inactive'
})

const trialProgressPercentage = computed(() => {
  // Assuming a 14-day trial period
  const totalTrialDays = 14
  const daysUsed = totalTrialDays - trialDaysLeft.value
  return Math.min(100, Math.max(0, (daysUsed / totalTrialDays) * 100))
})

// Methods
const refreshSubscription = async () => {
  try {
    await Promise.all([subscriptionStore.fetchPlans(), subscriptionStore.fetchSubscriptionStatus()])
    toast.success('Subscription information updated')
  } catch (_err) {
    toast.error('Failed to refresh subscription information')
  }
}

const subscribeToPlan = async planId => {
  try {
    await subscriptionStore.subscribeToPlan(planId)
    toast.success('Successfully subscribed to plan')
  } catch (_err) {
    toast.error('Failed to subscribe to plan')
  }
}

const showCancelDialog = () => {
  // Implementation would depend on your UI framework
  // This is a placeholder for the cancel subscription dialog
  if (
    confirm(
      'Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.'
    )
  ) {
    cancelSubscription()
  }
}

const cancelSubscription = async () => {
  try {
    await subscriptionStore.cancelSubscription(false)
    toast.success('Your subscription has been canceled')
  } catch (_err) {
    toast.error('Failed to cancel subscription')
  }
}

const reactivateSubscription = async () => {
  try {
    // This would typically reactivate a canceled subscription
    // Implementation depends on your backend API
    await subscriptionStore.reactivateSubscription()
    toast.success('Your subscription has been reactivated')
  } catch (_err) {
    toast.error('Failed to reactivate subscription')
  }
}

// Utility functions
const formatDate = dateString => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatPrice = price => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

const formatStorage = storageMB => {
  if (storageMB >= 1024) {
    return `${(storageMB / 1024).toFixed(1)} GB`
  }
  return `${storageMB} MB`
}

// Initialize on component mount
onMounted(async () => {
  await refreshSubscription()
})
</script>

<style scoped>
.billing-tab {
  max-width: 1000px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e74c3c;
  color: white;
  font-weight: bold;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.retry-button,
.refresh-button {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  margin-top: 1rem;
  cursor: pointer;
  font-weight: 500;
}

.status-card,
.plan-features-limits,
.available-plans,
.subscription-actions,
.payment-methods,
.billing-history {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.active {
  background-color: #2ecc71;
  color: white;
}

.status-badge.trial {
  background-color: #3498db;
  color: white;
}

.status-badge.past-due {
  background-color: #e74c3c;
  color: white;
}

.status-badge.canceled {
  background-color: #95a5a6;
  color: white;
}

.status-badge.inactive {
  background-color: #7f8c8d;
  color: white;
}

.trial-info {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f0f7ff;
  border-radius: 6px;
  border-left: 4px solid #3498db;
}

.progress-bar {
  height: 8px;
  background-color: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.progress {
  height: 100%;
  background-color: #3498db;
  border-radius: 4px;
}

.plan-details {
  margin-bottom: 1.5rem;
}

.plan-description {
  color: #7f8c8d;
  margin-bottom: 1rem;
}

.plan-price {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.renewal-info {
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.plan-features-limits {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.plan-limits ul,
.plan-features ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.plan-limits li {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #ecf0f1;
}

.plan-features li {
  display: flex;
  align-items: flex-start;
  padding: 0.5rem 0;
}

.feature-icon {
  margin-right: 0.75rem;
  font-weight: bold;
}

.feature-name {
  font-weight: 500;
  margin-right: 0.5rem;
}

.feature-description {
  color: #7f8c8d;
  font-size: 0.875rem;
}

li.included .feature-icon {
  color: #2ecc71;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.plan-card {
  background-color: white;
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.plan-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.plan-card.current-plan {
  border: 2px solid #3498db;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.current-plan-badge {
  background-color: #3498db;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.subscribe-button,
.reactivate-button,
.current-plan-button,
.cancel-button {
  width: 100%;
  padding: 0.75rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  text-align: center;
  margin-top: 1rem;
}

.subscribe-button {
  background-color: #3498db;
  color: white;
}

.reactivate-button {
  background-color: #2ecc71;
  color: white;
}

.current-plan-button {
  background-color: #ecf0f1;
  color: #7f8c8d;
  cursor: not-allowed;
}

.cancel-button {
  background-color: #e74c3c;
  color: white;
  max-width: 200px;
}

.payment-method-placeholder,
.billing-history-placeholder {
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 1.5rem;
  text-align: center;
  color: #7f8c8d;
}

@media (max-width: 768px) {
  .plan-features-limits {
    grid-template-columns: 1fr;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }
}
</style>
