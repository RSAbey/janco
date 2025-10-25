"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"

function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "employee",
    department: "construction",
    phoneNumber: "",
  })
  const [localError, setLocalError] = useState("")
  const { register, loading, error, clearError } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear errors when user starts typing
    if (localError) setLocalError("")
    if (error) clearError()
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setLocalError("Please fill in all required fields")
      return
    }

    if (!formData.email.includes("@")) {
      setLocalError("Please enter a valid email address")
      return
    }

    if (formData.password.length < 6) {
      setLocalError("Password must be at least 6 characters long")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match")
      return
    }

    // Check password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
    if (!passwordRegex.test(formData.password)) {
      setLocalError("Password must contain at least one uppercase letter, one lowercase letter, and one number")
      return
    }

    try {
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        phoneNumber: formData.phoneNumber || undefined,
      }
      await register(registrationData)
    } catch (error) {
      console.error("Registration failed:", error)
    }
  }

  const displayError = localError || error

  return (
    <div className="flex items-center justify-center bg-gray-100 py-8">
      <div className="flex flex-col bg-white p-6 rounded shadow-lg w-96 max-w-md my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col items-center">
          <img src="/logo.png" alt="Company Logo" className="h-auto w-auto mb-5" />
          <h1 className="text-3xl font-bold text-primary-light mb-1">Janco Home</h1>
          <h1 className="text-2xl text-primary-light mb-5">Construction</h1>
        </div>

        <form onSubmit={handleRegister}>
          <h2 className="text-2xl font-bold mb-4 text-center text-secondary-accent1">Register</h2>

          {displayError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {displayError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-green-600 text-sm mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm text-sm"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-green-600 text-sm mb-1">Last Name *</label>
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm text-sm"
                required
                disabled={loading}
              />
            </div>
          </div>

          <label className="block text-green-600 text-sm mb-1">Email *</label>
          <input
            type="email"
            name="email"
            placeholder="Enter Your Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border mb-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
            required
            disabled={loading}
          />

          <label className="block text-green-600 text-sm mb-1">Phone Number</label>
          <input
            type="tel"
            name="phoneNumber"
            placeholder="Phone Number (Optional)"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="w-full p-2 border mb-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
            disabled={loading}
          />

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-green-600 text-sm mb-1">Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm text-sm"
                required
                disabled={loading}
              >
                <option value="employee">Employee</option>
                <option value="supervisor">Supervisor</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-green-600 text-sm mb-1">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm text-sm"
                disabled={loading}
              >
                <option value="construction">Construction</option>
                <option value="finance">Finance</option>
                <option value="administration">Administration</option>
                <option value="procurement">Procurement</option>
              </select>
            </div>
          </div>

          <label className="block text-green-600 text-sm mb-1">Password *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter Your Password"
            className="w-full p-2 border mb-4 focus:outline-none focus:ring-2 focus:ring-green-400 rounded shadow-sm"
            required
            disabled={loading}
          />

          <label className="block text-green-600 text-sm mb-1">Confirm Password *</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm Your Password"
            className="w-full p-2 border mb-4 focus:outline-none focus:ring-2 focus:ring-green-400 rounded shadow-sm"
            required
            disabled={loading}
          />

          <div className="text-xs text-gray-600 mb-4">
            Password must contain at least 6 characters with one uppercase, one lowercase, and one number.
          </div>

          <button
            type="submit"
            className="w-full bg-primary-base text-white p-2 rounded shadow-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Register"}
          </button>

          <div className="text-center">
            <span className="text-sm text-gray-600">Already have an account? </span>
            <button
              type="button"
              onClick={() => (window.location.href = "/login")}
              className="text-sm text-green-600 hover:underline"
            >
              Login here
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register