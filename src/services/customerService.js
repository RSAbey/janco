import apiClient from "./apiClient"

const customerService = {
  // Get all customers
  getAllCustomers: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.type) params.append("type", filters.type)
      if (filters.status) params.append("status", filters.status)
      if (filters.search) params.append("search", filters.search)

      const response = await apiClient.get(`/customers?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error("Error fetching customers:", error)
      throw error
    }
  },

  // Get customer by ID
  getCustomerById: async (customerId) => {
    try {
      const response = await apiClient.get(`/customers/${customerId}`)
      return response.data
    } catch (error) {
      console.error("Error fetching customer:", error)
      throw error
    }
  },

  // Create new customer
  createCustomer: async (customerData) => {
    try {
      const response = await apiClient.post("/customers", customerData)
      return response.data
    } catch (error) {
      console.error("Error creating customer:", error)
      throw error
    }
  },

  // Update customer
  updateCustomer: async (customerId, customerData) => {
    try {
      const response = await apiClient.put(`/customers/${customerId}`, customerData)
      return response.data
    } catch (error) {
      console.error("Error updating customer:", error)
      throw error
    }
  },
}

export default customerService
