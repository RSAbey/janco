"use client"

// App.js
import "./App.css"
import { useState, useEffect } from "react"
import Sidebar from "./components/Sidebar"
import Navbar from "./components/Navbar"
import Dashboard from "./components/Dashboard"
import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import Login from "./Login/Login"
import Register from "./components/Register"
import SupplierDetails from "./Supplier_Details/SupplierDetails"
import SupplierInvoice from "./Supplier_Details/SupplierInvoice"
import MaterialDatabase from "./MaterialDatabase/MaterialDetails"
import CustomersDetails from "./Customers/CustomersDetails"
import DisplaySites from "./ConstructionArea/DisplaySites"
import ProjectInterface from "./ConstructionArea/ProjectInterface"
import SiteDetails from "./ConstructionArea/SiteDetail"
import SupervisorDashboard from "./Supervisor/SupervisorDashboard"
import AddLaborForm from "./components/Forms/AddLaborForm"
import AddMaterial from "./components/Forms/AddMaterial"
import AddExpensesForm from "./components/Forms/AddExpensesForm"
import Attendance from "./Supervisor/Attendance"
import FinanceSection from "./Finance/FinanceSection"
import EmployerInterface from "./EmployerSection/EmployerInterface"
import GlobalErrorBoundary from "./components/GlobalErrorBoundary"
import LabourerDetails from "./Supervisor/LabourerDetails"
import SupervisorLabourerSalary from "./Supervisor/SupervisorLabourerSalary"
import SupervisorLabourerAttendance from "./Supervisor/SupervisorLabourerAttendance"
import SupervisorWorkSchedule from "./Supervisor/SupervisorWorkSchedule"
import SupervisorExpenses from "./Supervisor/SupervisorExpenses"
import MaterialStockSupervisor from "./Supervisor/MaterialStockSupervisor"

const ProtectedRoute = ({ element }) => {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? element : <Navigate to="/" />
}

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768)

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`bg-green-100 transition-all duration-300 ${
            isSidebarOpen ? "w-56 md:w-16 lg:w-56" : "w-0 md:w-16 lg:w-56"
          } relative md:relative z-50 h-full`}
        >
          <Sidebar isOpen={isSidebarOpen} />
        </div>
        <div className="flex-1 p-4 min-w-0">{children}</div>
      </div>
    </div>
  )
}

function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes wrapped in layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <Dashboard />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <SupplierDetails />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/suppliers/invoice/:id"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <SupplierInvoice />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/materials"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <MaterialDatabase />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <CustomersDetails />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/constructionSites"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <DisplaySites />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/constructionSites/projectDetails"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <ProjectInterface />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/constructionSites/sitedetails"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <SiteDetails />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/supervisordash"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <SupervisorDashboard />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/supervisordash/Addlabor"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <AddLaborForm />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/supervisordash/labourers"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <LabourerDetails />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/supervisordash/labourer-salary"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <SupervisorLabourerSalary />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/supervisordash/labourer-attendance"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <SupervisorLabourerAttendance />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/supervisordash/work-schedule"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <SupervisorWorkSchedule />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/supervisordash/expenses"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <SupervisorExpenses />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/supervisordash/material-stocks"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <MaterialStockSupervisor />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/finance"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <FinanceSection />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/addMaterial"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <AddMaterial />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/addExpenses"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <AddExpensesForm />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute
                element={
                  <Layout>
                    <EmployerInterface />
                  </Layout>
                }
              />
            }
          />
          {/* Catch-all fallback to dashboard if logged in, else login */}
          <Route path="*" element={<ProtectedRoute element={<Navigate to="/dashboard" />} />} />
        </Routes>
      </AuthProvider>
    </GlobalErrorBoundary>
  )
}

export default App
