<template>
  <div>
    <BaseListPage
      title="Orders"
      page-type="orders"
      :primary-action="{
        label: 'Add Order',
        to: ROUTE_NAMES.DASHBOARD.ORDERS.NEW,
      }"
      :show-search="true"
      :initial-search="search"
      :sort-options="sortOptions"
      :current-page="currentPage"
      :page-size="itemsPerPage"
      :total-items="filteredOrders.length"
      :is-loading="isLoading"
      :has-items="filteredOrders.length > 0"
      :has-active-filters="hasActiveFilters"
      empty-state-icon="i-heroicons-document-text"
      :empty-state-title="search || hasActiveFilters ? 'No orders found' : 'No orders yet'"
      :empty-state-description="
        search || hasActiveFilters
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'Get started by creating your first order.'
      "
      :empty-state-action="
        !search && !hasActiveFilters
          ? {
              label: 'Create Order',
              to: ROUTE_NAMES.DASHBOARD.ORDERS.NEW,
              icon: 'i-heroicons-plus',
            }
          : null
      "
      :show-delete-modal="showDeleteModal"
      :item-to-delete="orderToDelete"
      @update:current-page="handlePageChange"
      @search="handleSearch"
      @sort="handleSort"
      @reset-filters="resetFilters"
      @delete-confirm="deleteOrder"
    >
      <!-- Filters slot -->
      <template #filters>
        <div class="flex flex-wrap gap-2">
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
            placeholder="Status"
            size="md"
            class="w-full sm:w-40"
            @update:model-value="filterOrders"
          />
          <USelect
            v-model="paymentStatusFilter"
            :items="paymentStatusOptions"
            placeholder="Payment"
            size="md"
            class="w-full sm:w-40"
            @update:model-value="filterOrders"
          />
          <USelect
            v-model="sortBy"
            :items="sortOptions"
            placeholder="Sort by"
            size="md"
            class="w-full sm:w-48"
            @update:model-value="filterOrders"
          />
        </div>
      </template>

      <!-- Default slot for content -->
      <template #default>
        <!-- Desktop Table View (hidden on mobile) -->
        <div class="hidden md:block">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    v-for="column in columns"
                    :key="column.key"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    :class="column.class"
                  >
                    {{ column.label }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="order in paginatedOrders" :key="order.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ order.id }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ order.clientName }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ order.items?.length || 0 }} items
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${{ order.totalAmount?.toFixed(2) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <UBadge :color="getStatusColor(order.status)">
                      {{ formatStatus(order.status) }}
                    </UBadge>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ order.dueDate ? formatDate(order.dueDate) : 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center space-x-2">
                      <UButton
                        color="gray"
                        variant="ghost"
                        icon="i-heroicons-pencil"
                        :to="getOrderPath(order.id)"
                        title="Edit order"
                      />
                      <UButton
                        color="red"
                        variant="ghost"
                        icon="i-heroicons-trash"
                        title="Delete order"
                        @click="confirmDelete(order)"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Mobile Card View -->
        <div class="md:hidden space-y-4">
          <div
            v-for="order in paginatedOrders"
            :key="order.id"
            class="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
          >
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-sm font-medium text-gray-900">Order #{{ order.id }}</h3>
              <UBadge :color="getStatusColor(order.status)" size="sm">
                {{ formatStatus(order.status) }}
              </UBadge>
            </div>
            <p class="text-sm text-gray-500">Client: {{ order.clientName }}</p>
            <p class="text-sm text-gray-500">Items: {{ order.items?.length || 0 }}</p>
            <p class="text-sm font-medium text-gray-900">
              Total: ${{ order.totalAmount?.toFixed(2) }}
            </p>
            <p class="text-sm text-gray-500">
              Due: {{ order.dueDate ? formatDate(order.dueDate) : 'N/A' }}
            </p>
            <div class="mt-3 pt-3 border-t border-gray-100 flex justify-end space-x-2">
              <UButton
                color="gray"
                variant="ghost"
                size="sm"
                icon="i-heroicons-pencil"
                :to="getOrderPath(order.id)"
                title="Edit order"
              />
              <UButton
                color="red"
                variant="ghost"
                size="sm"
                icon="i-heroicons-trash"
                title="Delete order"
                @click="confirmDelete(order)"
              />
            </div>
          </div>
        </div>
      </template>
    </BaseListPage>

    <!-- Delete Confirmation Modal -->
    <DeleteModal
      v-model:model-value="showDeleteModal"
      :item-type="'order'"
      :item-name="orderToDelete?.id ? `order #${orderToDelete.id}` : 'this order'"
      @confirm="deleteOrder"
      @update:model-value="val => (showDeleteModal = val)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHead, useToast } from '#imports'
import { ROUTE_NAMES } from '~/constants/routes'
import type { Order } from '~/types/order'
import { useAppRoutes } from '~/composables/useRoutes'

// Set page metadata
useHead({
  title: 'Orders - QuickMeazure',
  meta: [{ name: 'description', content: 'View and manage your orders' }],
})

// State
const search = ref('')
const statusFilter = ref('all')
const paymentStatusFilter = ref('any')
const sortBy = ref('newest')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const isLoading = ref(false)
const orders = ref<Order[]>([])
const showDeleteModal = ref(false)
const orderToDelete = ref<Order | null>(null)
const isDeleting = ref(false)

// Constants
const routes = useAppRoutes()

// Options
const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Ready for Pickup', value: 'ready_for_pickup' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const paymentStatusOptions = [
  { label: 'All payment statuses', value: 'any' },
  { label: 'Paid in full', value: 'paid' },
  { label: 'Partial payment', value: 'partial' },
  { label: 'No payment', value: 'none' },
]

const sortOptions = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Due soonest', value: 'due_soonest' },
  { label: 'Highest amount', value: 'amount_high' },
  { label: 'Lowest amount', value: 'amount_low' },
]

const columns = [
  { key: 'id', label: 'Order ID' },
  { key: 'client', label: 'Client' },
  { key: 'items', label: 'Items' },
  { key: 'total', label: 'Total' },
  { key: 'status', label: 'Status' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'actions', label: 'Actions', class: 'text-right' },
]

// Computed
const filteredOrders = computed(() => {
  let result = [...orders.value]

  // Apply search filter
  if (search.value) {
    const searchTerm = search.value.toLowerCase()
    result = result.filter(
      order =>
        order.id.toLowerCase().includes(searchTerm) ||
        order.clientName?.toLowerCase().includes(searchTerm) ||
        order.clientEmail?.toLowerCase().includes(searchTerm) ||
        order.clientPhone?.includes(searchTerm)
    )
  }

  // Apply status filter
  if (statusFilter.value !== 'all') {
    result = result.filter(order => order.status === statusFilter.value)
  }

  // Apply payment status filter
  if (paymentStatusFilter.value !== 'any') {
    result = result.filter(order => {
      if (paymentStatusFilter.value === 'paid') return order.paymentStatus === 'paid'
      if (paymentStatusFilter.value === 'partial') return order.paymentStatus === 'partial'
      if (paymentStatusFilter.value === 'none')
        return !order.paymentStatus || order.paymentStatus === 'unpaid'
      return true
    })
  }

  // Apply sorting
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'due_soonest':
        return (
          (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) -
          (b.dueDate ? new Date(b.dueDate).getTime() : Infinity)
        )
      case 'amount_high':
        return (b.totalAmount || 0) - (a.totalAmount || 0)
      case 'amount_low':
        return (a.totalAmount || 0) - (b.totalAmount || 0)
      default:
        return 0
    }
  })

  return result
})

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredOrders.value.slice(start, end)
})

const hasActiveFilters = computed(() => {
  return statusFilter.value !== 'all' || paymentStatusFilter.value !== 'any' || search.value !== ''
})

// Methods
const handlePageChange = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSearch = (value: string) => {
  search.value = value
  currentPage.value = 1 // Reset to first page on new search
}

const handleSort = (value: string) => {
  sortBy.value = value
}

const filterOrders = () => {
  currentPage.value = 1
}

const resetFilters = () => {
  statusFilter.value = 'all'
  paymentStatusFilter.value = 'any'
  search.value = ''
  sortBy.value = 'newest'
  currentPage.value = 1
}

const confirmDelete = (order: Order) => {
  orderToDelete.value = order
  showDeleteModal.value = true
}

const deleteOrder = async () => {
  if (!orderToDelete.value) return

  const toast = useToast()
  isDeleting.value = true

  try {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Remove the order from the list
    const index = orders.value.findIndex(o => o.id === orderToDelete.value?.id)
    if (index !== -1) {
      orders.value.splice(index, 1)
    }

    toast.add({
      title: 'Order deleted',
      description: `Order #${orderToDelete.value.id} has been deleted successfully.`,
      color: 'green',
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to delete order. Please try again.',
      color: 'red',
    })
  } finally {
    isDeleting.value = false
    showDeleteModal.value = false
    orderToDelete.value = null
  }
}

const fetchOrders = async () => {
  isLoading.value = true
  try {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock data - replace with actual API response
    orders.value = Array.from({ length: 25 }, (_, i) => ({
      id: `ORD-${1000 + i}`,
      clientName: `Client ${i + 1}`,
      clientEmail: `client${i + 1}@example.com`,
      clientPhone: `+123456789${i.toString().padStart(2, '0')}`,
      items: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, j) => ({
        id: `item-${j}`,
        name: `Item ${j + 1}`,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: Math.floor(Math.random() * 100) + 10,
      })),
      totalAmount: Math.floor(Math.random() * 1000) + 100,
      status: ['draft', 'pending', 'in_progress', 'ready_for_pickup', 'completed', 'cancelled'][
        i % 6
      ],
      paymentStatus: ['unpaid', 'partial', 'paid'][i % 3],
      dueDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    }))
  } catch (error) {
    console.error('Error fetching orders:', error)
    useToast().add({
      title: 'Error',
      description: 'Failed to load orders. Please try again.',
      color: 'red',
    })
  } finally {
    isLoading.value = false
  }
}

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'gray'
    case 'pending':
      return 'yellow'
    case 'in_progress':
      return 'blue'
    case 'ready_for_pickup':
      return 'indigo'
    case 'completed':
      return 'green'
    case 'cancelled':
      return 'red'
    default:
      return 'gray'
  }
}

const getOrderPath = (id: string) => {
  return routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.ORDERS.EDIT]({ id })
}

// Lifecycle hooks
onMounted(() => {
  fetchOrders()
})
</script>
