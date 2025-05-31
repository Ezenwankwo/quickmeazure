<template>
  <div class="space-y-6">
    <PageHeader
      title="Orders"
      subtitle="Manage your customer orders and track payments"
      :primary-action="{
        label: 'Create New Order',
        icon: 'i-heroicons-plus',
        to: NEW_ORDER_PATH,
      }"
    />

    <!-- Search and Filter with glassy effect -->
    <UCard class="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
      <div class="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4 items-center">
        <div class="relative w-full sm:w-80 group">
          <UInput
            id="search-input"
            v-model="search"
            placeholder="Search client name..."
            icon="i-heroicons-magnifying-glass"
            size="lg"
            class="w-full focus-within:ring-2 ring-primary-200"
            @input="filterOrders"
          />
          <span
            v-if="search"
            class="absolute right-2 top-2.5 cursor-pointer text-gray-400 hover:text-gray-600"
            @click="resetSearch"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </span>
        </div>

        <div class="flex gap-2 w-full sm:w-auto sm:ml-auto">
          <USelect
            id="sort-select"
            v-model="sortBy"
            :items="sortOptions"
            placeholder="Sort by"
            size="lg"
            class="w-full"
            @update:model-value="filterOrders"
          />

          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-funnel"
            class="flex-shrink-0"
            :class="{ 'text-primary-600 bg-primary-50': isFilterOpen }"
            @click="isFilterOpen = !isFilterOpen"
          >
            <span class="hidden sm:inline">Filter</span>
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Filter Panel -->
    <UCard
      v-if="isFilterOpen"
      class="bg-white/95 backdrop-blur-sm border border-gray-100 shadow-sm mt-2"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <UFormField label="Status">
          <USelect
            id="status-filter"
            v-model="filters.status"
            :items="statusOptions"
            placeholder="All statuses"
            size="lg"
            class="w-full"
            @update:model-value="filterOrders"
          />
        </UFormField>

        <UFormField label="Due Date">
          <USelect
            id="due-date-filter"
            v-model="filters.dueDate"
            :items="dueDateOptions"
            placeholder="Any time"
            size="lg"
            class="w-full"
            @update:model-value="filterOrders"
          />
        </UFormField>

        <UFormField label="Payment Status">
          <USelect
            id="payment-status-filter"
            v-model="filters.paymentStatus"
            :items="paymentStatusOptions"
            placeholder="All payment statuses"
            size="lg"
            class="w-full"
            @update:model-value="filterOrders"
          />
        </UFormField>
      </div>

      <div class="flex justify-end mt-4">
        <UButton
color="gray"
variant="outline"
icon="i-heroicons-arrow-path"
@click="resetFilters">
          Reset Filters
        </UButton>
      </div>
    </UCard>

    <!-- Orders Table (desktop) / Cards (mobile) -->
    <UCard class="bg-white">
      <!-- Desktop Table View (hidden on mobile) -->
      <div class="hidden md:block">
        <!-- Loading state for desktop -->
        <div v-if="isLoading" class="py-8 space-y-6">
          <USkeleton class="h-8 w-full" />
          <USkeleton v-for="i in 5" :key="i" class="h-12 w-full" />
        </div>

        <!-- Empty state for desktop -->
        <div v-else-if="paginatedOrders.length === 0" class="py-12 text-center">
          <UIcon name="i-heroicons-shopping-bag" class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-semibold text-gray-900">No orders found</h3>
          <p class="mt-1 text-sm text-gray-500">
            {{
              search || isFilterApplied
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first order'
            }}
          </p>
          <div class="mt-6">
            <UButton v-if="!search && !isFilterApplied" to="/orders/new" color="primary">
              Create order
            </UButton>
            <UButton
v-else
color="gray"
variant="outline"
@click="resetFilters">
              Reset filters
            </UButton>
          </div>
        </div>

        <!-- Table for desktop -->
        <table v-else class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="order in paginatedOrders" :key="order.id" class="hover:bg-gray-50">
              <!-- Client column -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div
                    class="w-8 h-8 rounded-full bg-gray-50 shadow-sm flex items-center justify-center mr-3 border border-gray-200"
                  >
                    <span class="text-gray-700 font-semibold">{{ getInitials(order.client) }}</span>
                  </div>
                  <NuxtLink
                    :to="`/orders/${order.id}/detail`"
                    class="font-medium text-gray-800 hover:text-primary-700"
                  >
                    {{ order.clientName || order.client }}
                  </NuxtLink>
                </div>
              </td>

              <!-- Style column -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="order.style">{{ order.style }}</span>
                <span v-else class="text-gray-400">No style</span>
              </td>

              <!-- Due Date column -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="order.dueDate" class="flex items-center">
                  <span
                    :class="{
                      'text-red-600 font-medium': isOverdue(order.dueDate),
                      'text-amber-600 font-medium':
                        !isOverdue(order.dueDate) && isDueSoon(order.dueDate),
                    }"
                  >
                    {{ formatDate(order.dueDate) }}
                  </span>
                  <UIcon
                    v-if="isOverdue(order.dueDate)"
                    name="i-heroicons-exclamation-circle"
                    class="text-red-500 ml-1"
                  />
                  <UIcon
                    v-else-if="isDueSoon(order.dueDate)"
                    name="i-heroicons-clock"
                    class="text-amber-500 ml-1"
                  />
                </div>
                <span v-else class="text-gray-400">Not set</span>
              </td>

              <!-- Status column -->
              <td class="px-6 py-4 whitespace-nowrap">
                <UBadge :color="getStatusColor(order.status)" variant="subtle" size="sm">
                  {{ order.status }}
                </UBadge>
              </td>

              <!-- Payment column -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-col">
                  <div class="text-sm font-medium">
                    {{ formatPrice(order.totalAmount) }}
                  </div>
                  <div
                    class="text-xs"
                    :class="{
                      'text-green-600': order.balanceAmount <= 0,
                      'text-amber-600': order.depositAmount > 0 && order.balanceAmount > 0,
                      'text-gray-500': order.depositAmount <= 0 && order.balanceAmount > 0,
                    }"
                  >
                    <template v-if="order.balanceAmount <= 0"> Paid in full </template>
                    <template v-else-if="order.depositAmount > 0">
                      {{ formatPrice(order.balanceAmount) }} balance
                    </template>
                    <template v-else> No payment </template>
                  </div>
                </div>
              </td>

              <!-- Actions column -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex space-x-2">
                  <UButton
                    icon="i-heroicons-eye"
                    color="gray"
                    variant="ghost"
                    size="xs"
                    :to="`/orders/${order.id}/detail`"
                  />
                  <UButton
                    color="gray"
                    variant="ghost"
                    icon="i-heroicons-pencil-square"
                    size="xs"
                    :to="`/orders/${order.id}/edit`"
                  />
                  <UButton
                    color="gray"
                    variant="ghost"
                    icon="i-heroicons-trash"
                    size="xs"
                    class="text-red-500 hover:text-red-700"
                    @click="confirmDelete(order)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-4">
        <!-- Loading state for mobile -->
        <template v-if="isLoading">
          <div
            v-for="i in 3"
            :key="i"
            class="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4"
          >
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-full bg-gray-200 animate-pulse mr-3" />
              <div class="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
            <div class="space-y-2">
              <div class="flex justify-between py-1 border-b border-gray-100">
                <div class="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                <div class="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              </div>
              <div class="flex justify-between py-1 border-b border-gray-100">
                <div class="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                <div class="h-4 bg-gray-200 rounded animate-pulse w-2/5" />
              </div>
              <div class="flex justify-between py-1 border-b border-gray-100">
                <div class="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                <div class="h-4 bg-gray-200 rounded animate-pulse w-1/6" />
              </div>
            </div>
            <div class="flex justify-between items-center pt-2">
              <div class="h-8 bg-gray-200 rounded animate-pulse w-1/4" />
              <div class="flex space-x-2">
                <div class="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                <div class="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </template>

        <!-- Orders list for mobile -->
        <template v-else-if="paginatedOrders.length > 0">
          <div
            v-for="order in paginatedOrders"
            :key="order.id"
            class="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
          >
            <div class="flex items-start mb-3">
              <div
                class="w-10 h-10 rounded-full bg-gray-50 shadow-sm flex items-center justify-center mr-3 flex-shrink-0 border border-gray-200"
              >
                <span class="text-gray-700 font-semibold text-lg">{{
                  getInitials(order.client)
                }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <NuxtLink
                  :to="`/orders/${order.id}/detail`"
                  class="font-semibold text-lg text-gray-800 hover:text-primary-700 block truncate"
                >
                  {{ order.client }}
                </NuxtLink>
                <div>
                  <UBadge
                    :color="getStatusColor(order.status)"
                    variant="subtle"
                    size="sm"
                    class="inline-flex px-2.5 py-0.5 rounded font-medium text-xs"
                  >
                    {{ order.status }}
                  </UBadge>
                </div>
              </div>
            </div>

            <div class="space-y-2 text-sm">
              <div class="flex justify-between py-1 border-b border-gray-100">
                <span class="text-gray-500">Style</span>
                <span v-if="order.style" class="text-right">{{ order.style }}</span>
                <span v-else class="text-gray-400">No style</span>
              </div>
              <div class="flex justify-between py-1 border-b border-gray-100">
                <span class="text-gray-500">Due Date</span>
                <div
                  v-if="order.dueDate"
                  class="flex items-center"
                  :class="{
                    'text-red-600 font-medium': isOverdue(order.dueDate),
                    'text-amber-600 font-medium':
                      !isOverdue(order.dueDate) && isDueSoon(order.dueDate),
                  }"
                >
                  <span class="text-right">{{ formatDate(order.dueDate) }}</span>
                  <UIcon
                    v-if="isOverdue(order.dueDate)"
                    name="i-heroicons-exclamation-circle"
                    class="text-red-500 ml-1"
                  />
                  <UIcon
                    v-else-if="isDueSoon(order.dueDate)"
                    name="i-heroicons-clock"
                    class="text-amber-500 ml-1"
                  />
                </div>
                <span v-else class="text-gray-400">Not set</span>
              </div>
              <div class="flex justify-between py-1 border-b border-gray-100">
                <span class="text-gray-500">Payment</span>
                <div class="text-right">
                  <div class="font-medium">
                    {{ formatPrice(order.totalAmount) }}
                  </div>
                  <span
                    :class="{
                      'text-green-600': order.balanceAmount <= 0,
                      'text-amber-600': order.depositAmount > 0 && order.balanceAmount > 0,
                      'text-gray-500': order.depositAmount <= 0 && order.balanceAmount > 0,
                    }"
                  >
                    <template v-if="order.balanceAmount <= 0">(Paid in full)</template>
                    <template v-else-if="order.depositAmount > 0">
                      ({{ formatPrice(order.depositAmount) }} paid,
                      {{ formatPrice(order.balanceAmount) }} balance)
                    </template>
                    <template v-else>(No payment)</template>
                  </span>
                </div>
              </div>
              <div class="flex justify-between py-1">
                <span class="text-gray-500">Created</span>
                <span class="text-right">{{ formatDate(order.createdAt) }}</span>
              </div>
            </div>

            <div class="flex justify-between mt-3 pt-3 border-t border-gray-100">
              <UButton
                v-if="order.balanceAmount > 0"
                color="primary"
                variant="outline"
                size="sm"
                :to="`/orders/${order.id}/payment`"
                icon="i-heroicons-currency-dollar"
              >
                Payment
              </UButton>
              <span v-else />

              <div class="flex space-x-2">
                <UButton
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-eye"
                  size="sm"
                  :to="`/orders/${order.id}/detail`"
                />
                <UButton
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-pencil-square"
                  size="xs"
                  :to="`/orders/${order.id}/edit`"
                />
                <UButton
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  size="sm"
                  class="text-red-500 hover:text-red-700"
                  @click="confirmDelete(order)"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- Empty state for mobile -->
        <div v-else-if="filteredOrders.length === 0" class="py-12 flex flex-col items-center">
          <UIcon name="i-heroicons-shopping-bag" class="text-gray-400 mb-4" size="xl" />
          <h3 class="font-medium text-lg text-gray-900">No orders found</h3>
          <p class="text-gray-500 text-center mt-1">
            {{
              search || isFilterApplied.value
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first order'
            }}
          </p>
          <UButton
            v-if="search || isFilterApplied.value"
            color="gray"
            variant="outline"
            class="mt-4"
            @click="resetFilters"
          >
            Reset filters
          </UButton>
          <UButton
