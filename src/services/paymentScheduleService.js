import { apiClient } from '../config/api'

const paymentScheduleService = {
  // Create payment schedule
  createPaymentSchedule: async (paymentScheduleData) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required")
      }

      // Format dates properly for backend validation
      const formattedData = {
        ...paymentScheduleData,
        startDate: new Date(paymentScheduleData.startDate).toISOString(),
        endDate: new Date(paymentScheduleData.endDate).toISOString(),
        dueDate: new Date(paymentScheduleData.dueDate).toISOString()
      }

      console.log("Sending payment schedule data:", formattedData)
      const response = await apiClient.post("/payment-schedule", formattedData)
      return response.paymentSchedule
    } catch (error) {
      console.error("Error creating payment schedule:", error)
      throw new Error(error.message || "Failed to create payment schedule")
    }
  },

  // Get payment schedules
  getPaymentSchedules: async (filters = {}) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const params = new URLSearchParams()
      if (filters.projectId) params.append("projectId", filters.projectId)
      if (filters.paymentStatus) params.append("paymentStatus", filters.paymentStatus)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const response = await apiClient.get(`/payment-schedule?${params}`)
      return response.paymentSchedules
    } catch (error) {
      console.error("Error fetching payment schedules:", error)
      throw new Error(error.message || "Failed to fetch payment schedules")
    }
  },

  // Update payment schedule
  updatePaymentSchedule: async (id, updateData) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await apiClient.put(`/payment-schedule/${id}`, updateData)
      return response.paymentSchedule
    } catch (error) {
      console.error("Error updating payment schedule:", error)
      throw new Error(error.message || "Failed to update payment schedule")
    }
  },

  // Delete payment schedule
  deletePaymentSchedule: async (id) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await apiClient.delete(`/payment-schedule/${id}`)
      return response
    } catch (error) {
      console.error("Error deleting payment schedule:", error)
      throw new Error(error.message || "Failed to delete payment schedule")
    }
  },

  // Create multiple payment schedules (bulk create)
  createBulkPaymentSchedules: async (projectId, paymentSteps, workSchedules) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const paymentSchedules = []

      for (let i = 0; i < paymentSteps.length; i++) {
        const paymentStep = paymentSteps[i]

        // Validate required fields
        if (!paymentStep.step || !paymentStep.title || !paymentStep.timeFrame || 
            !paymentStep.startDate || !paymentStep.endDate || !paymentStep.payment) {
          console.warn("Skipping incomplete payment step:", paymentStep)
          continue
        }

        // Find corresponding work schedule
        const workSchedule = workSchedules.find((ws) => ws.step === paymentStep.step)
        if (!workSchedule) {
          console.warn(`Work schedule not found for step: ${paymentStep.step}`)
          continue
        }

        const paymentScheduleData = {
          project: projectId,
          workSchedule: workSchedule._id || workSchedule.id,
          step: paymentStep.step,
          title: paymentStep.title,
          timeFrame: paymentStep.timeFrame,
          startDate: new Date(paymentStep.startDate).toISOString(),
          endDate: new Date(paymentStep.endDate).toISOString(),
          paymentAmount: Number(paymentStep.payment),
          dueDate: new Date(paymentStep.endDate).toISOString(), // Use end date as due date
          order: i,
        }

        console.log("Creating payment schedule:", paymentScheduleData)
        const paymentSchedule = await paymentScheduleService.createPaymentSchedule(paymentScheduleData)
        paymentSchedules.push(paymentSchedule)
      }

      return paymentSchedules
    } catch (error) {
      console.error("Error creating bulk payment schedules:", error)
      throw new Error(error.message || "Failed to create payment schedules")
    }
  },
}

export default paymentScheduleService