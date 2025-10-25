"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [localError, setLocalError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading, error, clearError } = useAuth()

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

  const handleLogin = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!formData.email || !formData.password) {
      setLocalError("Please fill in all fields")
      return
    }

    if (!formData.email.includes("@")) {
      setLocalError("Please enter a valid email address")
      return
    }

    try {
      await login(formData.email, formData.password)
    } catch (error) {
      // Error is handled by AuthContext
      console.error("Login failed:", error)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const displayError = localError || error

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="flex flex-col bg-white p-6 rounded shadow-lg w-80">
        <div className="flex flex-col items-center">
          <img src="/logo.png" alt="Company Logo" className="h-auto w-auto mb-5" />
          <h1 className="text-3xl font-bold text-primary-light mb-1">Janco Home</h1>
          <h1 className="text-2xl text-primary-light mb-5">Construction</h1>
        </div>
        <form onSubmit={handleLogin}>
          <h2 className="text-2xl font-bold mb-4 text-center text-secondary-accent1">Login</h2>

          {displayError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{displayError}</div>
          )}

          <label className="p-2 text-green-600">Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter Your Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border mb-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            required
            disabled={loading}
          />
          
          <label className="p-2 text-green-600">Password</label>
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter Your Password"
              className="w-full p-2 border focus:outline-none focus:ring-2 focus:ring-green-400 rounded shadow-md pr-10"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              disabled={loading}
            >
              {showPassword ? (
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          
          <h1 className="text-end text-sm p-2 mb-4 text-green-600 cursor-pointer hover:underline">Forgot Password ?</h1>
          <button
            type="submit"
            className="w-full bg-primary-base text-white p-2 rounded shadow-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Copyright Notice */}
          <div className="text-center mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <a 
                href="https://360tecnologies.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 hover:underline cursor-pointer"
              >
                360tecnologies.com
              </a>
              <br />
              © 2025-2026 360 Technologies International. All rights reserved
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login