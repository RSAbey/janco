import { apiClient } from "../config/api"

class MaterialService {
  // Get all materials
  async getMaterials(filters = {}) {
    try {
      console.log("[v0] MaterialService: Fetching materials with filters:", filters)
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = queryParams ? `/materials?${queryParams}` : "/materials"
      const response = await apiClient.get(endpoint)
      console.log("[v0] MaterialService: Materials fetched:", response)
      return response.materials || response
    } catch (error) {
      console.log("[v0] MaterialService: Error fetching materials:", error)
      throw error
    }
  }

  // Get material by ID
  async getMaterial(id) {
    try {
      console.log("[v0] MaterialService: Fetching material by ID:", id)
      const response = await apiClient.get(`/materials/${id}`)
      console.log("[v0] MaterialService: Material fetched:", response)
      return response.material || response
    } catch (error) {
      console.log("[v0] MaterialService: Error fetching material:", error)
      throw error
    }
  }

  // Create new material
  async createMaterial(materialData) {
    try {
      console.log("[v0] MaterialService: Creating material with data:", materialData)
      const response = await apiClient.post("/materials", materialData)
      console.log("[v0] MaterialService: Material created:", response)
      return response.material || response
    } catch (error) {
      console.log("[v0] MaterialService: Error creating material:", error)
      throw error
    }
  }

  // Update material
  async updateMaterial(id, materialData) {
    try {
      console.log("[v0] MaterialService: Updating material:", id, materialData)
      const response = await apiClient.put(`/materials/${id}`, materialData)
      console.log("[v0] MaterialService: Material updated:", response)
      return response.material || response
    } catch (error) {
      console.log("[v0] MaterialService: Error updating material:", error)
      throw error
    }
  }

  // Delete material
  async deleteMaterial(id) {
    try {
      console.log("[v0] MaterialService: Deleting material:", id)
      const response = await apiClient.delete(`/materials/${id}`)
      console.log("[v0] MaterialService: Material deleted:", response)
      return response
    } catch (error) {
      console.log("[v0] MaterialService: Error deleting material:", error)
      throw error
    }
  }

  // Update stock
  async updateStock(id, stockData) {
    try {
      console.log("[v0] MaterialService: Updating stock:", id, stockData)
      const response = await apiClient.put(`/materials/${id}/stock`, stockData)
      console.log("[v0] MaterialService: Stock updated:", response)
      return response.material || response
    } catch (error) {
      console.log("[v0] MaterialService: Error updating stock:", error)
      throw error
    }
  }
}

export const materialService = new MaterialService()
export default materialService
