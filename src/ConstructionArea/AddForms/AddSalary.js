"use client"

import { useState, useEffect } from "react"
import labourService from "../../services/labourService"

const AddSalary = ({ isOpen, onClose, onRegister, projectId }) => {
  const [selectedLabour, setSelectedLabour] = useState("")
  const [labourList, setLabourList] = useState([])
  const [formData, setFormData] = useState({
    amount: "",
    payPeriod: "monthly",
    paymentDate: new Date().toISOString().split('T')[0],
    description: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Fetch labourers for the current project
  useEffect(() => {
    const fetchLabourers = async () => {
      if (projectId) {
        try {
          const labourers = await labourService.getLabourers({ projectId })
          setLabourList(labourers)
        } catch (err) {
          console.error("Failed to fetch labourers:", err)
        }
      }
    }

    fetchLabourers()
  }, [projectId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedLabour || !formData.amount) return

    setLoading(true)
    setError("")

    try {
      const salaryData = {
        labour: selectedLabour,
        project: projectId,
        amount: Number.parseFloat(formData.amount),
        payPeriod: formData.payPeriod,
        paymentDate: formData.paymentDate,
        description: formData.description || `Salary payment for labourer`
      }

      const newSalary = await labourService.createSalary(salaryData)

      if (onRegister) {
        onRegister(newSalary)
      }

      setSelectedLabour("")
      setFormData({ amount: "", payPeriod: "monthly", paymentDate: new Date().toISOString().split('T')[0], description: "" })
      onClose()
    } catch (error) {
      setError(error.message || "Failed to add salary")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center animate-fade-in">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold text-green-700 mb-4">Add Salary</h2>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={selectedLabour}
            onChange={(e) => setSelectedLabour(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            required
          >
            <option value="">Select Labourer</option>
            {labourList.map((labour) => (
              <option key={labour._id} value={labour._id}>
                {labour.name} ({labour.labourId})
              </option>
            ))}
          </select>

          <input
            type="number"
            name="amount"
            placeholder="Salary Amount"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            required
          />

          <select
            name="payPeriod"
            value={formData.payPeriod}
            onChange={(e) => setFormData({...formData, payPeriod: e.target.value})}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="project">Project-based</option>
          </select>

          <input
            type="date"
            name="paymentDate"
            value={formData.paymentDate}
            onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            required
          />

          <textarea
            name="description"
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            rows={3}
          />

          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Salary"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSalary