"use client"

import { useState, useEffect } from "react"

const EditSalaryForm = ({ isOpen, onClose, onSave, salary }) => {
  const [formData, setFormData] = useState({
    amount: "",
    status: "",
    description: "",
  })

  useEffect(() => {
    if (salary) {
      setFormData({
        amount: salary.amount || "",
        status: salary.status || "pending",
        description: salary.description || "",
      })
    }
  }, [salary, isOpen])

  if (!isOpen || !salary) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center animate-fade-in z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold text-green-700 mb-4">Edit Salary Payment</h2>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Labourer Details:</h3>
          <p>
            <strong>Name:</strong> {salary.labour?.name || "N/A"}
          </p>
          <p>
            <strong>ID:</strong> {salary.labour?.labourId || "N/A"}
          </p>
          <p>
            <strong>Skill Level:</strong> {salary.labour?.skillLevel || "N/A"}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave(formData)
            onClose()
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Amount (Rs)</label>
            <input
              type="number"
              name="amount"
              placeholder="Salary Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              name="description"
              placeholder="Payment description or notes"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              rows="3"
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
            >
              Cancel
            </button>
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
              Update Salary
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditSalaryForm
