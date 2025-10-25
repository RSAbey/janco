import { apiClient } from "../config/api"

class ExpenseService {
  async createExpense(expenseData) {
    try {
      console.log("ExpenseService: Creating expense with data:", expenseData)
      const response = await apiClient.post("/expenses", expenseData)
      console.log("ExpenseService: Expense created successfully:", response)
      return response
    } catch (error) {
      console.log("ExpenseService: Error creating expense:", error)
      console.log("Error details:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to create expense")
    }
  }

  async getAllExpenses(filters = {}) {
    try {
      console.log("ExpenseService: Fetching all expenses with filters:", filters)
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = queryParams ? `/expenses?${queryParams}` : "/expenses"
      const response = await apiClient.get(endpoint)
      console.log("ExpenseService: Expenses fetched:", response)
      return response
    } catch (error) {
      console.log("ExpenseService: Error fetching expenses:", error)
      console.log("Error details:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to fetch expenses")
    }
  }

  async getExpenseStats(filters = {}) {
    try {
      console.log("ExpenseService: Fetching expense stats with filters:", filters)
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = queryParams ? `/expenses/stats?${queryParams}` : "/expenses/stats"
      const response = await apiClient.get(endpoint)
      console.log("ExpenseService: Expense stats fetched:", response)
      return response
    } catch (error) {
      console.log("ExpenseService: Error fetching expense stats:", error)
      console.log("Error details:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to fetch expense stats")
    }
  }

  async updateExpense(id, expenseData) {
    try {
      console.log("ExpenseService: Updating expense:", id, expenseData)
      const response = await apiClient.put(`/expenses/${id}`, expenseData)
      console.log("ExpenseService: Expense updated:", response)
      return response
    } catch (error) {
      console.log("ExpenseService: Error updating expense:", error)
      console.log("Error details:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to update expense")
    }
  }

  async deleteExpense(id) {
    try {
      console.log("ExpenseService: Deleting expense:", id)
      const response = await apiClient.delete(`/expenses/${id}`)
      console.log("ExpenseService: Expense deleted:", response)
      return response
    } catch (error) {
      console.log("ExpenseService: Error deleting expense:", error)
      console.log("Error details:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to delete expense")
    }
  }
}

export default new ExpenseService()