"use client"

import { useState } from "react"
import subcontractorService from "../services/subcontractorService"
import { useErrorHandler } from "../hooks/useErrorHandler"
import LoadingSpinner from "../components/LoadingSpinner"
import { useAuth } from "../contexts/AuthContext"

const AddSubContractor = ({ isOpen, onClose, onRegister }) => {
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    name: "",
    nic: "",
    email: "",
    phone: "",
    contractType: "Electrical", // Default value
    address: "",
  })

  const contractTypes = [
    "Electrical",
    "Plumbing",
    "Carpentry",
    "Masonry",
    "Painting",
    "Steelwork",
    "Roofing",
    "Landscaping",
  ]

  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const { handleError } = useErrorHandler()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (validationErrors[e.target.name]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: "" })
    }
  }

  const validateForm = () => {
    const errors = {}

    if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters long"
    }

    if (formData.nic.trim().length < 10 || formData.nic.trim().length > 12) {
      errors.nic = "NIC must be between 10 and 12 characters"
    }

    if (formData.phone.trim().length < 10) {
      errors.phone = "Phone number must be at least 10 characters"
    }

    if (formData.address.trim().length < 10) {
      errors.address = "Address must be at least 10 characters long"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const submissionData = {
        ...formData,
        createdBy: user._id,
      }

      console.log("[v0] Submitting subcontractor data:", submissionData)
      console.log("[v0] Current user:", user)

      const response = await subcontractorService.createSubcontractor(submissionData)
      onRegister(response.subcontractor)
      console.log("Subcontractor registered:", response.subcontractor)

      setFormData({
        name: "",
        nic: "",
        email: "",
        phone: "",
        contractType: "Electrical",
        address: "",
      })
      setValidationErrors({})
      onClose()
    } catch (error) {
      console.log("[v0] Subcontractor submission error:", error)
      handleError(error, "Failed to register subcontractor")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold text-green-700 mb-4">Register Sub-Contractor</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="name"
              placeholder="Full Name (min 2 characters)"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${validationErrors.name ? "border-red-500" : ""}`}
              required
            />
            {validationErrors.name && <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>}
          </div>

          <div>
            <input
              type="text"
              name="nic"
              placeholder="NIC Number (10-12 characters)"
              value={formData.nic}
              onChange={handleChange}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${validationErrors.nic ? "border-red-500" : ""}`}
              required
            />
            {validationErrors.nic && <p className="text-red-500 text-sm mt-1">{validationErrors.nic}</p>}
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            required
          />

          <div>
            <input
              type="tel"
              name="phone"
              placeholder="Contact Number (min 10 digits)"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${validationErrors.phone ? "border-red-500" : ""}`}
              required
            />
            {validationErrors.phone && <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>}
          </div>

          <select
            name="contractType"
            value={formData.contractType}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            required
          >
            {contractTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <div>
            <textarea
              name="address"
              placeholder="Full Address (min 10 characters)"
              value={formData.address}
              onChange={handleChange}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${validationErrors.address ? "border-red-500" : ""}`}
              rows="3"
              required
            />
            <div className="flex justify-between items-center mt-1">
              {validationErrors.address && <p className="text-red-500 text-sm">{validationErrors.address}</p>}
              <p className="text-gray-500 text-sm ml-auto">{formData.address.length}/10 characters</p>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <LoadingSpinner size="sm" />}
              {isLoading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSubContractor
