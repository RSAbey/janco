import apiClient from "./apiClient"

class SubcontractorService {
  async getAllSubcontractors() {
    try {
      console.log("[v0] SubcontractorService: Making GET request to /subcontractors")
      const response = await apiClient.get("/subcontractors")
      console.log("[v0] SubcontractorService: Response received:", response)
      console.log("[v0] SubcontractorService: Response data:", response)
      return response.data
    } catch (error) {
      console.log("[v0] SubcontractorService: Error in getAllSubcontractors:", error)
      throw error
    }
  }

  async createSubcontractor(subcontractorData) {
    const response = await apiClient.post("/subcontractors", subcontractorData)
    return response.data
  }

  async appointSubcontractor(subcontractorId, appointmentData) {
    const response = await apiClient.post(`/subcontractors/${subcontractorId}/appoint`, appointmentData)
    return response.data
  }

  async deleteSubcontractor(subcontractorId) {
    const response = await apiClient.delete(`/subcontractors/${subcontractorId}`)
    return response.data
  }

  async updateSubcontractor(subcontractorId, subcontractorData) {
    const response = await apiClient.put(`/subcontractors/${subcontractorId}`, subcontractorData)
    return response.data
  }
}

export default new SubcontractorService()
