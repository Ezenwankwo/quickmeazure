<template>
  <div class="space-y-6">
    <PageHeader
      title="Clients"
      :primary-action="{
        label: 'Add Client',
        icon: 'i-heroicons-plus',
        to: routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.CLIENTS.NEW],
      }"
    />

    <!-- Search and Filter with glassy effect -->
    <UCard class="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
      <div class="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4 items-center">
        <div class="relative w-full sm:w-80 group">
          <UInput
            id="client-search"
            v-model="search"
            placeholder="Search clients..."
            icon="i-heroicons-magnifying-glass"
            size="lg"
            class="w-full focus-within:ring-2 ring-primary-200"
            name="client-search"
            @input="handleSearchInput"
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
            class="w-full sm:w-52 py-2"
            name="sort-select"
            @update:model-value="filterClients"
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
    <UCard v-if="isFilterOpen" class="bg-white border border-gray-100 shadow-sm mt-2 relative z-10">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <UFormField id="date-added-filter" label="Date Added" name="date-added-filter">
          <USelect
            id="date-added-select"
            v-model="filters.dateAdded"
            :items="dateOptions"
            size="lg"
            placeholder="Any time"
            class="w-full py-2"
            name="date-added-select"
            @update:model-value="filterClients"
          />
        </UFormField>

        <UFormField id="has-orders-filter" label="Has Orders" name="has-orders-filter">
          <USelect
            id="has-orders-select"
            v-model="filters.hasOrders"
            :items="booleanOptions"
            size="lg"
            placeholder="All clients"
            class="w-full py-2"
            name="has-orders-select"
            @update:model-value="filterClients"
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

    <!-- Clients Table (desktop) / Cards (mobile) -->
    <UCard class="bg-white">
      <!-- Desktop Table View (hidden on mobile) -->
      <div class="hidden sm:block">
        <div v-if="isLoading" class="py-8 space-y-6">
          <USkeleton class="h-8 w-full" />
          <USkeleton v-for="i in 5" :key="i" class="h-12 w-full" />
        </div>

        <div v-else-if="paginatedClients.length === 0" class="py-12 text-center">
          <UIcon name="i-heroicons-user-plus" class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-semibold text-gray-900">No clients found</h3>
          <p class="mt-1 text-sm text-gray-500">
            {{
              search || isFilterApplied
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first client'
            }}
          </p>
          <div class="mt-6">
            <UButton
              v-if="!search && !isFilterApplied"
              :to="routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.CLIENTS.NEW]"
              color="primary"
            >
              Add client
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

        <table v-else class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div class="flex items-center cursor-pointer" @click="handleSort(column)">
                  {{ column.label }}
                  <UIcon
                    v-if="column.sortable"
                    :name="getSortIcon(column.key)"
                    class="ml-1 h-4 w-4"
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="client in paginatedClients" :key="client.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div
                    class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3"
                  >
                    <span class="text-primary-700 font-medium">{{ getInitials(client.name) }}</span>
                  </div>
                  <UButton
                    :to="getEditClientPath(client.id)"
                    color="gray"
                    variant="ghost"
                    icon="i-heroicons-pencil"
                    :ui="{ rounded: 'rounded-full' }"
                    class="p-2"
                  />
                  {{ client.name }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ client.phone }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ formatDate(client.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex space-x-2">
                  <UButton
                    :to="getViewClientPath(client.id)"
                    color="gray"
                    variant="ghost"
                    icon="i-heroicons-eye"
                    size="xs"
                  />
                  <UButton
                    :to="getEditClientPath(client.id)"
                    color="gray"
                    variant="ghost"
                    icon="i-heroicons-pencil-square"
                    size="xs"
                  />
                  <UButton
                    color="gray"
                    variant="ghost"
                    icon="i-heroicons-trash"
                    size="xs"
                    @click="confirmDelete(client)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View (shown only on mobile) -->
      <div class="sm:hidden space-y-5">
        <template v-if="!isLoading && paginatedClients.length > 0">
          <div
            v-for="client in paginatedClients"
            :key="client.id"
            class="bg-white rounded-xl overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg border border-gray-100"
          >
            <!-- Card header with gradient -->
            <div class="bg-white px-4 py-3 border-b border-gray-100">
              <div class="flex items-center">
                <div
                  class="w-12 h-12 rounded-full bg-gray-50 shadow-sm flex items-center justify-center mr-3 border border-gray-200"
                >
                  <span class="text-gray-700 font-semibold text-lg">{{
                    getInitials(client.name)
                  }}</span>
                </div>
                <div>
                  <NuxtLink
                    :to="getViewClientPath(client.id)"
                    class="font-semibold text-lg text-gray-800 hover:text-primary-700"
                  >
                    {{ client.name }}
                  </NuxtLink>
                  <div class="flex items-center text-sm text-gray-600">
                    <UIcon name="i-heroicons-phone" class="w-4 h-4 mr-1" />
                    <span>{{ client.phone }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card body -->
            <div class="px-4 py-3">
              <div class="flex items-center text-sm text-gray-600 mb-2">
                <UIcon name="i-heroicons-calendar" class="w-4 h-4 mr-2 text-gray-500" />
                <span>Added {{ formatDate(client.createdAt) }}</span>
              </div>

              <!-- Action buttons -->
              <div class="flex mt-4 pt-3 border-t border-gray-100">
                <UButton
                  :to="getViewClientPath(client.id)"
                  color="gray"
                  variant="ghost"
                  size="sm"
                  class="flex-1 mr-2"
                  icon="i-heroicons-eye"
                >
                  View
                </UButton>
                <UButton
                  :to="getEditClientPath(client.id)"
                  color="gray"
                  variant="ghost"
                  size="sm"
                  icon="i-heroicons-pencil-square"
                  class="mr-2"
                />
                <UButton
                  color="gray"
                  variant="ghost"
                  size="sm"
                  icon="i-heroicons-trash"
                  @click="confirmDelete(client)"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- Empty state for mobile -->
        <div v-else-if="!isLoading && filteredClients.length === 0" class="text-center py-8">
          <div
            class="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4"
          >
            <UIcon name="i-heroicons-user-plus" class="text-gray-400 text-xl" />
          </div>
          <h3 class="text-lg font-medium text-gray-800 mb-1">No clients found</h3>
          <p class="text-gray-500 text-sm mb-4">
            {{
              search || isFilterApplied
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first client'
            }}
          </p>
          <UButton
            v-if="!search && !isFilterApplied"
            :to="routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.CLIENTS.NEW]"
            color="primary"
            size="lg"
          >
            Add client
          </UButton>
          <UButton
v-else
color="gray"
variant="outline"
size="sm"
@click="resetFilters">
            Reset filters
          </UButton>
        </div>

        <!-- Loading state for mobile -->
        <template v-else>
          <div
            v-for="i in 3"
            :key="i"
            class="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 mb-4"
          >
            <!-- Shimmer header -->
            <div class="bg-white px-4 py-3 border-b border-gray-100">
              <div class="flex items-center">
                <div class="w-12 h-12 rounded-full bg-gray-200 animate-pulse mr-3" />
                <div class="space-y-2">
                  <div class="h-5 bg-gray-200 rounded animate-pulse w-36" />
                  <div class="h-4 bg-gray-200 rounded animate-pulse w-24" />
                </div>
              </div>
            </div>

            <!-- Shimmer body -->
            <div class="px-4 py-3">
              <div class="flex items-center mb-4">
                <div class="w-4 h-4 bg-gray-200 rounded animate-pulse mr-2" />
                <div class="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>

              <!-- Shimmer buttons -->
              <div class="flex pt-3 border-t border-gray-100">
                <div class="h-8 bg-gray-200 rounded animate-pulse flex-1 mr-2" />
                <div class="h-8 w-8 bg-gray-200 rounded animate-pulse mr-2" />
                <div class="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Pagination -->
      <template #footer>
        <div
          v-if="filteredClients.length > 0"
          class="flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <div class="text-sm text-gray-500 order-2 sm:order-1">
            Showing {{ Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems) }}-{{
              Math.min(currentPage * ITEMS_PER_PAGE, totalItems)
            }}
            of {{ totalItems }} clients
          </div>

          <!-- Custom pagination -->
          <div v-if="showPagination" class="flex items-center space-x-1 order-1 sm:order-2">
            <!-- Previous button -->
            <UButton
              variant="ghost"
              color="gray"
              :disabled="currentPage === 1"
              size="sm"
              icon="i-heroicons-chevron-left"
              class="rounded-lg"
              @click="currentPage > 1 && (currentPage--, fetchClients())"
            />

            <!-- First page -->
            <UButton
              variant="ghost"
              color="gray"
              :class="currentPage === 1 ? 'bg-primary-50 text-primary-700' : ''"
              size="sm"
              class="rounded-lg"
              @click="((currentPage = 1), fetchClients())"
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
              @click="((currentPage = page), fetchClients())"
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
              @click="((currentPage = pageCount), fetchClients())"
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
              @click="currentPage < pageCount && (currentPage++, fetchClients())"
            />
          </div>
        </div>
      </template>
    </UCard>

    <!-- Delete Confirmation Modal -->
    <DeleteModal
      v-model="isDeleteModalOpen"
      title="Delete Client"
      :message="`Are you sure you want to delete <strong>${clientToDelete?.name}</strong>? This action cannot be undone.`"
      :loading="isDeleting"
      @confirm="deleteClient"
    />
  </div>
</template>

<script setup lang="ts">
// Import stores and utilities
import { useClientStore } from '~/store/modules/client'
import { useAuthStore } from '~/store/modules/auth'
import { onUnmounted } from 'vue'

// Composable
const routes = useAppRoutes()
const _router = useRouter() // Prefix with underscore to indicate it's intentionally unused

// Constants
const _NEW_CLIENT_PATH = routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.CLIENTS.NEW] as string

