"use client"

import { createContext, useState, useContext, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import authService from "../services/authService"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // Check if user is already authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userData = authService.getStoredUser()
          const token = localStorage.getItem("token")
          console.log("[v0] Token exists:", !!token)
          console.log("[v0] Token length:", token?.length)
          console.log("[v0] User data:", userData)
          setUser(userData)
          setIsLoggedIn(true)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        authService.logout()
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Login function with backend authentication
  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)

      const response = await authService.login(email, password)

      console.log("[v0] Login response:", response)
      console.log("[v0] Token after login:", localStorage.getItem("token"))

      setUser(response.user)
      setIsLoggedIn(true)

  // Navigate based on user role/position
  const redirectPath = getRoleBasedRedirect(response.user.role, response.user.position)
  navigate(redirectPath)

      return response
    } catch (error) {
      console.log("[v0] Login error:", error.message)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await authService.register(userData)

      console.log("[v0] Register response:", response)
      console.log("[v0] Token after register:", localStorage.getItem("token"))

      setUser(response.user)
      setIsLoggedIn(true)

  const redirectPath = getRoleBasedRedirect(response.user.role, response.user.position)
  navigate(redirectPath)

      return response
    } catch (error) {
      console.log("[v0] Register error:", error.message)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    authService.logout()
    setIsLoggedIn(false)
    setUser(null)
    setError(null)
    navigate("/")
  }

  // Get role-based redirect path
  // Get role/position-based redirect path
  const getRoleBasedRedirect = (role, position) => {
    // Accept both role and position for flexibility
    const pos = (position || role || "").toLowerCase().trim()
    if (pos === "supervisor" || pos === "supervisor ") {
      return "/supervisordash"
    }
    if (pos === "manager") {
      return "/dashboard"
    }
    if (pos === "employee") {
      return "/employee"
    }
    return "/dashboard"
  }

  // Check if user has required role
  const hasRole = (requiredRoles) => {
    if (!user) return false
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role)
    }
    return user.role === requiredRoles
  }

  // Update password
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true)
      setError(null)

      const response = await authService.updatePassword(currentPassword, newPassword)
      return response
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Clear error
  const clearError = () => {
    setError(null)
  }

  const value = {
    isLoggedIn,
    user,
    loading,
    error,
    login,
    register,
    logout,
    hasRole,
    updatePassword,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
