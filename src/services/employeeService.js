import { apiClient } from "../config/api"

class EmployeeService {
  async createEmployee(employeeData) {
    try {
      console.log("[v0] EmployeeService: Creating employee with data:", employeeData)
      const response = await apiClient.post("/auth/register", employeeData)
      console.log("[v0] EmployeeService: Employee created successfully:", response)
      return response
    } catch (error) {
      console.log("[v0] EmployeeService: Error creating employee:", error)
      throw error
    }
  }

  async getAllEmployees() {
    try {
      console.log("[v0] EmployeeService: Fetching all employees")
      const response = await apiClient.get("/users")
      console.log("[v0] EmployeeService: Employees fetched:", response)
      return response
    } catch (error) {
      console.log("[v0] EmployeeService: Error fetching employees:", error)
      throw error
    }
  }

  async getEmployeeById(id) {
    try {
      console.log("[v0] EmployeeService: Fetching employee by ID:", id)
      const response = await apiClient.get(`/users/${id}`)
      console.log("[v0] EmployeeService: Employee fetched:", response)
      return response
    } catch (error) {
      console.log("[v0] EmployeeService: Error fetching employee:", error)
      throw error
    }
  }

  async updateEmployee(id, employeeData) {
    try {
      console.log("[v0] EmployeeService: Updating employee:", id, employeeData)
      const response = await apiClient.put(`/users/${id}`, employeeData)
      console.log("[v0] EmployeeService: Employee updated:", response)
      return response
    } catch (error) {
      console.log("[v0] EmployeeService: Error updating employee:", error)
      throw error
    }
  }

  // In EmployeeService.js, enhance the deleteEmployee method with more debugging:
  async deleteEmployee(id) {
    try {
      console.log("[v0] EmployeeService: Deleting employee with ID:", id);
      console.log("[v0] Making DELETE request to:", `/users/${id}`);
      
      const token = localStorage.getItem("token");
      console.log("[v0] Auth token exists:", !!token);
      
      const response = await apiClient.delete(`/users/${id}`);
      
      console.log("[v0] EmployeeService: Delete response status:", response.status);
      console.log("[v0] EmployeeService: Delete response data:", response);
      
      return response;
    } catch (error) {
      console.log("[v0] EmployeeService: Error in deleteEmployee:", error);
      console.log("[v0] Error response:", error.response);
      console.log("[v0] Error message:", error.message);
      
      // Re-throw the error with more context
      throw new Error(`Failed to delete employee: ${error.message}`);
    }
  }
}

export default new EmployeeService()
