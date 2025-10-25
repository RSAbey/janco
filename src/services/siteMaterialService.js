import apiClient from "./apiClient"

class SiteMaterialService {
  // Get all materials for a project
  async getProjectMaterials(projectId, params = {}) {
    try {
      const queryParams = new URLSearchParams()

      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== "") {
          queryParams.append(key, params[key])
        }
      })

      const queryString = queryParams.toString()
      const url = `/site-materials/project/${projectId}${queryString ? `?${queryString}` : ""}`

      const response = await apiClient.get(url)
      return response.data
    } catch (error) {
      console.error("Error fetching project materials:", error)
      throw error.response?.data || { message: "Failed to fetch materials" }
    }
  }

  // Create a new material
  async createMaterial(materialData) {
    try {
      const response = await apiClient.post("/site-materials", materialData)
      return response.data
    } catch (error) {
      console.error("Error creating material:", error)
      throw error.response?.data || { message: "Failed to create material" }
    }
  }

  // Update a material
  async updateMaterial(materialId, materialData) {
    try {
      const response = await apiClient.put(`/site-materials/${materialId}`, materialData)
      return response.data
    } catch (error) {
      console.error("Error updating material:", error)
      throw error.response?.data || { message: "Failed to update material" }
    }
  }

  // Delete a material
  async deleteMaterial(materialId) {
    try {
      const response = await apiClient.delete(`/site-materials/${materialId}`)
      return response.data
    } catch (error) {
      console.error("Error deleting material:", error)
      throw error.response?.data || { message: "Failed to delete material" }
    }
  }

  // Add this method to siteMaterialService.js if needed
  async getProjectDetails(projectId) {
    try {
      const response = await apiClient.get(`/projects/${projectId}`)
      return response.data
    } catch (error) {
      console.error("Error fetching project details:", error)
      throw error.response?.data || { message: "Failed to fetch project details" }
    }
  }

  // Get material summary for a project
  async getProjectSummary(projectId) {
    try {
      const response = await apiClient.get(`/site-materials/project/${projectId}/summary`)
      return response.data
    } catch (error) {
      console.error("Error fetching material summary:", error)
      throw error.response?.data || { message: "Failed to fetch material summary" }
    }
  }
}

export default new SiteMaterialService()