// API configuration and base URL setup
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

// API client with authentication headers
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem("token")
  }

  // Set auth token in localStorage
  setAuthToken(token) {
    localStorage.setItem("token", token)
  }

  // Remove auth token from localStorage
  removeAuthToken() {
    localStorage.removeItem("token")
  }

  // Make authenticated API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const token = this.getAuthToken()

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body)
    }

    try {
      console.log("[v0] API Request:", {
        url,
        method: config.method || "GET",
        body: config.body,
        hasToken: !!token,
      })

      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        console.log("[v0] API Error Response:", {
          status: response.status,
          data: data,
        })
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  // HTTP methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: "GET", ...options })
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: data,
      ...options,
    })
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: data,
      ...options,
    })
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: "DELETE", ...options })
  }
}

export const apiClient = new ApiClient()
export default apiClient