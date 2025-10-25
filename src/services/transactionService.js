import apiClient from "./apiClient"

class TransactionService {
  // Get all transactions for a project
  async getProjectTransactions(projectId, params = {}) {
    try {
      const queryParams = new URLSearchParams()

      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== "") {
          queryParams.append(key, params[key])
        }
      })

      const queryString = queryParams.toString()
      const url = `/transactions/project/${projectId}${queryString ? `?${queryString}` : ""}`

      const response = await apiClient.get(url)
      return response.data
    } catch (error) {
      console.error("Error fetching project transactions:", error)
      throw error.response?.data || { message: "Failed to fetch transactions" }
    }
  }

  // Create a new transaction
  async createTransaction(transactionData) {
    try {
      const response = await apiClient.post("/transactions", transactionData)
      return response.data
    } catch (error) {
      console.error("Error creating transaction:", error)
      throw error.response?.data || { message: "Failed to create transaction" }
    }
  }

  // Update a transaction
  async updateTransaction(transactionId, transactionData) {
    try {
      const response = await apiClient.put(`/transactions/${transactionId}`, transactionData)
      return response.data
    } catch (error) {
      console.error("Error updating transaction:", error)
      throw error.response?.data || { message: "Failed to update transaction" }
    }
  }

  // Delete a transaction
  async deleteTransaction(transactionId) {
    try {
      const response = await apiClient.delete(`/transactions/${transactionId}`)
      return response.data
    } catch (error) {
      console.error("Error deleting transaction:", error)
      throw error.response?.data || { message: "Failed to delete transaction" }
    }
  }

  // Get transaction summary for a project
  async getProjectSummary(projectId) {
    try {
      const response = await apiClient.get(`/transactions/project/${projectId}/summary`)
      return response.data
    } catch (error) {
      console.error("Error fetching transaction summary:", error)
      throw error.response?.data || { message: "Failed to fetch transaction summary" }
    }
  }
}

export default new TransactionService()
