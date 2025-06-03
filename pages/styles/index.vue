<template>
  <div class="space-y-8">
    <!-- Header with animated underline effect -->
    <PageHeader
      title="Styles"
      :primary-action="{
        label: 'Add Style',
        icon: 'i-heroicons-plus',
        to: NEW_STYLE_PATH,
      }"
    />

    <!-- Search and Filter with glassy effect -->
    <UCard class="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
      <div class="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4 items-center">
        <div class="relative w-full sm:w-80 group">
          <UInput
            id="style-search"
            v-model="search"
            placeholder="Search styles..."
            icon="i-heroicons-magnifying-glass"
            size="lg"
            class="w-full focus-within:ring-2 ring-primary-200"
            @input="filterStyles"
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
            id="style-sort"
            v-model="sortBy"
            :items="sortOptions"
            placeholder="Sort by"
            size="lg"
            class="w-full sm:w-52"
            @update:model-value="filterStyles"
          />
        </div>
      </div>
    </UCard>

    <!-- Content area with conditional rendering -->
    <div>
      <!-- Debug info - hidden in production -->
      <pre v-if="false" class="text-xs p-2 bg-gray-100 mb-4 overflow-auto">
        isLoading: {{ isLoading }}
        styles count: {{ filteredStyles?.length || 0 }}
        pagination: {{ pagination }}
        error: {{ styleStore.error }}
      </pre>

      <!-- Loading State - only shown when loading -->
      <template v-if="isLoading">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          <UCard v-for="i in 6" :key="i" class="bg-white overflow-hidden border border-gray-100">
            <div class="aspect-w-3 aspect-h-4 bg-gray-200 animate-pulse" />
            <div class="p-3 sm:p-5 space-y-2 sm:space-y-3">
              <div class="flex items-center justify-between">
                <div class="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-3/4" />
                <div class="h-4 sm:h-5 bg-gray-200 rounded-full animate-pulse w-12 sm:w-16" />
              </div>
              <div class="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-full" />
              <div class="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-2/3" />
            </div>
            <template #footer>
              <div class="flex justify-between items-center px-3 pb-2 sm:p-5">
                <div class="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                <div class="flex space-x-1 sm:space-x-2">
                  <div class="h-6 w-6 sm:h-8 sm:w-8 bg-gray-200 rounded animate-pulse" />
                  <div class="h-6 w-6 sm:h-8 sm:w-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </template>
          </UCard>
        </div>
      </template>

      <!-- Empty State - shown when not loading and no data -->
      <template v-else-if="!filteredStyles || filteredStyles.length === 0">
        <UCard class="bg-white py-8 sm:py-16 border border-dashed border-gray-300">
          <div class="text-center max-w-md mx-auto px-4 sm:px-0">
            <div
              class="bg-gray-50 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6"
            >
              <UIcon name="i-heroicons-swatch" class="text-gray-400 text-3xl sm:text-4xl" />
            </div>
            <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
              No styles found
            </h3>
            <p class="text-gray-600 mb-4 sm:mb-6 max-w-xs mx-auto text-sm sm:text-base">
              {{
                search
                  ? 'Try adjusting your search or clear filters to see all styles'
                  : 'Get started by adding your first style to your catalog'
              }}
            </p>
            <UButton
