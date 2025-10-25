import { apiClient } from "../config/api"

class SupplierService {
  // Get all suppliers
  async getSuppliers(filters = {}) {
    try {
      console.log("[v0] SupplierService: Fetching suppliers with filters:", filters)
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = queryParams ? `/suppliers?${queryParams}` : "/suppliers"
      const response = await apiClient.get(endpoint)
      console.log("[v0] SupplierService: Suppliers fetched:", response)
      return response.suppliers || response
    } catch (error) {
      console.log("[v0] SupplierService: Error fetching suppliers:", error)
      throw error
    }
  }

  // Get supplier by ID
  async getSupplier(id) {
    try {
      console.log("[v0] SupplierService: Fetching supplier by ID:", id)
      const response = await apiClient.get(`/suppliers/${id}`)
      console.log("[v0] SupplierService: Supplier fetched:", response)
      return response.supplier || response
    } catch (error) {
      console.log("[v0] SupplierService: Error fetching supplier:", error)
      throw error
    }
  }

  // Create new supplier
  async createSupplier(supplierData) {
    try {
      console.log("[v0] SupplierService: Creating supplier with data:", supplierData)
      const response = await apiClient.post("/suppliers", supplierData)
      console.log("[v0] SupplierService: Supplier created:", response)
      return response.supplier || response
    } catch (error) {
      console.log("[v0] SupplierService: Error creating supplier:", error)
      throw error
    }
  }

  // Update supplier
  async updateSupplier(id, supplierData) {
    try {
      console.log("[v0] SupplierService: Updating supplier:", id, supplierData)
      const response = await apiClient.put(`/suppliers/${id}`, supplierData)
      console.log("[v0] SupplierService: Supplier updated:", response)
      return response.supplier || response
    } catch (error) {
      console.log("[v0] SupplierService: Error updating supplier:", error)
      throw error
    }
  }

  // Delete supplier
  async deleteSupplier(id) {
    try {
      console.log("[v0] SupplierService: Deleting supplier:", id)
      const response = await apiClient.delete(`/suppliers/${id}`)
      console.log("[v0] SupplierService: Supplier deleted:", response)
      return response
    } catch (error) {
      console.log("[v0] SupplierService: Error deleting supplier:", error)
      // Check if it's a specific error from the backend
      if (error.message && error.message.includes("associated purchase orders")) {
        throw new Error("Cannot delete supplier with associated purchase orders. Please deactivate instead.")
      }
      throw error
    }
  }

  // Create purchase order
  async createPurchaseOrder(orderData) {
    try {
      console.log("[v0] SupplierService: Creating purchase order:", orderData)
      const response = await apiClient.post("/purchase-orders", orderData)
      console.log("[v0] SupplierService: Purchase order created:", response)
      return response.purchaseOrder || response
    } catch (error) {
      console.log("[v0] SupplierService: Error creating purchase order:", error)
      throw error
    }
  }

  // Get purchase orders
  async getPurchaseOrders(filters = {}) {
    try {
      console.log("[v0] SupplierService: Fetching purchase orders with filters:", filters)
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = queryParams ? `/purchase-orders?${queryParams}` : "/purchase-orders"
      const response = await apiClient.get(endpoint)
      console.log("[v0] SupplierService: Purchase orders fetched:", response)
      return response.purchaseOrders || response
    } catch (error) {
      console.log("[v0] SupplierService: Error fetching purchase orders:", error)
      throw error
    }
  }
}

export const supplierService = new SupplierService()
export default supplierService
