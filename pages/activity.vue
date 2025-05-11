<template>
  <div>
    <div class="px-4 py-6 sm:px-6 lg:px-8">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-gray-900">Activity History</h1>
        <p class="mt-1 text-sm text-gray-500">Track all actions performed in your account.</p>
      </div>

      <UCard class="bg-white mb-6">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="font-medium">Activity Filters</h3>
          </div>
        </template>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UFormGroup label="Activity Type">
            <USelect
              v-model="filters.type"
              :options="activityTypeOptions"
              placeholder="All types"
              clearable
            />
          </UFormGroup>
          
          <UFormGroup label="Date Range">
            <UDatepicker
              v-model="filters.dateRange"
              mode="range"
              placeholder="Select dates"
              clear-button
            />
          </UFormGroup>
          
          <div class="flex items-end">
            <UButton
              @click="fetchActivity"
              color="primary"
              icon="i-heroicons-funnel"
              class="mt-4 md:mt-0"
            >
              Apply Filters
            </UButton>
            <UButton
              @click="resetFilters"
              color="gray"
              variant="ghost"
              icon="i-heroicons-arrow-path"
              class="ml-2 mt-4 md:mt-0"
            >
              Reset
            </UButton>
          </div>
        </div>
      </UCard>

      <UCard class="bg-white">
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-primary-500 h-8 w-8" />
        </div>
        
        <div v-else-if="activities.length === 0" class="text-center py-12">
          <UIcon name="i-heroicons-document-magnifying-glass" class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-semibold text-gray-900">No activity found</h3>
          <p class="mt-1 text-sm text-gray-500">Try changing your filters or check back later.</p>
        </div>
        
        <template v-else>
          <ul class="divide-y divide-gray-200">
            <li v-for="activity in activities" :key="activity.id" class="py-4 px-2 hover:bg-gray-50">
              <div class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <UIcon :name="getActivityIcon(activity.type)" class="text-primary-600" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900" v-html="activity.message"></p>
                  <div class="mt-1 flex items-center text-sm text-gray-500">
                    <UIcon name="i-heroicons-clock" class="mr-1 h-4 w-4 text-gray-400" />
                    <span>{{ formatDateTime(activity.timestamp) }}</span>
                    <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" 
                          :class="getActivityTypeClass(activity.type)">
                      {{ activity.type }}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          </ul>
          
          <div class="mt-4 flex justify-between items-center">
            <p class="text-sm text-gray-500">
              Showing {{ activities.length }} of {{ totalCount }} activities
            </p>
            <UPagination
              v-model="page"
              :total="totalPages"
              :ui="{ rounded: 'rounded-lg' }"
              @update:model-value="fetchActivity"
            />
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useApiAuth } from '~/composables/useApiAuth';
import { format, parseISO } from 'date-fns';

// Set page metadata
useHead({
  title: 'Activity History - QuickMeazure',
});

// Set up auth composable for API calls
const { authFetch } = useApiAuth();

// Activity data
const activities = ref([]);
const isLoading = ref(false);
const page = ref(1);
const totalCount = ref(0);
const totalPages = ref(1);
const perPage = 10;

// Filter options
const activityTypeOptions = [
  { label: 'Login', value: 'login' },
  { label: 'Order Created', value: 'order_created' },
  { label: 'Order Updated', value: 'order_updated' },
  { label: 'Payment', value: 'payment' },
  { label: 'Client Added', value: 'client_added' },
  { label: 'Settings Changed', value: 'settings_changed' }
];

// Filters
const filters = reactive({
  type: null,
  dateRange: null
});

// Reset filters
const resetFilters = () => {
  filters.type = null;
  filters.dateRange = null;
  page.value = 1;
  fetchActivity();
};

// Format date and time
const formatDateTime = (timestamp) => {
  if (!timestamp) return 'Unknown date';
  try {
    return format(parseISO(timestamp), 'MMM d, yyyy h:mm a');
  } catch (e) {
    return timestamp;
  }
};

// Get icon for activity type
const getActivityIcon = (type) => {
  const icons = {
    login: 'i-heroicons-key',
    order_created: 'i-heroicons-shopping-cart',
    order_updated: 'i-heroicons-pencil-square',
    payment: 'i-heroicons-banknotes',
    client_added: 'i-heroicons-user-plus',
    settings_changed: 'i-heroicons-cog-6-tooth',
    default: 'i-heroicons-bell'
  };
  
  return icons[type] || icons.default;
};

// Get class for activity type
const getActivityTypeClass = (type) => {
  const classes = {
    login: 'bg-blue-100 text-blue-800',
    order_created: 'bg-green-100 text-green-800',
    order_updated: 'bg-yellow-100 text-yellow-800',
    payment: 'bg-purple-100 text-purple-800',
    client_added: 'bg-indigo-100 text-indigo-800',
    settings_changed: 'bg-gray-100 text-gray-800',
    default: 'bg-gray-100 text-gray-800'
  };
  
  return classes[type] || classes.default;
};

// Fetch activity data
const fetchActivity = async () => {
  isLoading.value = true;
  
  try {
    // In a real app, you would replace this with actual API call
    // const response = await authFetch('/api/activity', {
    //   method: 'GET',
    //   params: {
    //     page: page.value,
    //     per_page: perPage,
    //     type: filters.type,
    //     start_date: filters.dateRange?.[0],
    //     end_date: filters.dateRange?.[1]
    //   }
    // });
    
    // For demo purposes, generating mock data
    const mockData = generateMockActivity();
    activities.value = mockData.activities;
    totalCount.value = mockData.total;
    totalPages.value = Math.ceil(mockData.total / perPage);
  } catch (error) {
    console.error('Failed to fetch activity:', error);
    activities.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Generate mock activity data for demo
const generateMockActivity = () => {
  const types = ['login', 'order_created', 'order_updated', 'payment', 'client_added', 'settings_changed'];
  const messages = [
    'You logged in to your account',
    'Created new order <strong>#ORD-1234</strong> for <strong>Client Name</strong>',
    'Updated order <strong>#ORD-5678</strong> status to <strong>Completed</strong>',
    'Received payment of <strong>₦45,000</strong> for order <strong>#ORD-9012</strong>',
    'Added new client <strong>Company XYZ</strong>',
    'Updated your profile settings'
  ];
  
  const mockActivities = [];
  
  for (let i = 0; i < perPage; i++) {
    const typeIndex = Math.floor(Math.random() * types.length);
    mockActivities.push({
      id: `act-${Date.now()}-${i}`,
      type: types[typeIndex],
      message: messages[typeIndex],
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return {
    activities: mockActivities,
    total: 35 // Mock total count
  };
};

// Load activity data on component mount
onMounted(() => {
  fetchActivity();
});
</script> 