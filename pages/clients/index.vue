<template>
  <div>
    <BaseListPage
      title="Clients"
      page-type="clients"
      :primary-action="{
        label: 'Add Client',
        icon: 'i-heroicons-plus',
        to: '/clients/new',
      }"
      :show-search="true"
      :initial-search="search"
      :sort-options="sortOptions"
      :current-page="currentPage"
      :page-size="ITEMS_PER_PAGE"
      :total-count="localTotalCount"
      :is-loading="isLoading"
      :has-items="paginatedClients.length > 0"
      :has-active-filters="!!hasActiveFilters"
      empty-state-icon="i-heroicons-user-group"
      :empty-state-title="search || hasActiveFilters ? 'No clients found' : 'No clients yet'"
      :empty-state-description="
        search || hasActiveFilters
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'Get started by adding your first client.'
      "
      :empty-state-action="
        !search && !hasActiveFilters
          ? {
              label: 'Add Client',
              to: ROUTE_NAMES.DASHBOARD.CLIENTS.NEW,
              icon: 'i-heroicons-plus',
            }
          : undefined
      "
      :show-delete-modal="isDeleteModalOpen"
      :item-to-delete="clientToDelete || undefined"
      @update:current-page="handlePageChange"
      @search="handleSearch"
      @sort="handleSort"
      @reset-filters="resetFilters"
      @delete-confirm="deleteClient"
    >
      <!-- Filters slot -->
      <template #filters>
        <USelect
          v-model="sortBy"
          :options="sortOptions"
          option-attribute="label"
          placeholder="Sort by"
          size="lg"
          class="w-full sm:w-52"
        />

        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-funnel"
          class="flex-shrink-0"
          :class="{ 'text-primary-600 bg-primary-50': isFilterOpen }"
          @click="isFilterOpen = !isFilterOpen"
        >
          <span class="sr-only">Filters</span>
          <span
            v-if="hasActiveFilters"
            class="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full"
          ></span>
        </UButton>
      </template>

      <!-- Filter panel -->
      <template v-if="isFilterOpen" #filter-panel>
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mt-2"
        >
          <UFormField label="Status" name="status">
            <USelect
              v-model="filters.status"
              :options="statusOptions"
              option-attribute="label"
              placeholder="Filter by status"
              @update:model-value="() => refresh()"
            />
          </UFormField>
        </div>
      </template>

      <!-- Main content -->
      <template #default>
        <!-- Desktop Table View (hidden on mobile) -->
        <div class="hidden sm:block">
          <div>
            <!-- Table content will be shown when not loading and has items -->
            <div class="rounded-lg border border-gray-200 overflow-hidden">
              <UTable
                :data="paginatedClients"
                :columns="tableColumns"
                :loading="isLoading"
                :empty-state="{
                  icon: 'i-heroicons-user-group',
                  label: 'No clients found',
                  description:
                    search || hasActiveFilters
                      ? 'Try adjusting your search or filters to find what you\'re looking for.'
                      : 'Get started by adding your first client.',
                }"
                class="w-full"
              >
                <!-- Name Column -->
                <template #name-data="{ row }">
                  <div class="flex items-center">
                    <UAvatar
                      :alt="row.original.name || 'Unnamed Client'"
                      size="md"
                      class="mr-3"
                      :text="getInitials(row.original.name)"
                      :src="null"
                    />
                    <div>
                      <div class="font-medium text-gray-900">
                        {{ row.original.name || 'Unnamed Client' }}
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Boolean Columns -->
                <template #hasOrders-data="{ row }">
                  <UIcon
                    :name="
                      row.original.hasOrders ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'
                    "
                    :class="[
                      'w-5 h-5',
                      row.original.hasOrders ? 'text-green-500' : 'text-gray-300',
                    ]"
                  />
                </template>
              </UTable>
            </div>

            <!-- Pagination -->
            <div v-if="localTotalCount > ITEMS_PER_PAGE" class="px-4 py-3 border-t border-gray-200">
              <UPagination
                v-model:page="currentPage"
                :total="localTotalCount"
                :items-per-page="ITEMS_PER_PAGE"
                @update:page="handlePageChange"
              >
                <template #prev>
                  <UButton
                    icon="i-heroicons-arrow-small-left"
                    color="neutral"
                    :disabled="currentPage <= 1"
                    :ui="{ base: 'rounded-full' }"
                    class="mr-2"
                    @click="handlePageChange(currentPage - 1)"
                  />
                </template>

                <template #next>
                  <UButton
                    icon="i-heroicons-arrow-small-right"
                    color="neutral"
                    :disabled="currentPage >= Math.ceil(localTotalCount / ITEMS_PER_PAGE)"
                    :ui="{
                      base: 'rounded-full',
                    }"
                    class="ml-2"
                    @click="handlePageChange(currentPage + 1)"
                  />
                </template>
              </UPagination>
            </div>
          </div>
        </div>

        <!-- Mobile Card View (shown on mobile) -->
        <div class="sm:hidden space-y-4">
          <div v-if="isLoading" class="p-8 text-center">
            <UIcon
              name="i-heroicons-arrow-path"
              class="w-8 h-8 mx-auto animate-spin text-primary-500"
            />
            <p class="mt-2 text-gray-600">Loading clients...</p>
          </div>
          <div v-else-if="paginatedClients.length === 0" class="w-full">
            <EmptyState
              icon="i-heroicons-user-group"
              :title="search || hasActiveFilters ? 'No matching clients' : 'No clients found'"
              :description="
                search || hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first client'
              "
              :primary-action="{
                label: 'Add Client',
                to: '/clients/new',
                icon: 'i-heroicons-plus',
              }"
            />
          </div>
          <template v-else>
            <div
              v-for="client in paginatedClients"
              :key="client.id"
              class="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
            >
              <div class="flex items-start">
                <UAvatar
                  :alt="client.name"
                  size="lg"
                  class="mr-3"
                  :text="getInitials(client.name)"
                  :src="null"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-medium text-gray-900 truncate">
                      {{ client.name || 'Unnamed Client' }}
                    </h3>
                    <UBadge
                      :label="(client as any).status || 'active'"
                      :color="
                        ((client as any).status || 'active') === 'active'
                          ? 'primary'
                          : ((client as any).status || 'active') === 'pending'
                            ? 'warning'
                            : 'neutral'
                      "
                      variant="subtle"
                      size="sm"
                      class="capitalize ml-2"
                    />
                  </div>
                  <p class="text-sm text-gray-500 truncate">{{ client.email }}</p>
                  <p class="text-sm text-gray-500">{{ client.phone }}</p>
                  <div class="flex justify-end mt-3 space-x-2">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      icon="i-heroicons-pencil"
                      :to="getEditClientPath(client.id)"
                      class="p-1.5"
                    />
                    <UButton
                      class="p-1.5"
                      color="error"
                      variant="ghost"
                      size="sm"
                      icon="i-heroicons-trash"
                      @click="confirmDelete(client)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>
    </BaseListPage>

    <!-- Delete Confirmation Modal -->
    <DeleteModal
      v-model:model-value="isDeleteModalOpen"
      title="Delete Client"
      :loading="_isDeleting"
      @confirm="deleteClient"
    >
      <p class="text-gray-700 dark:text-gray-300">
        Are you sure you want to delete
        <span class="font-semibold">{{ clientToDelete?.name || 'this client' }}</span
        >? This action cannot be undone.
      </p>
    </DeleteModal>
  </div>
</template>

<script setup lang="ts">
// Import stores and utilities
import { useClientStore } from '~/store/modules/client'
import { useAuthStore } from '~/store/modules/auth'
import { ref, computed, onMounted, watch, h, resolveComponent } from 'vue'
import { useRoute, useRouter, navigateTo } from '#imports'
import { ROUTE_NAMES } from '../../constants/routes'
import type { Client } from '../../types/client'

// Resolve UI components
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UButton = resolveComponent('UButton')
const UAvatar = resolveComponent('UAvatar')

// Initialize router and route
const router = useRouter()
const route = useRoute()

// Initialize stores
const clientStore = useClientStore()
const authStore = useAuthStore()

// Local state
const search = ref('')
const currentPage = ref(1)
const isFilterOpen = ref(false)
const isDeleteModalOpen = ref(false)
const clientToDelete = ref<Client | null>(null)
const isMounted = ref(false)

// Set isMounted to true when component is mounted
onMounted(() => {
  isMounted.value = true
})
const _isDeleting = ref(false) // Prefix with _ to indicate it's intentionally unused for now
const sortBy = ref('name-asc')
const localClients = ref<Client[]>([])
const localTotalCount = ref(0)

// Route helpers
const getEditClientPath = (id: number) => `/clients/${id}/edit`
const getViewClientPath = (id: number) => `/clients/${id}`

