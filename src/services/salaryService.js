import { apiClient } from "../config/api"

class SalaryService {
  async createSalary(salaryData) {
    try {
      console.log("SalaryService: Creating salary with data:", salaryData)
      const response = await apiClient.post("/salary", salaryData) // This should match your backend route
      console.log("SalaryService: Salary created successfully:", response)
      return response
    } catch (error) {
      console.log("SalaryService: Error creating salary:", error)
      throw error
    }
  }

  async getAllSalaries() {
    try {
      console.log("SalaryService: Fetching all salaries")
      const response = await apiClient.get("/salary") // This should match your backend route
      console.log("SalaryService: Salaries fetched:", response)
      return response
    } catch (error) {
      console.log("SalaryService: Error fetching salaries:", error)
      throw error
    }
  }

  async getSalaryById(id) {
    try {
      console.log("SalaryService: Fetching salary by ID:", id)
      const response = await apiClient.get(`/salary/${id}`)
      console.log("SalaryService: Salary fetched:", response)
      return response
    } catch (error) {
      console.log("SalaryService: Error fetching salary:", error)
      throw error
    }
  }

  async updateSalary(id, salaryData) {
    try {
      console.log("SalaryService: Updating salary:", id, salaryData)
      const response = await apiClient.put(`/salary/${id}`, salaryData)
      console.log("SalaryService: Salary updated:", response)
      return response
    } catch (error) {
      console.log("SalaryService: Error updating salary:", error)
      throw error
    }
  }

  async deleteSalary(id) {
    try {
      console.log("SalaryService: Deleting salary:", id)
      const response = await apiClient.delete(`/salary/${id}`)
      console.log("SalaryService: Salary deleted:", response)
      return response
    } catch (error) {
      console.log("SalaryService: Error deleting salary:", error)
      throw error
    }
  }
}

export default new SalaryService()