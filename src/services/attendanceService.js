import { apiClient } from "../config/api";

class AttendanceService {
  // Get attendance records
  async getAttendance(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = queryParams ? `/attendance?${queryParams}` : "/attendance";
      const response = await apiClient.get(endpoint);
      return response.attendance || response;
    } catch (error) {
      throw new Error(error.message || "Failed to fetch attendance records");
    }
  }

  // Get attendance by ID
  async getAttendanceById(id) {
    try {
      const response = await apiClient.get(`/attendance/${id}`);
      return response.attendance || response;
    } catch (error) {
      throw new Error(error.message || "Failed to fetch attendance record");
    }
  }

  // Create attendance record
  async createAttendance(attendanceData) {
    try {
      const response = await apiClient.post("/attendance", attendanceData);
      return response.attendance || response;
    } catch (error) {
      throw new Error(error.message || "Failed to create attendance record");
    }
  }

  // Update attendance record
  async updateAttendance(id, attendanceData) {
    try {
      const response = await apiClient.put(`/attendance/${id}`, attendanceData);
      return response.attendance || response;
    } catch (error) {
      throw new Error(error.message || "Failed to update attendance record");
    }
  }

  // Delete attendance record
  async deleteAttendance(id) {
    try {
      await apiClient.delete(`/attendance/${id}`);
      return true;
    } catch (error) {
      throw new Error(error.message || "Failed to delete attendance record");
    }
  }

  // Add to attendanceService.js
  async getSiteAttendancePercentages(month, year) {
    try {
      const queryParams = new URLSearchParams();
      if (month !== undefined) queryParams.append('month', month);
      if (year !== undefined) queryParams.append('year', year);
      
      const endpoint = `/attendance/stats/site-percentages?${queryParams.toString()}`;
      const response = await apiClient.get(endpoint);
      return response.data || response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch site attendance percentages');
    }
  }

  async bulkCreateAttendance(attendanceData) {
    try {
      const response = await apiClient.post("/attendance/bulk", attendanceData);
      
      if (response.message && response.message.includes("failed")) {
        throw new Error(response.message);
      }
      
      return response;
    } catch (error) {
      console.error("Bulk create attendance error:", error);
      
      // Extract more specific error message from response if available
      let errorMessage = "Failed to create attendance records";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
        
        // Add details about existing records if available
        if (error.response.data.existingRecords) {
          errorMessage += ". Some records already exist for this date.";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;