v-else
color="primary"
class="mt-4"
to="/orders/new"
icon="i-heroicons-plus">
            Create order
          </UButton>
        </div>
      </div>

      <!-- Pagination -->
      <template #footer>
        <div
          v-if="filteredOrders.length > 0"
          class="flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <div class="text-sm text-gray-500 order-2 sm:order-1">
            Showing {{ Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems) }}-{{
              Math.min(currentPage * ITEMS_PER_PAGE, totalItems)
            }}
            of {{ totalItems }} orders
          </div>

          <!-- Pagination -->
          <div v-if="showPagination" class="flex items-center space-x-1 order-1 sm:order-2">
            <!-- Previous button -->
            <UButton
              variant="ghost"
              color="gray"
              :disabled="currentPage === 1"
              size="sm"
              icon="i-heroicons-chevron-left"
              class="rounded-lg"
              @click="currentPage > 1 && (currentPage--, fetchOrders())"
            />

            <!-- First page -->
            <UButton
              variant="ghost"
              color="gray"
              :class="currentPage === 1 ? 'bg-primary-50 text-primary-700' : ''"
              size="sm"
              class="rounded-lg"
              @click="((currentPage = 1), fetchOrders())"
            >
              1
            </UButton>

            <!-- Ellipsis if needed -->
            <span v-if="currentPage > 3 && pageCount > 5" class="px-1">...</span>

            <!-- Pages before current -->
            <UButton
              v-for="page in getVisiblePageNumbers()"
              :key="page"
              variant="ghost"
              color="gray"
              :class="currentPage === page ? 'bg-primary-50 text-primary-700' : ''"
              size="sm"
              class="rounded-lg"
              @click="((currentPage = page), fetchOrders())"
            >
              {{ page }}
            </UButton>

            <!-- Ellipsis if needed -->
            <span v-if="currentPage < pageCount - 2 && pageCount > 5" class="px-1">...</span>

            <!-- Last page if not already shown -->
            <UButton
              v-if="pageCount > 1 && !getVisiblePageNumbers().includes(pageCount)"
              variant="ghost"
              color="gray"
              :class="currentPage === pageCount ? 'bg-primary-50 text-primary-700' : ''"
              size="sm"
              class="rounded-lg"
              @click="((currentPage = pageCount), fetchOrders())"
            >
              {{ pageCount }}
            </UButton>

            <!-- Next button -->
            <UButton
              variant="ghost"
              color="gray"
              :disabled="currentPage === pageCount"
              size="sm"
              icon="i-heroicons-chevron-right"
              class="rounded-lg"
              @click="currentPage < pageCount && (currentPage++, fetchOrders())"
            />
          </div>
        </div>
      </template>
    </UCard>

    <!-- Delete Confirmation Modal -->
    <DeleteModal
      v-model="showDeleteModal"
      title="Confirm Deletion"
      :message="`Are you sure you want to delete the order for <strong>${orderToDelete?.client}</strong>? This action cannot be undone.`"
      :loading="isDeleting"
      @confirm="deleteOrder"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import type { Order } from '~/types/order'
