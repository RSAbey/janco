"use client"

import { useState } from "react"
import cloudinaryService from "../services/cloudinaryService"

const AddExpenseForm = ({ onClose, onSubmit }) => {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [formData, setFormData] = useState({
    date: getTodayDate(), // Set to today's date
    section: "Construction Site",
    description: "",
    type: "income",
    amount: "",
    paymentSlip: "",
  })

  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setIsUploading(true)
      let paymentSlipUrl = formData.paymentSlip

      if (selectedFile) {
        setUploadProgress(25)
        const uploadResult = await cloudinaryService.uploadFile(selectedFile)
        paymentSlipUrl = uploadResult.url
        setUploadProgress(75)
      }

      const submissionData = {
        ...formData,
        amount: Number.parseFloat(formData.amount.replace(/,/g, "")), // Remove commas from amount
        paymentSlip: paymentSlipUrl,
      }

      setUploadProgress(100)
      await onSubmit(submissionData)
    } catch (error) {
      console.error("Error submitting expense:", error)
      alert("Failed to submit expense. Please try again.")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/,/g, "")
    if (!isNaN(value) || value === "") {
      setFormData((prev) => ({
        ...prev,
        amount: value,
      }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "application/pdf"]
      if (!allowedTypes.includes(file.type)) {
        alert("Please select a valid image file (JPEG, PNG, GIF) or PDF")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB")
        return
      }

      setSelectedFile(file)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl relative">
        <h2 className="text-xl font-bold text-center mb-6">Add New Record</h2>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
          disabled={isUploading}
        >
          &times;
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3"
              required
              disabled={isUploading}
            />
          </div>

          {/* Section */}
          <div>
            <label className="block text-sm font-medium mb-1">Select the Section</label>
            <select
              name="section"
              value={formData.section}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3"
              required
              disabled={isUploading}
            >
              <option value="Construction Site">Construction Site</option>
              <option value="Employee">Employee</option>
              <option value="Supplier">Supplier</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              name="description"
              placeholder="Rajagiriya Site Employee Salary"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3"
              required
              disabled={isUploading}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === "income"}
                  onChange={handleChange}
                  disabled={isUploading}
                />
                <span>Income</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === "expense"}
                  onChange={handleChange}
                  disabled={isUploading}
                />
                <span>Expense</span>
              </label>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="text"
              name="amount"
              placeholder="60,000.00"
              value={formData.amount.toLocaleString()}
              onChange={handleAmountChange}
              className="w-full border border-gray-300 rounded-xl p-3"
              required
              disabled={isUploading}
            />
          </div>

          {/* Upload */}
          <div>
            <label className="block text-sm font-medium mb-1">Upload Payment Slip</label>
            <input
              type="file"
              name="paymentSlip"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-xl p-3"
              accept="image/*,.pdf"
              disabled={isUploading}
            />
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            {isUploading && uploadProgress > 0 && (
              <div className="mt-2">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{uploadProgress < 100 ? "Uploading..." : "Processing..."}</p>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isUploading}
          >
            {isUploading ? "Adding..." : "Add"}
          </button>
        </form>
      </div>
    </div>
  )
}
 
export default AddExpenseForm