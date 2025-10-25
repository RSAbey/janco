"use client"

import { useState, useEffect } from "react"
import subcontractorService from "../services/subcontractorService"
import { useErrorHandler } from "../hooks/useErrorHandler"
import LoadingSpinner from "../components/LoadingSpinner"

const AppointSubcontractorForm = ({ onClose, onSubmit, isOpen, projectId }) => {
  const [subcontractors, setSubcontractors] = useState([])
  const [selectedSubcontractor, setSelectedSubcontractor] = useState("")
  const [startDate, setStartDate] = useState("2024-12-21")
  const [endDate, setEndDate] = useState("2025-12-21")
  const [cost, setCost] = useState("400000")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSubcontractors, setIsLoadingSubcontractors] = useState(true)
  const { handleError } = useErrorHandler()

  useEffect(() => {
    const loadSubcontractors = async () => {
      try {
        const response = await subcontractorService.getAllSubcontractors()
        setSubcontractors(response.subcontractors)
        if (response.subcontractors.length > 0) {
          setSelectedSubcontractor(response.subcontractors[0]._id)
        }
      } catch (error) {
        handleError(error, "Failed to load subcontractors")
      } finally {
        setIsLoadingSubcontractors(false)
      }
    }

    if (isOpen) {
      loadSubcontractors()
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const appointmentData = {
        project: projectId,
        startDate,
        endDate,
        cost: Number.parseFloat(cost.replace(/,/g, "")),
      }

      const response = await subcontractorService.appointSubcontractor(selectedSubcontractor, appointmentData)

      const selectedSubcontractorData = subcontractors.find((sc) => sc._id === selectedSubcontractor)
      const duration = `From ${startDate} to ${endDate}`

      onSubmit({
        subcontractor: selectedSubcontractorData?.name || "Unknown",
        duration,
        cost: cost,
        appointment: response.appointment,
      })
      onClose()
    } catch (error) {
      handleError(error, "Failed to appoint subcontractor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-6 text-center">Appoint Sub Contractor</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Subcontractor Selection */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left">Select Sub Contractor</label>
            {isLoadingSubcontractors ? (
              <div className="flex items-center justify-center p-2">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Loading subcontractors...</span>
              </div>
            ) : (
              <select
                value={selectedSubcontractor}
                onChange={(e) => setSelectedSubcontractor(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none"
                required
              >
                {subcontractors.map((subcontractor) => (
                  <option key={subcontractor._id} value={subcontractor._id}>
                    {subcontractor.name} - {subcontractor.contractType}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Duration Field */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left">Duration</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-1/2 border border-gray-300 p-2 rounded focus:outline-none"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-1/2 border border-gray-300 p-2 rounded focus:outline-none"
              />
            </div>
          </div>

          {/* Cost Field */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left">Appointment Cost</label>
            <input
              type="text"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded text-sm"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded shadow-md hover:bg-green-700 flex items-center gap-2"
              disabled={isLoading || isLoadingSubcontractors}
            >
              {isLoading && <LoadingSpinner size="sm" />}
              {isLoading ? "Appointing..." : "Appoint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AppointSubcontractorForm
