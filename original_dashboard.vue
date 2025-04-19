<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <PageHeader
      title="Dashboard"
      subtitle="View your tailor business at a glance"
      :primaryAction="{
        label: 'New Client',
        icon: 'i-heroicons-plus',
        to: '/clients/new'
      }"
    />
    
    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <UCard class="bg-white">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-medium text-gray-500">Total Clients</h3>
            <UIcon name="i-heroicons-users" class="text-primary-500" />
          </div>
        </template>
        <div class="text-3xl font-bold">{{ stats.totalClients }}</div>
        <template #footer>
          <div class="text-sm text-gray-500">
            <span class="text-green-500 font-medium">+{{ stats.newClientsThisMonth }}</span> this month
          </div>
        </template>
      </UCard>
      
      <UCard class="bg-white">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-medium text-gray-500">Active Orders</h3>
            <UIcon name="i-heroicons-shopping-bag" class="text-primary-500" />
          </div>
        </template>
        <div class="text-3xl font-bold">{{ stats.activeOrders }}</div>
        <template #footer>
          <div class="text-sm text-gray-500">
            <span class="font-medium">{{ stats.completedOrdersThisMonth }}</span> completed this month
          </div>
        </template>
      </UCard>
      
      <UCard class="bg-white">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-medium text-gray-500">Revenue</h3>
            <UIcon name="i-heroicons-currency-dollar" class="text-primary-500" />
          </div>
        </template>
        <div class="text-3xl font-bold">₦{{ formatNumber(stats.totalRevenue) }}</div>
        <template #footer>
          <div class="text-sm text-gray-500">
            <span class="text-green-500 font-medium">+{{ stats.revenueGrowth }}%</span> vs last month
          </div>
        </template>
      </UCard>
      
      <UCard class="bg-white">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-medium text-gray-500">Subscription</h3>
            <UIcon name="i-heroicons-credit-card" class="text-primary-500" />
          </div>
        </template>
        <div class="text-xl font-bold">{{ stats.subscriptionPlan }}</div>
        <template #footer>
          <div class="text-sm text-gray-500">
            {{ stats.clientsRemaining }} clients remaining
          </div>
        </template>
      </UCard>
    </div>
    
    <!-- Recent Activity and Due Orders -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Activity -->
      <UCard class="bg-white">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="font-medium">Recent Activity</h3>
            <UButton
              color="gray"
              variant="ghost"
              to="/activity"
              size="xs"
            >
              View all
            </UButton>
          </div>
        </template>
        
        <div class="space-y-4">
          <div v-for="activity in recentActivity" :key="activity.id" class="flex items-start space-x-3 py-2">
            <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <UIcon :name="activity.icon" class="text-primary-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900" v-html="activity.message"></p>
              <p class="text-xs text-gray-500">{{ activity.time }}</p>
            </div>
          </div>
        </div>
        
        <template #footer>
          <div v-if="recentActivity.length === 0" class="text-center py-4">
            <p class="text-gray-500">No recent activity</p>
          </div>
        </template>
      </UCard>
      
      <!-- Due Orders -->
      <UCard class="bg-white">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="font-medium">Orders Due Soon</h3>
            <UButton
              color="gray"
              variant="ghost"
              to="/orders"
              size="xs"
            >
              View all
            </UButton>
          </div>
        </template>
        
        <UTable
          :columns="orderColumns"
          :rows="dueOrders"
          :ui="{ 
            td: { 
              padding: 'py-2 px-3' 
            } 
          }"
        >
          <template #client-data="{ row }">
            <div class="font-medium text-gray-900">{{ row.client }}</div>
          </template>
          
          <template #dueDate-data="{ row }">
            <UBadge
              :color="getDueDateColor(row.dueDate)"
              variant="subtle"
              size="sm"
            >
              {{ formatDueDate(row.dueDate) }}
            </UBadge>
          </template>
          
          <template #status-data="{ row }">
            <UBadge
              :color="getStatusColor(row.status)"
              variant="subtle"
              size="sm"
            >
              {{ row.status }}
            </UBadge>
          </template>
          
          <template #actions-data="{ row }">
            <UButton
              icon="i-heroicons-eye"
              color="gray"
              variant="ghost"
              size="xs"
              :to="`/orders/${row.id}/detail`"
            />
          </template>
        </UTable>
        
        <template #footer>
          <div v-if="dueOrders.length === 0" class="text-center py-4">
            <p class="text-gray-500">No orders due soon</p>
          </div>
        </template>
      </UCard>
    </div>
    
    <!-- Client Growth Chart -->
    <UCard class="bg-white">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="font-medium">Client Growth</h3>
          <USelect
            v-model="chartPeriod"
            :options="chartPeriodOptions"
            size="sm"
          />
        </div>
      </template>
      
      <div class="h-64 flex items-center justify-center">
        <!-- Placeholder for chart - in a real app, we'd use a charting library -->
        <div class="text-center text-gray-500">
          <UIcon name="i-heroicons-chart-bar" class="text-5xl mb-2" />
          <p>Client growth chart would be displayed here</p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
