"use client"
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isLoggedIn, user, loading } = useAuth()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/" replace />
  }


  // Restrict supervisors to Supervisor section only
  if (user && (user.position?.toLowerCase().trim() === "supervisor" || user.role?.toLowerCase().trim() === "supervisor")) {
    // Only allow supervisor routes
    const allowedPaths = [
      "/supervisordash",
      "/supervisordash/addlabor",
      "/supervisordash/labourers",
      "/supervisordash/labourer-salary",
      "/supervisordash/labourer-attendance",
      "/supervisordash/work-schedule",
      "/supervisordash/expenses",
      "/supervisordash/material-stock",
    ]
    const currentPath = window.location.pathname.toLowerCase()
    if (!allowedPaths.includes(currentPath)) {
      return <Navigate to="/supervisordash" replace />
    }
  }

  return children
}

export default ProtectedRoute
