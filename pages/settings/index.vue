<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <PageHeader title="Settings" />

    <!-- Settings Tabs -->
    <UTabs :items="tabs" class="w-full">
      <template #default="{ item }">
        <div class="flex items-center gap-x-2">
          <UIcon :name="item._icon" class="h-5 w-5" />
          <span>{{ item.label }}</span>
        </div>
      </template>

      <!-- Profile Tab -->
      <template #profile>
        <div class="py-6">
          <SettingsProfileForm />
        </div>
      </template>

      <!-- Notifications Tab -->
      <template #notifications>
        <div class="py-6">
          <SettingsNotificationsForm />
        </div>
      </template>

      <!-- Security Tab -->
      <template #security>
        <div class="py-6">
          <SettingsSecurityForm />
        </div>
      </template>

      <!-- Measurements Tab -->
      <template #measurements>
        <div class="py-6">
          <UTabs :items="measurementsTabs" class="w-full">
            <template #units>
              <div class="py-6">
                <MeasurementSettings @saved="handleSettingsSaved" />
              </div>
            </template>
            <template #templates>
              <div class="py-6">
                <MeasurementTemplatesManager />
              </div>
            </template>
          </UTabs>
        </div>
      </template>

      <!-- Billing Tab -->
      <template #billing>
        <div class="py-6">
          <div class="bg-gray-100 p-4 rounded mb-4">
            <p class="text-sm">Billing tab content loaded</p>
          </div>
          
          <!-- Direct billing content instead of component -->
          <UCard>
            <template #header>
              <div class="flex items-center">
                <UIcon name="i-heroicons-credit-card" class="mr-2 text-primary-500 h-5 w-5" />
                <h2 class="text-xl font-semibold text-gray-900">Billing & Subscription</h2>
              </div>
              <p class="mt-1 text-sm text-gray-500">
                Manage your subscription plan and payment methods.
              </p>
            </template>
            
            <div class="space-y-6">
              <!-- Current Plan -->
              <div>
                <h3 class="text-base font-medium text-gray-900 mb-4">Current Plan</h3>
                
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="flex items-center">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          Professional
                        </span>
                        <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                      <p class="mt-1 text-sm text-gray-600">
                        All features included with unlimited clients and measurements
                      </p>
                      <p class="mt-2 text-sm text-gray-500">
                        Renews on June 15, 2025
                      </p>
                    </div>
                    <div>
                      <UButton 
                        color="gray" 
                        variant="soft"
                      >
                        Change Plan
                      </UButton>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Payment Methods -->
              <div class="pt-6 border-t border-gray-200">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-base font-medium text-gray-900">Payment Methods</h3>
                  <UButton 
                    size="sm" 
                    color="gray" 
                    variant="soft"
                    icon="i-heroicons-plus"
                  >
                    Add Payment Method
                  </UButton>
                </div>
                
                <div class="space-y-3">
                  <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div class="flex items-center">
                      <UIcon name="i-heroicons-credit-card" class="h-8 w-8 text-gray-700 mr-3" />
                      <div>
                        <div class="flex items-center">
                          <p class="text-sm font-medium text-gray-900">Visa •••• 4242</p>
                          <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Default
                          </span>
                        </div>
                        <p class="text-xs text-gray-500">Expires 12/2025</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </template>
    </UTabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

definePageMeta({
  middleware: ['auth']
});

// Main tabs
const tabs = [
  { 
    label: 'Profile', 
    slot: 'profile',
    _icon: 'i-heroicons-user-circle' // Used in custom template
  },
  { 
    label: 'Notifications', 
    slot: 'notifications',
    _icon: 'i-heroicons-bell' // Used in custom template
  },
  { 
    label: 'Security', 
    slot: 'security',
    _icon: 'i-heroicons-shield-check' // Used in custom template
  },
  { 
    label: 'Measurements', 
    slot: 'measurements',
    _icon: 'i-heroicons-ruler' // Used in custom template
  },
  { 
    label: 'Billing', 
    slot: 'billing',
    _icon: 'i-heroicons-credit-card' // Used in custom template
  },
];

// Measurements subtabs
const measurementsTabs = [
  { label: 'Units', slot: 'units' },
  { label: 'Templates', slot: 'templates' }
];

// Handle settings saved
const handleSettingsSaved = () => {
  // You can add any global state updates or notifications here
  useToast().add({
    title: 'Settings saved',
    description: 'Your settings have been updated successfully',
    icon: 'i-heroicons-check-circle',
    color: 'green',
  });
};
</script>
