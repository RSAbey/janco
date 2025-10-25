import apiClient from "../config/api"

class AuthService {
  // Login user
  async login(email, password) {
    try {
      const response = await apiClient.post("/auth/login", { email, password })

      if (response.token) {
        apiClient.setAuthToken(response.token)
        localStorage.setItem("user", JSON.stringify(response.user))
      }

      return response
    } catch (error) {
      throw new Error(error.message || "Login failed")
    }
  }

  // Register user
  async register(userData) {
    try {
      const response = await apiClient.post("/auth/register", userData)

      if (response.token) {
        apiClient.setAuthToken(response.token)
        localStorage.setItem("user", JSON.stringify(response.user))
      }

      return response
    } catch (error) {
      throw new Error(error.message || "Registration failed")
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const response = await apiClient.get("/auth/me")
      return response.user
    } catch (error) {
      throw new Error(error.message || "Failed to get user data")
    }
  }

  // Logout user
  logout() {
    apiClient.removeAuthToken()
    localStorage.removeItem("user")
    localStorage.removeItem("token")
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = apiClient.getAuthToken()
    const user = localStorage.getItem("user")
    return !!(token && user)
  }

  // Get stored user data
  getStoredUser() {
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user) : null
  }

  // Update password
  async updatePassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.put("/auth/password", {
        currentPassword,
        newPassword,
      })
      return response
    } catch (error) {
      throw new Error(error.message || "Password update failed")
    }
  }

  // Verify current user's password (for confirm actions)
  async verifyPassword(password) {
    try {
      const response = await apiClient.post("/auth/verify-password", { password })
      return response
    } catch (error) {
      throw new Error(error.message || "Password verification failed")
    }
  }
}

export const authService = new AuthService()
export default authService
