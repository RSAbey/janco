import { apiClient } from "../config/api"

const workScheduleService = {
  // Create work schedule
  createWorkSchedule: async (workScheduleData) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const formattedData = {
        ...workScheduleData,
        startDate: new Date(workScheduleData.startDate).toISOString(),
        endDate: new Date(workScheduleData.endDate).toISOString(),
        // Ensure all required fields are present
        step: workScheduleData.step || "",
        title: workScheduleData.title || "",
        timeFrame: workScheduleData.timeFrame || "",
        workDescription: workScheduleData.workDescription || "",
        order: workScheduleData.order || 0,
      }

      // Validate required fields before sending
      if (!formattedData.project) {
        throw new Error("Project ID is required")
      }
      if (!formattedData.section) {
        throw new Error("Section is required")
      }
      if (!formattedData.step) {
        throw new Error("Step identifier is required")
      }
      if (!formattedData.title) {
        throw new Error("Title is required")
      }
      if (!formattedData.timeFrame) {
        throw new Error("Time frame is required")
      }

      console.log("[v0] Sending work schedule data:", formattedData)
      const response = await apiClient.post("/work-schedule", formattedData)
      return response.workSchedule
    } catch (error) {
      console.error("Error creating work schedule:", error)
      throw new Error(error.message || "Failed to create work schedule")
    }
  },

  // Get work schedules
  getWorkSchedules: async (filters = {}) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const params = new URLSearchParams()
      if (filters.projectId) params.append("projectId", filters.projectId)
      if (filters.section) params.append("section", filters.section)
      if (filters.status) params.append("status", filters.status)

      const response = await apiClient.get(`/work-schedule?${params}`)
      return response.workSchedules
    } catch (error) {
      console.error("Error fetching work schedules:", error)
      throw new Error(error.message || "Failed to fetch work schedules")
    }
  },

  // Update work schedule
  updateWorkSchedule: async (id, updateData) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await apiClient.put(`/work-schedule/${id}`, updateData)
      return response.workSchedule
    } catch (error) {
      console.error("Error updating work schedule:", error)
      throw new Error(error.message || "Failed to update work schedule")
    }
  },

  // Delete work schedule
  deleteWorkSchedule: async (id) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await apiClient.delete(`/work-schedule/${id}`)
      return response
    } catch (error) {
      console.error("Error deleting work schedule:", error)
      throw new Error(error.message || "Failed to delete work schedule")
    }
  },

  // Create multiple work schedules (bulk create)
  createBulkWorkSchedules: async (projectId, scheduleData) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required")
      }

      console.log("[v0] Starting bulk work schedule creation with data:", { projectId, scheduleData })

      const workSchedules = []

      // Process each section
      for (const [section, steps] of Object.entries(scheduleData)) {
        console.log(`[v0] Processing section: ${section} with ${steps.length} steps`)

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i]

          console.log(`[v0] Processing step ${i + 1}:`, step)

          const missingFields = []
          if (!step.step) missingFields.push("step")
          if (!step.title) missingFields.push("title")
          if (!step.timeFrame) missingFields.push("timeFrame")
          if (!step.startDate) missingFields.push("startDate")
          if (!step.endDate) missingFields.push("endDate")

          if (missingFields.length > 0) {
            console.warn(`[v0] Skipping incomplete step in ${section}:`, {
              step,
              missingFields,
            })
            continue
          }

          let startDate, endDate
          try {
            startDate = new Date(step.startDate)
            endDate = new Date(step.endDate)

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              console.warn(`[v0] Skipping step with invalid dates:`, step)
              continue
            }
          } catch (dateError) {
            console.warn(`[v0] Skipping step with date parsing error:`, step, dateError)
            continue
          }

          const workScheduleData = {
            project: projectId,
            section,
            step: step.step,
            title: step.title,
            timeFrame: step.timeFrame,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            workDescription: step.workDescription || "",
            order: i,
          }

          console.log(`[v0] Creating work schedule for step ${i + 1}:`, workScheduleData)

          try {
            const workSchedule = await workScheduleService.createWorkSchedule(workScheduleData)
            workSchedules.push(workSchedule)
            console.log(`[v0] Successfully created work schedule:`, workSchedule)
          } catch (stepError) {
            console.error(`[v0] Failed to create work schedule for step ${i + 1}:`, stepError)
            continue
          }
        }
      }

      console.log(`[v0] Bulk creation completed. Created ${workSchedules.length} work schedules`)
      return workSchedules
    } catch (error) {
      console.error("Error creating bulk work schedules:", error)
      throw new Error(error.message || "Failed to create work schedules")
    }
  },
}

export default workScheduleService
