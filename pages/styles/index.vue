<template>
  <div>
    <BaseListPage
      title="Styles"
      page-type="styles"
      :primary-action="{
        label: 'Add Style',
        to: ROUTE_NAMES.DASHBOARD.STYLES.NEW,
      }"
      :show-search="true"
      :initial-search="search"
      :sort-options="sortOptions"
      :current-page="currentPage"
      :page-size="itemsPerPage"
      :total-items="filteredStyles.length"
      :is-loading="isLoading"
      :has-items="filteredStyles.length > 0"
      :has-active-filters="hasActiveFilters"
      empty-state-icon="i-heroicons-inbox"
      :empty-state-title="search || hasActiveFilters ? 'No styles found' : 'No styles yet'"
      :empty-state-description="
        search || hasActiveFilters
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'Get started by adding your first style.'
      "
      :empty-state-action="
        !search && !hasActiveFilters
          ? {
              label: 'Add Style',
              to: ROUTE_NAMES.DASHBOARD.STYLES.NEW,
              icon: 'i-heroicons-plus',
            }
          : null
      "
      :show-delete-modal="showDeleteModal"
      :item-to-delete="styleToDelete"
      @update:current-page="handlePageChange"
      @search="handleSearch"
      @sort="handleSort"
      @reset-filters="resetFilters"
      @delete-confirm="deleteStyle"
    >
      <!-- Filters slot -->
      <template #filters>
        <USelect
          v-model="sortBy"
          :items="sortOptions"
          placeholder="Sort by"
          size="lg"
          class="w-full sm:w-52"
          @update:model-value="filterStyles"
        />
      </template>

      <!-- Default slot for content -->
      <template #default>
        <!-- Styles grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          <UCard
            v-for="style in paginatedStyles"
            :key="style.id"
            class="bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group flex flex-col"
            :ui="{
              base: 'h-full flex flex-col',
              body: 'flex-1',
              footer: 'mt-auto',
            }"
          >
            <!-- Style Image -->
            <div class="aspect-w-1 aspect-h-1 w-full bg-gray-50 rounded-lg overflow-hidden mb-4">
              <img
                v-if="style.image"
                :src="style.image"
                :alt="style.name"
                class="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400"
              >
                <UIcon name="i-heroicons-photo" class="w-12 h-12" />
              </div>
            </div>

            <!-- Style Info -->
            <div class="flex-1">
              <div class="flex items-start justify-between">
                <h3 class="text-lg font-medium text-gray-900 line-clamp-2">
                  {{ style.name }}
                </h3>
                <UBadge
                  :color="style.isActive ? 'green' : 'gray'"
                  variant="subtle"
                  size="sm"
                  class="ml-2 flex-shrink-0"
                >
                  {{ style.isActive ? 'Active' : 'Inactive' }}
                </UBadge>
              </div>

              <p class="mt-1 text-sm text-gray-500 line-clamp-2">
                {{ style.description || 'No description' }}
              </p>

              <div class="mt-4 flex items-center justify-between">
                <span class="text-sm font-medium text-gray-900">
                  {{ formatCurrency(style.price) }}
                </span>
                <span class="text-sm text-gray-500">
                  {{ style.measurements?.length || 0 }} measurements
                </span>
              </div>
            </div>

            <!-- Actions -->
            <template #footer>
              <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                <UButton
                  color="gray"
                  variant="ghost"
                  size="sm"
                  :to="getEditStylePath(style.id)"
                  icon="i-heroicons-pencil"
                  aria-label="Edit style"
                >
                  Edit
                </UButton>
                <div class="flex space-x-2">
                  <UButton
                    color="red"
                    variant="ghost"
                    size="sm"
                    icon="i-heroicons-trash"
                    aria-label="Delete style"
                    @click="confirmDelete(style)"
                  />
                  <UButton
                    color="primary"
                    size="sm"
                    :to="`/styles/${style.id}`"
                    icon="i-heroicons-arrow-right"
                    aria-label="View style"
                  >
                    View
                  </UButton>
                </div>
              </div>
            </template>
          </UCard>
        </div>
      </template>
    </BaseListPage>

    <!-- Delete Confirmation Modal -->
    <DeleteModal
      v-model:model-value="showDeleteModal"
      :item-type="'style'"
      :item-name="styleToDelete?.name || 'this style'"
      @confirm="deleteStyle"
      @update:model-value="val => (showDeleteModal = val)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Style } from '~/types/style'
import { useHead, useToast } from '#imports'
import { ROUTE_NAMES } from '~/constants/routes'

// Route helper
const getEditStylePath = (id: string): string => {
  return `/styles/${id}/edit`
}

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
const hasActiveFilters = computed(() => {
  return !!search.value || sortBy.value !== 'newest'
})
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
    // Check if user is authenticated (commented out for now)
    // const authStore = useAuthStore()
    // if (!authStore.isLoggedIn) {
    //   useToast().add({
    //     title: 'Authentication required',
    //     description: 'Please log in to view styles',
    //     color: 'warning',
    //   })
    //   navigateTo('/auth/login')
    //   return
    // }

    isLoading.value = true
    // Add your data loading logic here
    // await styleStore.fetchStyles({ /* params */ })
  } catch (error) {
    console.error('Error loading styles:', error)
    useToast().add({
      title: 'Error',
      description: 'Failed to load styles',
      color: 'error',
    })
  } finally {
    isLoading.value = false
  }
}

// Methods
const handleSearch = (value: string) => {
  search.value = value
  filterStyles()
}

const handleSort = (value: string) => {
  sortBy.value = value
  filterStyles()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  // Add logic to fetch data for the new page if needed
}

const filterStyles = () => {
  currentPage.value = 1
  // Add filtering logic here
}

const resetFilters = () => {
  search.value = ''
  sortBy.value = 'name-asc'
  filterStyles()
}

const confirmDelete = (style: Style) => {
  styleToDelete.value = style
  showDeleteModal.value = true
}

const deleteStyle = async () => {
  if (!styleToDelete.value) return

  try {
    await styleStore.deleteStyle(styleToDelete.value.id)
    // Add success notification
    useToast().add({
      title: 'Success',
      description: 'Style deleted successfully',
      icon: 'i-heroicons-check-circle',
      color: 'green',
    })
    // Refresh data
    await loadStyles()
  } catch (error) {
    console.error('Error deleting style:', error)
    // Add error notification
    useToast().add({
      title: 'Error',
      description: 'Failed to delete style',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red',
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