v-if="!search"
to="/styles/new"
color="primary"
class="px-4 sm:px-6 py-2">
              Create Your First Style
            </UButton>
            <UButton
              v-else
              color="gray"
              variant="outline"
              icon="i-heroicons-arrow-path"
              class="px-4 sm:px-6"
              @click="resetSearch"
            >
              Reset Filters
            </UButton>
          </div>
        </UCard>
      </template>

      <!-- Styles Grid - shown when not loading and has data -->
      <template v-else-if="filteredStyles && filteredStyles.length > 0">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          <UCard
            v-for="style in filteredStyles"
            :key="style.id"
            class="bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group flex flex-col"
          >
            <div class="aspect-w-3 aspect-h-4 bg-gray-100 overflow-hidden flex-grow rounded-md">
              <NuxtImg
                v-if="style.imageUrl"
                :src="style.imageUrl"
                :alt="style.name"
                placeholder
                class="w-full h-full object-contain transition-transform duration-500 p-2 rounded-md"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
              >
                <UIcon name="i-heroicons-squares-2x2" class="text-gray-400 text-3xl sm:text-5xl" />
              </div>
            </div>

            <div class="pt-3">
              <div class="flex items-center justify-between">
                <h3
                  class="text-base sm:text-lg font-semibold text-gray-800 group-hover:text-primary-600 transition-colors truncate"
                >
                  {{ style.name }}
                </h3>
                <UTooltip text="View Details">
                  <UButton
                    color="gray"
                    variant="ghost"
                    icon="i-heroicons-eye"
                    size="2xs"
                    :to="`/styles/${style.id}/detail`"
                    class="hover:bg-gray-100"
                  />
                </UTooltip>
              </div>
            </div>

            <template #footer>
              <div class="flex justify-between items-center p-0 transition-colors">
                <span class="text-xxs sm:text-xs text-gray-500 flex items-center">
                  {{ formatDate(style.createdAt) }}
                </span>
                <div class="flex space-x-1">
                  <UTooltip text="Edit Style">
                    <UButton
                      color="primary"
                      variant="ghost"
                      icon="i-heroicons-pencil-square"
                      size="2xs"
                      :to="getEditStylePath(style.id)"
                      class="hover:bg-primary-100"
                    />
                  </UTooltip>
                  <UTooltip text="Delete Style">
                    <UButton
                      color="red"
                      variant="ghost"
                      icon="i-heroicons-trash"
                      size="2xs"
                      class="hover:bg-red-100"
                      @click="confirmDelete(style)"
                    />
                  </UTooltip>
                </div>
              </div>
            </template>
          </UCard>
        </div>

        <!-- Pagination Controls -->
        <div v-if="pagination.totalPages > 1" class="flex justify-center mt-8">
          <UPagination
            v-model="currentPage"
            :page-count="pagination.totalPages"
            :total="pagination.total"
            :ui="{
              wrapper: 'flex items-center gap-1',
              item: {
                base: 'h-9 w-9 text-sm flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm',
                active: 'bg-primary-50 border-primary-500 text-primary-700 font-semibold',
                inactive: 'hover:bg-gray-50',
              },
            }"
            @change="handlePageChange"
          />
        </div>
      </template>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteModal
      v-model="showDeleteModal"
      title="Delete Style"
      :message="`Are you sure you want to delete <strong>${styleToDelete?.name}</strong>? This action cannot be undone and will permanently remove this style from your catalog.`"
      :loading="isDeleting"
      @confirm="deleteStyle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useAuthStore } from '~/store/modules/auth'
import { useStyleStore } from '~/store/modules/style'
import type { Style } from '~/types/style'

// Composable
const routes = useAppRoutes()
const authStore = useAuthStore()
const styleStore = useStyleStore()

// Constants
const NEW_STYLE_PATH = routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.STYLES.NEW] as string
const getEditStylePath = (id: string): string =>
  (
    routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.STYLES.EDIT] as (params: {
      id: string
    }) => string
  )({ id })

// Set page metadata
useHead({
  title: 'Style Catalog - QuickMeazure',
  meta: [
    { name: 'description', content: 'Browse and manage your clothing design styles and patterns' },
  ],
})

// State
const search = ref('')
const sortBy = ref('newest')
const showDeleteModal = ref(false)
const styleToDelete = ref<{ id: string; name: string } | null>(null)
const isDeleting = ref(false)
const currentPage = ref(1)

// Local state
const isLoading = ref(false)
const styles = ref<Style[]>([])
const totalCount = ref(0)
const itemsPerPage = ref(12)

// Computed
const filteredStyles = computed(() => styles.value)
const pagination = computed(() => ({
  total: totalCount.value,
  page: currentPage.value,
  limit: itemsPerPage.value,
  totalPages: Math.ceil(totalCount.value / itemsPerPage.value) || 1,
}))