// Constants
const ITEMS_PER_PAGE = 10

// Filters
const filters = ref({
  status: 'all',
  hasOrders: null as boolean | null,
  createdAfter: null as string | null,
})

// Fetch clients using useAsyncData
const {
  pending: isLoading,
  error: fetchError,
  refresh,
} = useAsyncData(
  'clients',
  async () => {
    try {
      console.log('Fetching clients with params:', {
        page: currentPage.value,
        limit: ITEMS_PER_PAGE,
        search: search.value,
        status: filters.value.status,
        sortBy: sortBy.value,
      })

      // Parse sortBy value to extract field and order
      const [sortField, sortOrder] = sortBy.value.split('-')

      const { data, error } = await useFetch<{
        data: Client[]
        pagination: {
          total: number
          page: number
          limit: number
          totalPages: number
          hasNextPage: boolean
          hasPrevPage: boolean
        }
      }>('/api/clients', {
        params: {
          page: currentPage.value,
          limit: ITEMS_PER_PAGE,
          search: search.value,
          sortField: sortField || 'name',
          sortOrder: sortOrder || 'asc',

          hasOrders: filters.value.hasOrders,
        },
        headers: {
          ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
        },
      })

      console.log('Raw API Response:', data.value)

      if (error.value) {
        console.error('API Error:', error.value)
        throw error.value
      }

      if (!data.value) {
        console.warn('No data received from API')
        return []
      }

      // Extract data from the API response structure: {data: [...], pagination: {...}}
      const apiResponse = data.value
      const clientsData = apiResponse.data || []
      const total = apiResponse.pagination?.total || 0

      console.log('Processed clients data:', clientsData)
      console.log('Total count:', total)

      // Update local refs
      localClients.value = Array.isArray(clientsData)
        ? clientsData.map(client => ({
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            address: client.address,
            notes: client.notes,

            hasOrders: Boolean(client.hasOrders),
            createdAt: client.createdAt,
            userId: client.userId,
          }))
        : []
      localTotalCount.value = typeof total === 'number' ? total : 0

      // Also update the store
      clientStore.setClients(localClients.value as Client[], localTotalCount.value)

      return clientsData
    } catch (error) {
      console.error('Error in clients data processing:', error)
      toast.add({
        title: 'Error',
        description: 'Failed to load clients. Please try again.',
        color: 'error',
      })
      return []
    }
  },
  {
    server: true,
    watch: [
      () => currentPage.value,
      () => search.value,
      () => filters.value.status,
      () => sortBy.value,
    ],
  }
)

// Initialize toast
const toast = useToast()

// Watch for fetch errors
watch(fetchError, error => {
  if (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to load clients. Please try again.',
      color: 'error',
    })
  }
})

// Sort options
const sortOptions = [
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' },
  { label: 'Newest First', value: 'createdAt-desc' },
  { label: 'Oldest First', value: 'createdAt-asc' },
  { label: 'Most Orders', value: 'orderCount-desc' },
  { label: 'Highest Spending', value: 'totalSpent-desc' },
]

// Status options
const statusOptions = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

// Add missing totalCount computed property
const totalCount = computed(() => localTotalCount.value)

// Total number of items
const totalItems = computed(() => totalCount.value)
const _pageCount = computed(() => Math.ceil(totalItems.value / ITEMS_PER_PAGE)) // Prefix with _ to indicate unused
const hasActiveFilters = computed(() => {
  return (
    search.value ||
    filters.value.status !== 'all' ||
    filters.value.hasOrders !== null ||
    filters.value.createdAfter !== null
  )
})