import { useAuthStore } from '~/store/modules/auth'

// Composable
const routes = useAppRoutes()

// Constants
const NEW_ORDER_PATH = routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.ORDERS.NEW] as string
const _getOrderPath = (id: string): string =>
  (
    routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.ORDERS.VIEW] as (params: {
      id: string
    }) => string
  )({ id })

// Set page metadata
useHead({
  title: 'Orders',
})

// Stores
const orderStore = useOrderStore()

// Composable
const toast = useToast()

// Used in template but not directly in script
const _router = useRouter()
const _authStore = useAuthStore()

// Component state
const search = ref('')
const sortBy = ref('dueDate-asc')
const isFilterOpen = ref(false)
const showDeleteModal = ref(false)
const orderToDelete = ref<Order | null>(null)
const isDeleting = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10

// Computed properties
const totalItems = computed(() => orderStore.totalCount)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))

// Orders from store
const { orders, isLoading } = storeToRefs(orderStore)

// Filters
const filters = ref({
  status: 'all',
  dueDate: 'all',
  paymentStatus: 'any',
})

// Apply filters to store
watchEffect(() => {
  const filterParams: Record<string, any> = {}

  if (filters.value.status !== 'all') {
    filterParams.status = filters.value.status
  }

  if (filters.value.paymentStatus !== 'any') {
    filterParams.paymentStatus = filters.value.paymentStatus
  }

  // Apply search
  if (search.value) {
    filterParams.search = search.value
  }

  // Apply sorting
  const [sortField, sortOrder] = sortBy.value.split('-')
  filterParams.sortBy = sortField
  filterParams.sortOrder = sortOrder.toUpperCase()

  // Apply pagination
  filterParams.page = currentPage.value
  filterParams.limit = itemsPerPage

  // Update store filters
  orderStore.updateFilters(filterParams)

  // Fetch orders with current filters
  orderStore.fetchOrders()
})

