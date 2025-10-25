import apiClient from "../config/api"

class UserService {
  // Get all users
  async getUsers(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = queryParams ? `/users?${queryParams}` : "/users"
      const response = await apiClient.get(endpoint)
      return response.users
    } catch (error) {
      throw new Error(error.message || "Failed to fetch users")
    }
  }

  // Get user by ID
  async getUser(id) {
    try {
      const response = await apiClient.get(`/users/${id}`)
      return response.user
    } catch (error) {
      throw new Error(error.message || "Failed to fetch user")
    }
  }

  // Update user
  async updateUser(id, userData) {
    try {
      const response = await apiClient.put(`/users/${id}`, userData)
      return response.user
    } catch (error) {
      throw new Error(error.message || "Failed to update user")
    }
  }

  // Get attendance records
  async getAttendance(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = queryParams ? `/attendance?${queryParams}` : "/attendance"
      const response = await apiClient.get(endpoint)
      return response.attendance
    } catch (error) {
      throw new Error(error.message || "Failed to fetch attendance")
    }
  }

  // Clock in/out
  async clockIn(data) {
    try {
      const response = await apiClient.post("/attendance/clock-in", data)
      return response.attendance
    } catch (error) {
      throw new Error(error.message || "Failed to clock in")
    }
  }

  async clockOut(attendanceId) {
    try {
      const response = await apiClient.put(`/attendance/${attendanceId}/clock-out`)
      return response.attendance
    } catch (error) {
      throw new Error(error.message || "Failed to clock out")
    }
  }

  // Get salary records
  async getSalaries(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = queryParams ? `/salary?${queryParams}` : "/salary"
      const response = await apiClient.get(endpoint)
      return response.salaries
    } catch (error) {
      throw new Error(error.message || "Failed to fetch salaries")
    }
  }

  // Create salary record
  async createSalary(salaryData) {
    try {
      const response = await apiClient.post("/salary", salaryData)
      return response.salary
    } catch (error) {
      throw new Error(error.message || "Failed to create salary record")
    }
  }
}

export const userService = new UserService()
export default userService
