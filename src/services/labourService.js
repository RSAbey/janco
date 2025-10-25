import { apiClient } from "../config/api"

class LabourService {
  // Get all labourers
  async getLabourers(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = queryParams ? `/labour?${queryParams}` : "/labour"
      const response = await apiClient.get(endpoint)
      return response.labourers || response
    } catch (error) {
      throw new Error(error.message || "Failed to fetch labourers")
    }
  }

  // Get labourer by ID
  async getLabourer(id) {
    try {
      const response = await apiClient.get(`/labour/${id}`)
      return response.labourer || response
    } catch (error) {
      throw new Error(error.message || "Failed to fetch labourer")
    }
  }

  // In labourService.js - update createLabourer method
  async createLabourer(labourData) {
    try {
      const response = await apiClient.post("/labour", labourData)

      if (response.message && response.message.includes("failed")) {
        throw new Error(response.message)
      }

      return response.labourer || response
    } catch (error) {
      console.error("Create labourer error:", error)

      // For duplicate key errors, we'll handle them silently
      // and let the automatic refresh handle the display
      if (error.message.includes("E11000") || error.message.includes("duplicate key")) {
        // Silently fail - the data will appear on refresh anyway
        console.log("Duplicate key error handled silently")
        return null // Return null instead of throwing error
      }

      throw new Error("Failed to create labourer")
    }
  }

  // Update labourer
  async updateLabourer(id, labourData) {
    try {
      const response = await apiClient.put(`/labour/${id}`, labourData)
      return response.labourer || response
    } catch (error) {
      throw new Error(error.message || "Failed to update labourer")
    }
  }

  // Delete labourer
  async deleteLabourer(id) {
    try {
      await apiClient.delete(`/labour/${id}`)
      return true
    } catch (error) {
      throw new Error(error.message || "Failed to delete labourer")
    }
  }

  // Get labourer salaries
  async getLabourerSalaries(labourId) {
    try {
      const response = await apiClient.get(`/labour/${labourId}/salaries`)
      return response.salaries || response
    } catch (error) {
      throw new Error(error.message || "Failed to fetch labourer salaries")
    }
  }

  // Get all salaries
  async getAllSalaries(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = queryParams ? `/labour/salaries/all?${queryParams}` : "/labour/salaries/all"
      const response = await apiClient.get(endpoint)
      return response.salaries || response
    } catch (error) {
      throw new Error(error.message || "Failed to fetch salaries")
    }
  }

  // Create salary payment
  async createSalary(salaryData) {
    try {
      const response = await apiClient.post("/labour/salaries", salaryData)
      return response.salary || response
    } catch (error) {
      console.error("Create salary error:", error)
      throw new Error(error.message || "Failed to create salary payment")
    }
  }

  // Update salary payment status
  async updateSalaryStatus(id, salaryData) {
    try {
      // If salaryData is a string, treat it as status for backward compatibility
      const updateData = typeof salaryData === "string" ? { status: salaryData } : salaryData

      const response = await apiClient.put(`/labour/salaries/${id}`, updateData)
      return response.salary || response
    } catch (error) {
      throw new Error(error.message || "Failed to update salary")
    }
  }

  // Add this method to your labourService class
  async deleteSalary(id) {
    try {
      await apiClient.delete(`/labour/salaries/${id}`)
      return true
    } catch (error) {
      throw new Error(error.message || "Failed to delete salary")
    }
  }

  async getPaidSalaryTotalByProject(projectId) {
    try {
      const response = await apiClient.get(`/labour/salaries/all?projectId=${projectId}&status=paid`)
      const salaries = response.salaries || response

      // Calculate total paid amount
      const totalPaid = salaries.reduce((sum, salary) => sum + (salary.amount || 0), 0)

      return {
        totalPaid,
        count: salaries.length,
        salaries,
      }
    } catch (error) {
      throw new Error(error.message || "Failed to fetch paid salary totals")
    }
  }
}

export const labourService = new LabourService()
export default labourService