// Type for route function with params
type RouteFunction = (params: { id: string }) => string

const getEditClientPath = (id: string): string =>
  (routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.CLIENTS.EDIT] as RouteFunction)({ id })

const getViewClientPath = (id: string): string =>
  (routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.CLIENTS.VIEW] as RouteFunction)({ id })

// Types
type Client = {
  id: string
  name: string
  email: string
  phone: string
  measurements: any[]
  orders: any[]
  createdAt: string
  updatedAt: string
}

// State
const search = ref('')
const currentPage = ref(1)
const searchTimeout = ref<NodeJS.Timeout | null>(null)
const isMounted = ref(false)
const isFilterOpen = ref(false)
const isDeleteModalOpen = ref(false)
const clientToDelete = ref<Client | null>(null)
const isLoading = ref(false)
const _error = ref<string | null>(null) // Prefix with underscore to indicate it's intentionally unused

// Initialize store
const clientStore = useClientStore()
const authStore = useAuthStore()

// Data
const filteredClients = ref<Client[]>([])

// Set page metadata
useHead({
  title: 'Clients',
})

// Table configuration
const columns = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    id: 'name',
  },
  {
    key: 'phone',
    label: 'Phone',
    sortable: true,
    id: 'phone',
  },
  {
    key: 'createdAt',
    label: 'Date Added',
    sortable: true,
    id: 'createdAt',
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    id: 'actions',
  },
]

// State management
const isDeleting = ref(false)
const totalItems = ref(0)
const totalPages = ref(0)

// Sort and filter options
const sortBy = ref('name-asc')
const sortOptions = [
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' },
  { label: 'Newest First', value: 'date-desc' },
  { label: 'Oldest First', value: 'date-asc' },
]

const filters = ref({
  dateAdded: null,
  hasMeasurements: null,
  hasOrders: null,
})

const dateOptions = [
  { label: 'Last 7 days', value: '7days' },
  { label: 'Last 30 days', value: '30days' },
  { label: 'Last 3 months', value: '3months' },
  { label: 'Last year', value: '1year' },
]

const booleanOptions = [
  { label: 'Yes', value: true },
  { label: 'No', value: false },
]

// Constants
const ITEMS_PER_PAGE = 10

// For debouncing search
const debouncedSearch = ref('')

// Handle debounced search
const handleSearchInput = () => {
  if (!isMounted.value) return

  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => {
    if (isMounted.value) {
      debouncedSearch.value = search.value
      filterClients()
    }
  }, 300)
}

// Computed properties
const pageCount = computed(() => {
  return totalPages.value
})

const paginatedClients = computed(() => {
  return filteredClients.value
})

const showPagination = computed(() => {
  return totalPages.value > 1
})

const isFilterApplied = computed(() => {
  return (
    filters.value.dateAdded !== null ||
    filters.value.hasMeasurements !== null ||
    filters.value.hasOrders !== null
  )
})

// Functions
const getInitials = name => {
  if (!name) return ''
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const filterClients = () => {
  // Reset to first page when filter changes
  currentPage.value = 1
  // Fetch data with new filters
  fetchClients()
}

const resetSearch = () => {
  // Clear any existing timeout
  if (searchTimeout.value) clearTimeout(searchTimeout.value)

  search.value = ''
  debouncedSearch.value = ''
  filterClients()
}

const resetFilters = () => {
  // Clear any existing timeout
  if (searchTimeout.value) clearTimeout(searchTimeout.value)

  search.value = ''
  debouncedSearch.value = ''
  filters.value = {
    hasMeasurements: null,
    hasOrders: null,
  }
  sortBy.value = 'name-asc'
  isFilterOpen.value = false
  filterClients()
}

const confirmDelete = client => {
  clientToDelete.value = client
  isDeleteModalOpen.value = true
}

const deleteClient = async () => {
  if (!clientToDelete.value) return

  isDeleting.value = true
  isLoading.value = true

  try {
    // Use $fetch directly for DELETE request
    await $fetch(`/api/clients/${clientToDelete.value.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    // Update the store
    clientStore.removeClient(clientToDelete.value.id)

    useToast().add({
      title: 'Success',
      description: 'Client deleted successfully',
      color: 'green',
    })

    // Refresh the clients list
    await fetchClients()
  } catch (err) {
    console.error('Error deleting client:', err)
    useToast().add({
      title: 'Error',
      description: err.data?.message || 'Failed to delete client. Please try again.',
      color: 'error',
    })
  } finally {
    isDeleting.value = false
    isLoading.value = false
    isDeleteModalOpen.value = false
    clientToDelete.value = null
  }
}

// // Component lifecycle hooks
// onMounted(() => {
//   isMounted.value = true
//   // Initial data fetch
//   fetchClients()
// })

onUnmounted(() => {
  isMounted.value = false
  // Clear any pending timeouts
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
})

// Function to fetch clients from the API
const fetchClients = async () => {
  try {
    isLoading.value = true
    _error.value = null

    // Destructure sort values but don't use them yet (prefix with underscore)
    const [_sortField, _sortOrder] = sortBy.value.split('-')

    // Create query parameters
    const query = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: ITEMS_PER_PAGE.toString(),
      search: search.value || '',
    }).toString()

    // Use useAsyncData for GET request
    const { data: response, error } = await useAsyncData(
      `clients-${currentPage.value}-${ITEMS_PER_PAGE}-${search.value}`,
      () =>
        $fetch(`/api/clients?${query}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        })
    )

    if (error.value) {
      throw new Error(error.value?.data?.message || 'Failed to load clients')
    }

    if (response.value) {
      // Update the store with the new data
      clientStore.setClients(response.value.data, response.value.total)

      // Update local pagination state
      totalItems.value = response.value.total
      totalPages.value = Math.ceil(totalItems.value / ITEMS_PER_PAGE)

      // Update filtered clients list
      filteredClients.value = response.value.data.map(client => formatClientData(client))
    }
  } catch (err) {
    console.error('Error fetching clients:', err)
    _error.value = err.message

    useToast().add({
      title: 'Error',
      description: _error.value || 'Failed to load clients. Please refresh the page.',
      color: 'error',
    })

    filteredClients.value = []
  } finally {
    isLoading.value = false
  }
}

const getVisiblePageNumbers = () => {
  const visiblePages = []
  const totalPages = pageCount.value
  const current = currentPage.value

  if (totalPages <= 5) {
    for (let i = 2; i <= totalPages - 1; i++) {
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

// Helper function to format client data
const formatClientData = client => {
  // Add debugging to see what data we're receiving
  console.log('Formatting client data:', client)

  // Make sure we have a valid date for createdAt
  let createdAt = client.createdAt

  // Only try to parse the date if it's not already an ISO string
  if (createdAt && typeof createdAt === 'string' && !createdAt.includes('T')) {
    try {
      createdAt = new Date(createdAt).toISOString()
    } catch (e) {
      console.error('Error formatting date:', e)
      createdAt = new Date().toISOString() // Fallback to current date
    }
  }

  // Make sure all required fields exist
  const formattedClient = {
    id: client.id || `mock-${Math.random().toString(36).substring(2, 9)}`,
    name: client.name || 'Unknown Client',
    email: client.email || '',
    phone: client.phone || '',
    address: client.address || '',
    createdAt: createdAt,
    measurementsCount: client.measurementsCount || 0,
    ordersCount: client.ordersCount || 0,
    ...client, // Keep any other properties
  }

  console.log('Formatted client:', formattedClient)
  return formattedClient
}

// Handle sort by clicking on column headers
const handleSort = column => {
  if (!column.sortable) return

  const field = column.key
  // If already sorting by this field, toggle direction
  if (sortBy.value.startsWith(field)) {
    const direction = sortBy.value.endsWith('-asc') ? 'desc' : 'asc'
    sortBy.value = `${field}-${direction}`
  } else {
    // Default to ascending for new sort field
    sortBy.value = `${field}-asc`
  }

  filterClients()
}

// Get the appropriate sort icon based on current sort state
const getSortIcon = columnKey => {
  if (!sortBy.value.startsWith(columnKey)) {
    return 'i-heroicons-arrows-up-down'
  }

  return sortBy.value.endsWith('-asc') ? 'i-heroicons-arrow-up' : 'i-heroicons-arrow-down'
}
</script>
