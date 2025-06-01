import type { Client, ClientFormData } from '~/types/client'
import { useAuthStore } from '~/store/modules/auth'

export function useClientApi() {
  const toast = useToast()
  const authStore = useAuthStore()
  const _config = useRuntimeConfig()
  const baseUrl = '/api/clients'

  /**
   * Get all clients for the current user
   */
  function getClients(page = 1, limit = 10, search = '') {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: search || '',
    }).toString()

    const key = `clients-${page}-${limit}-${search}`

    const { data, error } = useAsyncData<{
      success: boolean
      data: Client[]
      total: number
      page: number
      limit: number
    }>(
      key,
      () =>
        $fetch(`${baseUrl}?${query}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }),
      {
        server: true,
        lazy: true,
        transform: response => ({
          success: true,
          clients: response.data,
          total: response.total,
          page: response.page,
          limit: response.limit,
        }),
      }
    )

    // Handle errors
    if (error.value) {
      console.error('Failed to fetch clients:', error.value)
      toast.error('Failed to load clients. Please try again.')
      return {
        success: false,
        error: error.value.data?.message || 'Failed to fetch clients',
        clients: [],
        total: 0,
        page: 1,
        limit: 10,
      }
    }

    // Return the data in a consistent format
    return {
      success: true,
      clients: data.value?.clients || [],
      total: data.value?.total || 0,
      page: data.value?.page || page,
      limit: data.value?.limit || limit,
    }
  }

  /**
   * Get a single client by ID
   */
  function getClientById(id: string) {
    const key = `client-${id}`

    const { data, error } = useAsyncData<{ success: boolean; data: Client }>(
      key,
      () =>
        $fetch(`${baseUrl}/${id}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }),
      {
        server: true,
        lazy: true,
        transform: response => ({
          success: true,
          client: response.data,
        }),
      }
    )

    // Handle errors
    if (error.value) {
      console.error('Failed to fetch client:', error.value)
      toast.error('Failed to load client. Please try again.')
      return {
        success: false,
        error: error.value.data?.message || 'Failed to fetch client',
        client: null,
      }
    }

    // Return the data in a consistent format
    return {
      success: true,
      client: data.value?.client || null,
    }
  }

  /**
   * Create a new client
   */
  async function createClient(clientData: ClientFormData) {
    try {
      const response = await $fetch<{ success: boolean; data: Client }>(baseUrl, {
        method: 'POST',
        body: JSON.stringify(clientData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
      })

      toast.success('Client created successfully')
      return {
        success: true,
        client: response.data,
      }
    } catch (error: any) {
      console.error('Failed to create client:', error)
      toast.error(error.data?.message || 'Failed to create client')
      return {
        success: false,
        error: error.data?.message || 'Failed to create client',
        client: null,
      }
    }
  }

  /**
   * Update an existing client
   */
  async function updateClient(id: string, clientData: Partial<ClientFormData>) {
    try {
      const response = await $fetch<{ success: boolean; data: Client }>(`${baseUrl}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(clientData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
      })

      toast.success('Client updated successfully')
      return {
        success: true,
        client: response.data,
      }
    } catch (error: any) {
      console.error('Failed to update client:', error)
      toast.error(error.data?.message || 'Failed to update client')
      return {
        success: false,
        error: error.data?.message || 'Failed to update client',
        client: null,
      }
    }
  }

  /**
   * Delete a client
   */
  async function deleteClient(id: string) {
    try {
      await $fetch<{ success: boolean }>(`${baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      })

      toast.success('Client deleted successfully')
      return { success: true }
    } catch (error: any) {
      console.error('Failed to delete client:', error)
      toast.error(error.data?.message || 'Failed to delete client')
      return {
        success: false,
        error: error.data?.message || 'Failed to delete client',
      }
    }
  }

  return {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
  }
}

export default useClientApi
