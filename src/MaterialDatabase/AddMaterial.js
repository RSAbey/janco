"use client"

import { useState } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import materialService from "../services/materialService"

const AddMaterialForm = ({ isOpen, onClose, onAddMaterial }) => {
  const [formData, setFormData] = useState({
    material: "",
    supplier: "Sandaruwan Hardware & Suppliers",
    amount: "",
    amountType: "",
    recDate: "",
    updatedOn: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const materialAmountTypeMap = {
    Cement: "Packs",
    Sand: "Cubes",
    "Concrete Stones": "Cubes",
    "Concrete Wire": "Pieces",
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const updatedFormData = { ...formData, [name]: value }

    if (name === "material") {
      updatedFormData.amountType = materialAmountTypeMap[value] || ""
    }

    setFormData(updatedFormData)
  }

  const handleDateChange = (date) => {
    setFormData({ ...formData, recDate: date.toISOString().split("T")[0] })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const materialData = {
        name: formData.material,
        category: formData.material.toLowerCase().replace(/\s+/g, "_"),
        unit: formData.amountType.toLowerCase(),
        quantity: Number.parseFloat(formData.amount),
        supplier: formData.supplier,
        receivedDate: formData.recDate,
        description: `${formData.material} received from ${formData.supplier}`,
      }

      const newMaterial = await materialService.createMaterial(materialData)

      // Call parent callback with the created material
      if (onAddMaterial) {
        onAddMaterial(newMaterial)
      }

      // Reset form
      const currentDate = new Date().toISOString().split("T")[0]
      setFormData({
        material: "",
        supplier: "Sandaruwan Hardware & Suppliers",
        amount: "",
        amountType: "",
        recDate: "",
        updatedOn: currentDate,
      })

      onClose()
    } catch (error) {
      setError(error.message || "Failed to add material")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl text-green-700 mb-4">Add Materials</h2>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            name="material"
            value={formData.material}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            required
          >
            <option value="">Select Material</option>
            <option value="Cement">Cement</option>
            <option value="Sand">Sand</option>
            <option value="Concrete Stones">Concrete Stones</option>
            <option value="Concrete Wire">Concrete Wire</option>
          </select>

          <select
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            required
          >
            <option value="Sandaruwan Hardware & Suppliers">Sandaruwan Hardware & Suppliers</option>
            <option value="Mckinney">Mckinney</option>
            <option value="Ronald Richard">Ronald Richard</option>
          </select>

          <div className="flex gap-2">
            <input
              type="number"
              name="amount"
              placeholder="Amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
              required
            />
            <select
              name="amountType"
              value={formData.amountType}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
              required
            >
              <option value="">Select Type</option>
              <option value="Packs">Packs</option>
              <option value="Cubes">Cubes</option>
              <option value="Pieces">Pieces</option>
            </select>
          </div>

          <DatePicker
            selected={formData.recDate ? new Date(formData.recDate) : null}
            onChange={handleDateChange}
            placeholderText="Received Date"
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            dateFormat="yyyy-MM-dd"
            required
          />

          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 shadow-md disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 shadow-md disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddMaterialForm