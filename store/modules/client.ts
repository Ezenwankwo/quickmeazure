import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Client, ClientFilterOptions, ClientStats } from '~/types/client'
import { API_ENDPOINTS } from '~/constants/api'

export const useClientStore = defineStore('client', () => {
  const clients = ref<Client[]>([])
  const currentClient = ref<Client | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const stats = ref<ClientStats | null>(null)
  const totalCount = ref(0)

  // Get auth store for authentication
  const authStore = useAuthStore()

  /**
   * Fetch all clients with optional filters
   */
  const fetchClients = async (filters: ClientFilterOptions = {}) => {
    try {
      isLoading.value = true
      error.value = null

      const { data } = await useAsyncData<{ data: Client[]; total: number }>(
        'clients',
        () =>
          $fetch(API_ENDPOINTS.CLIENTS.BASE, {
            params: filters,
            headers: {
              'Content-Type': 'application/json',
              ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
            },
            credentials: 'include',
          }),
        {
          server: true,
          lazy: true,
          default: () => ({ data: [], total: 0 }),
        }
      )

      clients.value = data.value?.data || []
      totalCount.value = data.value?.total || 0
      return clients.value
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch clients'
      console.error('Error fetching clients:', error.value)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single client by ID
   */
  const fetchClientById = async (id: string | number) => {
    try {
      isLoading.value = true
      error.value = null

      const { data } = await useAsyncData<Client>(
        `client-${id}`,
        () =>
          $fetch(API_ENDPOINTS.CLIENTS.BY_ID(String(id)), {
            headers: {
              'Content-Type': 'application/json',
              ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
            },
            credentials: 'include',
          }),
        {
          server: true,
          lazy: true,
        }
      )

      currentClient.value = data.value || null
      return currentClient.value
    } catch (err: any) {
      error.value = err.message || `Failed to fetch client with ID ${id}`
      console.error(`Error fetching client ${id}:`, error.value)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new client
   */
  const createClient = async (clientData: Omit<Client, 'id' | 'userId' | 'createdAt'>) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await $fetch<Client>(API_ENDPOINTS.CLIENTS.BASE, {
        method: 'POST',
        body: JSON.stringify(clientData),
        headers: {
          'Content-Type': 'application/json',
          ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
        },
        credentials: 'include',
      })

      // Add the new client to the local state
      clients.value = [response, ...clients.value]
      totalCount.value += 1
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to create client'
      console.error('Error creating client:', error.value)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update an existing client
   */
  const updateClient = async (id: string | number, updates: Partial<Client>) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await $fetch<Client>(API_ENDPOINTS.CLIENTS.BY_ID(String(id)), {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: {
          'Content-Type': 'application/json',
          ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
        },
        credentials: 'include',
      })

      // Update the client in the local state
      const index = clients.value.findIndex(c => c.id === Number(id))
      if (index !== -1) {
        clients.value[index] = { ...clients.value[index], ...response }
      }

      if (currentClient.value?.id === Number(id)) {
        currentClient.value = { ...currentClient.value, ...response }
      }

      return response
    } catch (err: any) {
      error.value = err.message || `Failed to update client with ID ${id}`
      console.error(`Error updating client ${id}:`, error.value)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a client
   */
  const deleteClient = async (id: string | number) => {
    try {
      isLoading.value = true
      error.value = null

      await $fetch(API_ENDPOINTS.CLIENTS.BY_ID(String(id)), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
        },
        credentials: 'include',
      })

      // Remove the client from the local state
      clients.value = clients.value.filter(client => client.id !== Number(id))
      totalCount.value = Math.max(0, totalCount.value - 1)

      // Clear current client if it's the one being deleted
      if (currentClient.value?.id === Number(id)) {
        currentClient.value = null
      }

      return true
    } catch (err: any) {
      error.value = err.message || `Failed to delete client with ID ${id}`
      console.error(`Error deleting client ${id}:`, error.value)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get client statistics
   */
  const fetchClientStats = async () => {
    try {
      isLoading.value = true
      error.value = null

      const { data } = await useAsyncData<ClientStats>(
        'client-stats',
        () =>
          $fetch(`${API_ENDPOINTS.CLIENTS.BASE}/stats`, {
            headers: {
              'Content-Type': 'application/json',
              ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
            },
            credentials: 'include',
          }),
        {
          server: true,
          lazy: true,
        }
      )

      stats.value = data.value || null
      return stats.value
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch client statistics'
      console.error('Error fetching client stats:', error.value)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Reset the store state
   */
  const reset = () => {
    clients.value = []
    currentClient.value = null
    stats.value = null
    totalCount.value = 0
    error.value = null
    isLoading.value = false
  }

  return {
    // State
    clients,
    currentClient,
    isLoading,
    error,
    stats,
    totalCount,

    // Actions
    fetchClients,
    fetchClientById,
    createClient,
    updateClient,
    deleteClient,
    fetchClientStats,
    reset,
  }
})