// Options for filters
const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'Pending' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Ready for Pickup', value: 'Ready for Pickup' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
]

const dueDateOptions = [
  { label: 'Any time', value: 'all' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Due today', value: 'today' },
  { label: 'Due this week', value: 'thisWeek' },
  { label: 'Due next week', value: 'nextWeek' },
  { label: 'Due this month', value: 'thisMonth' },
]

const paymentStatusOptions = [
  { label: 'All payment statuses', value: 'any' },
  { label: 'Paid in full', value: 'paid' },
  { label: 'Partial payment', value: 'partial' },
  { label: 'No payment', value: 'none' },
]

// Sort options
const sortOptions = [
  { label: 'Due date (earliest first)', value: 'dueDate-asc' },
  { label: 'Due date (latest first)', value: 'dueDate-desc' },
  { label: 'Client name (A-Z)', value: 'client-asc' },
  { label: 'Client name (Z-A)', value: 'client-desc' },
  { label: 'Total amount (high to low)', value: 'amount-desc' },
  { label: 'Total amount (low to high)', value: 'amount-asc' },
  { label: 'Recently added', value: 'created-desc' },
]

// Table columns
const columns = [
  {
    key: 'client',
    label: 'Client',
    id: 'client',
  },
  {
    key: 'style',
    label: 'Style',
    id: 'style',
  },
  {
    key: 'dueDate',
    label: 'Due Date',
    id: 'dueDate',
  },
  {
    key: 'status',
    label: 'Status',
    id: 'status',
  },
  {
    key: 'payment',
    label: 'Payment',
    id: 'payment',
  },
  {
    key: 'actions',
    label: '',
    sortable: false,
    id: 'actions',
  },
]

// Constants
const ITEMS_PER_PAGE = 10

// Computed properties
const pageCount = computed(() => {
  return totalPages.value
})

const paginatedOrders = computed(() => {
  return filteredOrders.value
})

const showPagination = computed(() => {
  return totalPages.value > 1
})

// This section intentionally left empty as the isFilterApplied computed property is already defined above

// Fetch orders from API
const fetchOrders = async () => {
  isLoading.value = true

  try {
    // Build query parameters
    const params = new URLSearchParams()
    params.append('page', currentPage.value.toString())
    params.append('limit', ITEMS_PER_PAGE.toString())

    // Add search parameter if provided
    if (search.value.trim()) {
      params.append('search', search.value)
    }

    // Add sort parameters
    if (sortBy.value) {
      const [field, direction] = sortBy.value.split('-')
      params.append('sortField', field)
      params.append('sortOrder', direction)
    }

    // Add status filter if provided
    if (filters.value.status !== 'all') {
      params.append('status', filters.value.status)
    }

    // Add due date filters
    if (filters.value.dueDate !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      switch (filters.value.dueDate) {
        case 'overdue':
          params.append('dueDateEnd', today.toISOString().split('T')[0])
          break
        case 'today':
          params.append('dueDateStart', today.toISOString().split('T')[0])
          params.append('dueDateEnd', today.toISOString().split('T')[0])
          break
        case 'this-week': {
          const endOfWeek = new Date(today)
          endOfWeek.setDate(today.getDate() + (6 - today.getDay()))
          params.append('dueDateStart', today.toISOString().split('T')[0])
          params.append('dueDateEnd', endOfWeek.toISOString().split('T')[0])
          break
        }
        case 'this-month': {
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          params.append('dueDateStart', today.toISOString().split('T')[0])
          params.append('dueDateEnd', endOfMonth.toISOString().split('T')[0])
          break
        }
      }
    }

    // Make API request with all parameters and auth headers
    const response = await $fetch(`/api/orders?${params.toString()}`, {
      headers: {
        ...authStore.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    })

    // Format the orders data for display
    orders.value = response.data.map(order => formatOrderData(order))

    // Update pagination data from server response
    filteredOrders.value = orders.value

    // Update pagination from server response
    if (response.pagination) {
      currentPage.value = response.pagination.page
      totalItems.value = response.pagination.total
      totalPages.value = response.pagination.totalPages
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
    let errorMessage = 'Failed to load orders. Please refresh the page.'

    // Handle unauthorized errors
    if (error.response?.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.'
      // Redirect to login
      navigateTo('/auth/login')
    }

    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'error',
    })

    orders.value = []
    filteredOrders.value = []
  } finally {
    isLoading.value = false
  }
}

// Helper function to format order data
const formatOrderData = order => {
  const dueDate = order.dueDate ? new Date(order.dueDate) : null

  // Extract payment information from order details if it exists
  let depositAmount = 0
  let balanceAmount = 0

  // Extract payment data from order.payments or order.details.payments
  if (order.details && typeof order.details === 'object') {
    console.log('Order details found:', order.details)

    // Try to get payments from details
    if (order.details.payments) {
      console.log('Payments found in details:', order.details.payments)
      depositAmount = parseFloat(order.details.depositAmount || 0)
    }

    // Try to extract depositAmount directly
    if (order.details.depositAmount) {
      depositAmount = parseFloat(order.details.depositAmount)
    }
  }

  // Check if depositAmount comes directly from the order object
  if (order.depositAmount) {
    depositAmount = parseFloat(order.depositAmount)
  }

  // Calculate balance amount
  const totalAmount = order.totalAmount || 0
  if (order.balanceAmount !== undefined) {
    balanceAmount = parseFloat(order.balanceAmount)
  } else {
    balanceAmount = totalAmount - depositAmount
  }

  console.log('Payment details extracted:', {
    totalAmount,
    depositAmount,
    balanceAmount,
  })

  return {
    id: order.id,
    client: order.clientName,
    clientId: order.clientId,
    status: order.status,
    style: order.style || order.styleName || '', // Try multiple possible field names
    dueDate: dueDate,
    isOverdue: dueDate ? isOverdue(dueDate) : false,
    isDueSoon: dueDate ? isDueSoon(dueDate) : false,
    totalAmount: totalAmount,
    balanceAmount: balanceAmount,
    depositAmount: depositAmount,
    paymentStatus: balanceAmount > 0 ? (depositAmount > 0 ? 'partial' : 'none') : 'paid',
    createdAt: new Date(order.createdAt).toISOString(),
    updatedAt: new Date(order.updatedAt).toISOString(),
    styleImageUrl: order.styleImageUrl,
    // Include all original data
    originalData: order,
  }
}

// Call fetchOrders on component mount
onMounted(async () => {
  await orderStore.fetchOrders()
})

// Computed property to check if any filter is applied
const hasActiveFilters = computed(() => {
  return (
    orderStore.filters.status !== 'all' ||
    orderStore.filters.dueDate !== 'all' ||
    orderStore.filters.paymentStatus !== 'any' ||
    search.value.trim() !== ''
  )
})

// Expose to template
const _hasActiveFilters = hasActiveFilters

// Filter and sort orders
const filterOrders = () => {
  // Reset to first page when filter changes
  currentPage.value = 1
  // Fetch data with new filters
  fetchOrders()
}

const resetFilters = () => {
  search.value = ''
  sortBy.value = 'dueDate-asc'
  filters.value = {
    status: 'all',
    dueDate: 'all',
    paymentStatus: 'any',
  }
  filterOrders()
}

// Reset search
const resetSearch = () => {
  search.value = ''
  filterOrders()
}

// Format date
const formatDate = timestamp => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

// Format price
const formatPrice = amount => {
  return `₦${amount.toLocaleString()}`
}

// Get initials from name
const getInitials = name => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Check if order is overdue
const isOverdue = dueDate => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return dueDate < today
}

// Check if order is due soon (within 3 days)
const isDueSoon = dueDate => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const threeDaysFromNow = today + 3 * 24 * 60 * 60 * 1000
  return dueDate >= today && dueDate <= threeDaysFromNow
}

// Get status color
const getStatusColor = status => {
  switch (status) {
    case 'Pending':
      return 'neutral'
    case 'In Progress':
      return 'primary'
    case 'Ready for Pickup':
      return 'warning'
    case 'Completed':
      return 'success'
    case 'Cancelled':
      return 'error'
    default:
      return 'neutral'
  }
}

// Confirm delete
const confirmDelete = order => {
  orderToDelete.value = order
  showDeleteModal.value = true
}

// Delete order
const deleteOrder = async () => {
  if (!orderToDelete.value) return

  isDeleting.value = true

  try {
    await orderStore.deleteOrder(orderToDelete.value.id)

    // Show success notification
    toast.add({
      title: 'Order deleted',
      description: `Order for ${orderToDelete.value.client} has been deleted successfully.`,
      color: 'primary',
    })

    // Close modal
    showDeleteModal.value = false
    orderToDelete.value = null
  } catch (error: any) {
    console.error('Error deleting order:', error)

    toast.add({
      title: 'Error',
      description: error.message || 'Failed to delete order. Please try again.',
      color: 'error',
    })

    // Handle unauthorized errors
    if (error.response?.status === 401) {
      // The store will handle the redirect to login
      return
    }
  } finally {
    isDeleting.value = false
  }
}

