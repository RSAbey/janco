import apiClient from "../config/api"

class DashboardService {
  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const response = await apiClient.get("/dashboard/stats")
      return response.stats
    } catch (error) {
      throw new Error(error.message || "Failed to fetch dashboard statistics")
    }
  }

  // Get revenue data
  async getRevenueData(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = queryParams ? `/dashboard/revenue?${queryParams}` : "/dashboard/revenue"
      const response = await apiClient.get(endpoint)
      return response.revenue
    } catch (error) {
      throw new Error(error.message || "Failed to fetch revenue data")
    }
  }

  // Get attendance summary
  async getAttendanceSummary(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = queryParams ? `/dashboard/attendance?${queryParams}` : "/dashboard/attendance"
      const response = await apiClient.get(endpoint)
      return response.attendance
    } catch (error) {
      throw new Error(error.message || "Failed to fetch attendance summary")
    }
  }

  // Get material alerts
  async getMaterialAlerts() {
    try {
      const response = await apiClient.get("/dashboard/material-alerts")
      return response.alerts
    } catch (error) {
      throw new Error(error.message || "Failed to fetch material alerts")
    }
  }

  // Get recent activities
  async getRecentActivities(limit = 10) {
    try {
      const response = await apiClient.get(`/dashboard/activities?limit=${limit}`)
      return response.activities
    } catch (error) {
      throw new Error(error.message || "Failed to fetch recent activities")
    }
  }

  // Get revenue data - now using expense service directly
  async getRevenueData(filters = {}) {
    try {
      // For now, we'll handle this in the component directly
      // since the backend endpoint doesn't exist yet
      throw new Error("Revenue endpoint not implemented")
    } catch (error) {
      throw new Error(error.message || "Failed to fetch revenue data")
    }
  }
  
}

export const dashboardService = new DashboardService()
export default dashboardService