// Sort options
const sortOptions = [
  { label: 'Newest first', value: 'newest', icon: 'i-heroicons-arrow-up' },
  { label: 'Oldest first', value: 'oldest', icon: 'i-heroicons-arrow-down' },
  { label: 'Name (A-Z)', value: 'name-asc', icon: 'i-heroicons-bars-arrow-down' },
  { label: 'Name (Z-A)', value: 'name-desc', icon: 'i-heroicons-bars-arrow-up' },
]

// Debug method to log current state
const _logState = () => {
  console.log('Current state:', {
    isLoading: isLoading.value,
    filteredStyles: filteredStyles.value.length,
    paginationTotal: pagination.value.total,
    currentPage: currentPage.value,
  })
}

// Load data
const loadStyles = async () => {
  try {
    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to view styles',
        color: 'warning',
      })
      navigateTo('/auth/login')
      return
    }

    isLoading.value = true

    // Build filters
    const queryParams = new URLSearchParams()

    // Add filters to query params
    queryParams.append('page', currentPage.value.toString())
    queryParams.append('limit', itemsPerPage.value.toString())

    if (search.value.trim()) {
      queryParams.append('search', search.value.trim())
    }

    const sortField =
      sortBy.value === 'name-asc' || sortBy.value === 'name-desc' ? 'name' : 'createdAt'
    queryParams.append('sortField', sortField)

    const sortOrder = sortBy.value.endsWith('asc') ? 'asc' : 'desc'
    queryParams.append('sortOrder', sortOrder)

    // Fetch styles directly using useAsyncData
    const { data, error } = await useAsyncData(`styles-${queryParams.toString()}`, () =>
      $fetch(`/api/styles?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
      })
    )

    if (error.value) {
      throw error.value
    }

    styles.value = data.value?.data || []
    totalCount.value = data.value?.total || 0
  } catch (error) {
    console.error('Error loading styles:', error)
    useToast().add({
      title: 'Error',
      description:
        error.data?.message || error.message || 'Failed to load styles. Please try again.',
      color: 'error',
    })
  } finally {
    isLoading.value = false
  }
}

// Handle page change
const handlePageChange = page => {
  // Don't trigger if already loading
  if (isLoading.value) return

  currentPage.value = page
  loadStyles()

  // Scroll to top when page changes
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Filter styles
const filterStyles = () => {
  currentPage.value = 1
  loadStyles()
}

// Watch for auth state changes
watch(
  () => authStore.isLoggedIn,
  isLoggedIn => {
    if (isLoggedIn) {
      loadStyles()
    } else {
      styles.value = []
      totalCount.value = 0
    }
  }
)

// Reset search
const resetSearch = () => {
  // Don't trigger if already loading
  if (isLoading.value) return

  search.value = ''
  filterStyles()
}

// Format date
const formatDate = timestamp => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

// Confirm delete
const confirmDelete = style => {
  styleToDelete.value = style
  showDeleteModal.value = true
}

// Delete style
const deleteStyle = async () => {
  if (!styleToDelete.value) return

  isDeleting.value = true

  try {
    // Delete the style directly using $fetch
    await $fetch(`/api/styles/${styleToDelete.value.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    // Show success message
    useToast().add({
      title: 'Success',
      description: 'Style deleted successfully',
      color: 'primary',
    })

    // Reset delete state
    showDeleteModal.value = false
    styleToDelete.value = null

    // Reload styles to update the list if needed
    if (styles.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
    await loadStyles()
  } catch (error) {
    console.error('Error deleting style:', error)
    useToast().add({
      title: 'Error',
      description:
        error.data?.message || error.message || 'Failed to delete style. Please try again.',
      color: 'error',
    })
  } finally {
    isDeleting.value = false
  }
}

// onMounted(() => {
//   loadStyles()
// })

// Clean up when the component is unmounted
onUnmounted(() => {
  // Reset local state if needed
  styles.value = []
  totalCount.value = 0
})
</script>