// Update order status
const _updateOrderStatus = async (order: Order, newStatus: string) => {
  const oldStatus = order.status
  isUpdatingStatus.value = true

  try {
    await orderStore.updateOrderStatus(order.id, newStatus)

    // Show success notification
    toast.add({
      title: 'Status updated',
      description: `Order status changed to ${newStatus}`,
      color: 'primary',
    })
  } catch (error: any) {
    console.error('Error updating order status:', error)

    // Revert the status change on error
    order.status = oldStatus

    toast.add({
      title: 'Error',
      description: error.message || 'Failed to update order status. Please try again.',
      color: 'error',
    })

    // Handle unauthorized errors
    if (error.response?.status === 401) {
      // The store will handle the redirect to login
      return
    }
  } finally {
    isUpdatingStatus.value = false
  }
}

// Helper function to get visible page numbers
const getVisiblePageNumbers = () => {
  const visiblePages = []
  const totalPages = pageCount.value
  const current = currentPage.value

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      visiblePages.push(i)
    }
  } else {
    if (current <= 3) {
      for (let i = 2; i <= 4; i++) {
        visiblePages.push(i)
      }
    } else if (current >= totalPages - 2) {
      for (let i = totalPages - 3; i <= totalPages - 1; i++) {
        visiblePages.push(i)
      }
    } else {
      for (let i = current - 1; i <= current + 1; i++) {
        visiblePages.push(i)
      }
    }
  }

  return visiblePages
}
</script>