// Set page metadata
useHead({
  title: 'Dashboard - QuickMeazure',
});

// Mock data for dashboard
const stats = {
  totalClients: 87,
  newClientsThisMonth: 12,
  activeOrders: 24,
  completedOrdersThisMonth: 18,
  totalRevenue: 450000,
  revenueGrowth: 15,
  subscriptionPlan: 'Standard Plan',
  clientsRemaining: 413, // 500 - 87
};

// Recent activity
const recentActivity = [
  {
    id: 1,
    icon: 'i-heroicons-user-plus',
    message: 'Added new client <strong>John Doe</strong>',
    time: '2 hours ago',
  },
  {
    id: 2,
    icon: 'i-heroicons-variable',
    message: 'Updated measurements for <strong>Sarah Williams</strong>',
    time: '4 hours ago',
  },
  {
    id: 3,
    icon: 'i-heroicons-shopping-bag',
    message: 'New order created for <strong>Michael Brown</strong>',
    time: 'Yesterday',
  },
  {
    id: 4,
    icon: 'i-heroicons-currency-dollar',
    message: 'Received payment of <strong>₦25,000</strong> from <strong>Jane Smith</strong>',
    time: 'Yesterday',
  },
  {
    id: 5,
    icon: 'i-heroicons-check-circle',
    message: 'Completed order for <strong>Emily Davis</strong>',
    time: '2 days ago',
  },
];

// Due orders
const orderColumns = [
  {
    key: 'client',
    label: 'Client',
  },
  {
    key: 'dueDate',
    label: 'Due Date',
  },
  {
    key: 'amount',
    label: 'Amount',
  },
  {
    key: 'status',
    label: 'Status',
  },
  {
    key: 'actions',
    label: '',
  },
];

const dueOrders = [
  {
    id: 1,
    client: 'John Doe',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    amount: '₦35,000',
    status: 'In Progress',
  },
  {
    id: 2,
    client: 'Sarah Williams',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    amount: '₦42,000',
    status: 'In Progress',
  },
  {
    id: 3,
    client: 'Robert Johnson',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    amount: '₦28,500',
    status: 'Pending Payment',
  },
  {
    id: 4,
    client: 'Emily Davis',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday (overdue)
    amount: '₦15,000',
    status: 'Overdue',
  },
];

// Chart period options
const chartPeriodOptions = [
  { label: 'Last 7 days', value: '7days' },
  { label: 'Last 30 days', value: '30days' },
  { label: 'Last 90 days', value: '90days' },
  { label: 'Last year', value: 'year' },
];
const chartPeriod = ref('30days');

// Helper functions
const formatNumber = (number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatDueDate = (date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else {
    return `Due in ${diffDays} days`;
  }
};

// Add standard date formatting function for consistency
const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', { 
    month: 'short', 
    day: '2-digit', 
    year: 'numeric' 
  });
};

const getDueDateColor = (date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'red';
  } else if (diffDays <= 2) {
    return 'orange';
  } else {
    return 'green';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Completed':
      return 'green';
    case 'In Progress':
      return 'blue';
    case 'Pending Payment':
      return 'yellow';
    case 'Overdue':
      return 'red';
    default:
      return 'gray';
  }
};
</script>