// Handle search
const handleSearch = (query: string) => {
  search.value = query
  currentPage.value = 1
  refresh()
}

// Handle sort
const handleSort = (option: { value: string }) => {
  sortBy.value = option.value
  refresh()
}

// Handle page change
const handlePageChange = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Reset all filters
const resetFilters = () => {
  filters.value = {
    status: 'all', // Change from '' to 'all'
    hasOrders: null,

    createdAfter: null,
  }
  search.value = ''
  sortBy.value = 'name-asc' // Change from 'name:asc' to 'name-asc'
  currentPage.value = 1
  refresh()
}

// Delete client
const deleteClient = async () => {
  if (!clientToDelete.value) return

  _isDeleting.value = true

  // Change _toast.add to toast.add in both places:
  try {
    await clientStore.removeClient(clientToDelete.value.id)
    toast.add({
      title: 'Success',
      description: 'Client deleted successfully',
      color: 'primary',
    })
    await refresh()
  } catch (error) {
    console.error('Error deleting client:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to delete client. Please try again.',
      color: 'error',
    })
  } finally {
    _isDeleting.value = false
    isDeleteModalOpen.value = false
    clientToDelete.value = null
  }
}

// Confirm delete
const confirmDelete = (client: Client) => {
  clientToDelete.value = client
  isDeleteModalOpen.value = true
}

// Computed property for filtered clients
// Since the API handles filtering, sorting, and pagination, we just return the local clients
const filteredClients = computed<Client[]>(() => {
  console.log('Computing filteredClients, clients:', localClients.value)
  return localClients.value || []
})

// Computed property for paginated clients
// Since the API handles pagination, we just return the filtered clients directly
const paginatedClients = computed<Client[]>(() => {
  console.log('Returning paginated clients:', filteredClients.value)
  return filteredClients.value
})

// Table columns
interface TableColumn<T> {
  accessorKey?: keyof T
  id?: string
  header: string
  enableSorting: boolean
  cell?: (props: { row: { original: T } }) => any
  meta?: {
    class?: {
      th?: string
      td?: string
    }
  }
}

const tableColumns: TableColumn<Client>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    enableSorting: false,
  },
  {
    accessorKey: 'hasOrders',
    header: 'Has Orders',
    enableSorting: true,
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'flex justify-center' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'start',
            },
            items: [
              {
                type: 'label',
                label: 'Actions',
              },
              {
                label: 'View',
                icon: 'i-heroicons-eye',
                onSelect: () => navigateTo(getViewClientPath(row.original.id)),
              },
              {
                label: 'Edit',
                icon: 'i-heroicons-pencil',
                onSelect: () => navigateTo(getEditClientPath(row.original.id)),
              },
              {
                type: 'separator',
              },
              {
                label: 'Delete',
                icon: 'i-heroicons-trash',
                color: 'error',
                onSelect: () => confirmDelete(row.original),
              },
            ],
            'aria-label': 'Actions dropdown',
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              'aria-label': 'Actions dropdown',
            })
        )
      )
    },
    meta: {
      class: { th: 'text-center', td: 'text-center' },
    },
  },
]

// Set page title
useHead({
  title: 'Clients',
})

// Watch for route changes
watch(
  () => route.query,
  newQuery => {
    if (newQuery.page) {
      const page = parseInt(newQuery.page as string, 10)
      if (!isNaN(page) && page !== currentPage.value) {
        currentPage.value = page
      }
    }
  },
  { immediate: true }
)

// Watch for page changes to update URL
watch(
  () => currentPage.value,
  newPage => {
    const query = { ...route.query, page: newPage > 1 ? newPage : undefined }
    router.replace({ query })
  }
)

// Function to get initials from name
const getInitials = (name: string) => {
  if (!name) return 'UC'

  const names = name.split(' ')
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase()
  }

  return (names[0][0] + names[names.length - 1][0]).toUpperCase()
}
</script>
