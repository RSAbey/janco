import apiClient from "./apiClient"

const financeService = {
  // Get financial overview
  getFinancialOverview: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await apiClient.get(`/finance/overview?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error("Error fetching financial overview:", error)
      throw error
    }
  },

  // Get monthly financial trends
  getFinancialTrends: async (months = 12) => {
    try {
      const response = await apiClient.get(`/finance/trends?months=${months}`)
      return response.data
    } catch (error) {
      console.error("Error fetching financial trends:", error)
      throw error
    }
  },

  // Get project profitability
  getProjectProfitability: async () => {
    try {
      const response = await apiClient.get("/finance/project-profitability")
      return response.data
    } catch (error) {
      console.error("Error fetching project profitability:", error)
      throw error
    }
  },
}

export default financeService
