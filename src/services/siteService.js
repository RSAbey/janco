import { apiClient } from "../config/api"

class SiteService {
  async createSite(siteData) {
    try {
      console.log("[v0] SiteService: Creating site with data:", siteData)
      const response = await apiClient.post("/projects", siteData)
      console.log("[v0] SiteService: Site created successfully:", response)
      return response
    } catch (error) {
      console.log("[v0] SiteService: Error creating site:", error)
      throw error
    }
  }

  async getAllSites() {
    try {
      console.log("[v0] SiteService: Fetching all sites")
      const response = await apiClient.get("/projects")
      console.log("[v0] SiteService: Sites fetched:", response)
      return response
    } catch (error) {
      console.log("[v0] SiteService: Error fetching sites:", error)
      throw error
    }
  }

  async getSiteById(id) {
    try {
      console.log("[v0] SiteService: Fetching site by ID:", id)
      const response = await apiClient.get(`/projects/${id}`)
      console.log("[v0] SiteService: Site fetched:", response)
      return response
    } catch (error) {
      console.log("[v0] SiteService: Error fetching site:", error)
      throw error
    }
  }

  async updateSite(id, siteData) {
    try {
      console.log("[v0] SiteService: Updating site:", id, siteData)
      const response = await apiClient.put(`/projects/${id}`, siteData)
      console.log("[v0] SiteService: Site updated:", response)
      return response
    } catch (error) {
      console.log("[v0] SiteService: Error updating site:", error)
      throw error
    }
  }

  async deleteSite(id) {
    try {
      console.log("[v0] SiteService: Deleting site:", id)
      const response = await apiClient.delete(`/projects/${id}`)
      console.log("[v0] SiteService: Site deleted:", response)
      return response
    } catch (error) {
      console.log("[v0] SiteService: Error deleting site:", error)
      throw error
    }
  }
}

export default new SiteService()
