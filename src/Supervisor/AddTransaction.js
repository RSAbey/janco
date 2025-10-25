"use client"

import { useState } from "react"
import { FaTimes, FaUpload } from "react-icons/fa"
import cloudinaryService from "../services/cloudinaryService"

const AddTransaction = ({ isOpen, onClose, onSubmit, projectId }) => {
  const [formData, setFormData] = useState({
    type: "expense",
    category: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Cash",
    notes: "",
  })
  const [paymentSlip, setPaymentSlip] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const categories = {
    expense: ["Materials", "Labor", "Equipment", "Transportation", "Permits", "Utilities", "Subcontractor", "Other"],
    income: ["Client Payment", "Advance Payment", "Other"],
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Reset category when type changes
    if (name === "type") {
      setFormData((prev) => ({
        ...prev,
        category: "",
      }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type and size
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
      const maxSize = 5 * 1024 * 1024 // 5MB

      if (!validTypes.includes(file.type)) {
        setError("Please select a valid image (JPEG, PNG) or PDF file")
        return
      }

      if (file.size > maxSize) {
        setError("File size must be less than 5MB")
        return
      }

      setPaymentSlip(file)
      setError("")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Validate required fields
      if (!formData.category || !formData.description || !formData.amount) {
        throw new Error("Please fill in all required fields")
      }

      let paymentSlipUrl = null

      // Upload payment slip if provided
      if (paymentSlip) {
        setUploading(true)
        try {
          paymentSlipUrl = await cloudinaryService.uploadFile(paymentSlip)
        } catch (uploadError) {
          throw new Error("Failed to upload payment slip: " + uploadError.message)
        } finally {
          setUploading(false)
        }
      }

      // Prepare transaction data
      const transactionData = {
        ...formData,
        amount: Number.parseFloat(formData.amount),
        paymentSlip: paymentSlipUrl,
        projectId,
      }

      await onSubmit(transactionData)

      // Reset form
      setFormData({
        type: "expense",
        category: "",
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "Cash",
        notes: "",
      })
      setPaymentSlip(null)
      onClose()
    } catch (err) {
      setError(err.message || "Failed to add transaction")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add Transaction</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={loading}>
            <FaTimes />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Category</option>
              {categories[formData.type].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Check">Check</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Payment Slip Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Slip</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="hidden"
                id="paymentSlip"
              />
              <label htmlFor="paymentSlip" className="flex flex-col items-center cursor-pointer">
                <FaUpload className="text-gray-400 text-2xl mb-2" />
                <span className="text-sm text-gray-600">
                  {paymentSlip ? paymentSlip.name : "Click to upload payment slip"}
                </span>
                <span className="text-xs text-gray-400 mt-1">Images or PDF, max 5MB</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Additional notes (optional)"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || uploading}
            >
              {loading ? (uploading ? "Uploading..." : "Adding...") : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTransaction
