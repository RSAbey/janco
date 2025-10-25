"use client"

import { useState } from "react"
import supplierService from "../services/supplierService"

const AddSupplier = ({ isOpen, onClose, onRegister }) => {
  // Add to formData state
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    category: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    bankName: "",
    accountNumber: "",
    accountDetails: "",
    branch: "",
    paymentTerms: "net_30", // Add this
  });
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    // Clear error when user starts typing
    if (error) setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supplierData = {
        name: formData.name || formData.companyName,
        companyName: formData.companyName,
        category: formData.category,
        contactInfo: {
          primaryContact: {
            phone: formData.phone,
            email: formData.email,
          },
        },
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
        },
        bankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountDetails: formData.accountDetails,
          branch: formData.branch,
        },
        financialInfo: {
          paymentTerms: formData.paymentTerms, 
        },
      }

      const newSupplier = await supplierService.createSupplier(supplierData)

      // Call parent callback with the created supplier
      if (onRegister) {
        onRegister(newSupplier)
      }

      // Reset form
      setFormData({
        name: "",
        companyName: "",
        category: "",
        phone: "",
        email: "",
        street: "",
        city: "",
        state: "",
        bankName: "",
        accountNumber: "",
        accountDetails: "",
        branch: "",
        paymentTerms: "net_30",
      })

      onClose()
    } catch (error) {
      setError(error.message || "Failed to register supplier")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-green-700 mb-4">Register Supplier</h2>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="companyName"
            placeholder="Company Name"
            value={formData.companyName}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            required
            disabled={loading}
          />
          <input
            type="text"
            name="name"
            placeholder="Contact Person Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            disabled={loading}
          />
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            required
            disabled={loading}
          >
            <option value="">Select Category</option>
            <option value="building_materials">Building Materials</option>
            <option value="electrical_supplies">Electrical Supplies</option>
            <option value="plumbing_supplies">Plumbing Supplies</option>
            <option value="tools_equipment">Tools & Equipment</option>
            <option value="safety_equipment">Safety Equipment</option>
            <option value="paint_chemicals">Paint & Chemicals</option>
            <option value="hardware">Hardware</option>
            <option value="services">Services</option>
            <option value="other">Other</option>
          </select>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            disabled={loading}
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            required
            disabled={loading}
          />
          <input
            type="text"
            name="street"
            placeholder="Street Address"
            value={formData.street}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            required
            disabled={loading}
          />
          <div className="flex gap-2">
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              required
              disabled={loading}
            />
            <input
              type="text"
              name="state"
              placeholder="State"
              value={formData.state}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              required
              disabled={loading}
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              name="bankName"
              placeholder="Bank Name"
              value={formData.bankName}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              disabled={loading}
            />
            <input
              type="text"
              name="accountNumber"
              placeholder="Account Number"
              value={formData.accountNumber}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              disabled={loading}
            />
          </div>
          <input
            type="text"
            name="branch"
            placeholder="Bank Branch"
            value={formData.branch}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            disabled={loading}
          />
          <select
            name="paymentTerms"
            value={formData.paymentTerms}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            disabled={loading}
          >
            <option value="net_15">Net 15</option>
            <option value="net_30">Net 30</option>
            <option value="net_45">Net 45</option>
            <option value="net_60">Net 60</option>
            <option value="cod">COD</option>
            <option value="advance">Advance</option>
          </select>
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
              {loading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSupplier