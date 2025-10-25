import apiClient from "../config/api"

class ProjectService {
  // Get all projects
  async getProjects(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = queryParams ? `/projects?${queryParams}` : "/projects"
      const response = await apiClient.get(endpoint)
      return response.projects
    } catch (error) {
      throw new Error(error.message || "Failed to fetch projects")
    }
  }

  // Get project by ID
  async getProject(id) {
    try {
      const response = await apiClient.get(`/projects/${id}`)
      return response.project
    } catch (error) {
      throw new Error(error.message || "Failed to fetch project")
    }
  }

  // Create new project
  async createProject(projectData) {
    try {
      const response = await apiClient.post("/projects", projectData)
      return response.project
    } catch (error) {
      throw new Error(error.message || "Failed to create project")
    }
  }

  // Update project
  async updateProject(id, projectData) {
    try {
      const response = await apiClient.put(`/projects/${id}`, projectData)
      return response.project
    } catch (error) {
      throw new Error(error.message || "Failed to update project")
    }
  }

  // Delete project
  async deleteProject(id) {
    try {
      await apiClient.delete(`/projects/${id}`)
      return true
    } catch (error) {
      throw new Error(error.message || "Failed to delete project")
    }
  }

  // Get project expenses
  async getProjectExpenses(projectId) {
    try {
      const response = await apiClient.get(`/expenses?project=${projectId}`)
      return response.expenses
    } catch (error) {
      throw new Error(error.message || "Failed to fetch project expenses")
    }
  }

  // Add project expense
  async addExpense(expenseData) {
    try {
      const response = await apiClient.post("/expenses", expenseData)
      return response.expense
    } catch (error) {
      throw new Error(error.message || "Failed to add expense")
    }
  }
}

export const projectService = new ProjectService()
export default projectService
