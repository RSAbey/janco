"use client"

import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import VerticalProgressBar from "./VerticalProgressBar"
import AppointSubcontractorForm from "./AppointSubcontractorForm"
import EditCustomerForm from "./EditForms/EditCustomerForm"
import customerService from "../services/customerService"
import transactionService from "../services/transactionService"
import subcontractorService from "../services/subcontractorService"
import projectService from "../services/projectService"
import labourService from "../services/labourService"
import workScheduleService from "../services/workScheduleService"
import paymentScheduleService from "../services/paymentScheduleService"

const SiteDetails = ({ projectId }) => {
  const location = useLocation()
  const [showForm, setShowForm] = useState(false)
  const [showCustomerEditForm, setShowCustomerEditForm] = useState(false)
  const [customerData, setCustomerData] = useState(null)
  const [projectData, setProjectData] = useState(null)
  const [financialSummary, setFinancialSummary] = useState({
    currentProfit: 0,
    lastIncome: 0,
    lastIncomeDate: null,
    materialCost: 0,
    labourerSalary: 0,
    paidLabourerSalary: 0,
    subcontractorExpenses: 0,
    appointedSubcontractorExpenses: 0,
    totalExpenses: 0,
    totalRevenue: 0,
  })
  const [appointedSubcontractors, setAppointedSubcontractors] = useState([])
  const [taskProgress, setTaskProgress] = useState({
    totalAmount: 0,
    completedAmount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const site = projectData || location.state?.site || null
  const currentProjectId = projectId || site?._id || site?.id

  // Debug: Log the site object to see what properties are available
  useEffect(() => {
    console.log("[v0] Component props and state:", {
      projectIdProp: projectId,
      locationSite: location.state?.site,
      currentProjectId,
      projectData,
    })
  }, [projectId, location.state?.site, currentProjectId, projectData])

  // Helper function to format numbers to 100,000,000.00 standard
  const formatPrice = (value) => {
    if (value === "N/A" || value === null || value === undefined) return "N/A"
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return "N/A"
    
    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const calculateDurationInDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const durationInDays = site ? calculateDurationInDays(site.startDate, site.endDate) : 0

  // Helper function to get property with fallbacks
  const getProperty = (obj, primaryKey, fallbackKeys = []) => {
    if (obj[primaryKey] !== undefined && obj[primaryKey] !== null) {
      return obj[primaryKey]
    }

    for (const key of fallbackKeys) {
      if (obj[key] !== undefined && obj[key] !== null) {
        return obj[key]
      }
    }

    return "N/A"
  }

  const fetchProjectData = async () => {
    if (!currentProjectId) {
      console.log("[v0] No project ID available")
      return
    }

    try {
      console.log("[v0] Fetching project data for ID:", currentProjectId)
      const project = await projectService.getProject(currentProjectId)
      console.log("[v0] Project data fetched:", project)
      setProjectData(project)
      return project
    } catch (err) {
      console.error("[v0] Error fetching project data:", err)
      setError("Failed to load project data")
      return null
    }
  }

  const fetchCustomerData = async (project = null) => {
    const projectToUse = project || site
    if (!projectToUse) {
      console.log("[v0] No project data available for customer fetch")
      return
    }

    try {
      console.log("[v0] Fetching customer data for project:", projectToUse)

      let customerId = null
      let customerData = null

      // First check if customer data is already populated in the project
      if (projectToUse.customerId && typeof projectToUse.customerId === "object") {
        console.log("[v0] Customer data already populated in project:", projectToUse.customerId)
        customerData = projectToUse.customerId
      } else if (projectToUse.customerId && typeof projectToUse.customerId === "string") {
        // If customerId is just a string ID, fetch the customer data
        customerId = projectToUse.customerId
      } else {
        // Try different possible customer ID properties from project data
        customerId =
          projectToUse.customerId ||
          projectToUse.customer ||
          projectToUse.customerID ||
          projectToUse.customerObject ||
          projectToUse.client ||
          projectToUse.clientId
      }

      console.log("[v0] Looking for customer ID in project object:", {
        customerId,
        customerData,
        hasCustomerId: !!customerId,
        hasCustomerData: !!customerData,
        projectKeys: Object.keys(projectToUse),
      })

      // If we already have customer data from population, use it
      if (customerData) {
        console.log("[v0] Using populated customer data:", customerData)
        setCustomerData(customerData)
        return
      }

      // If we have a customer ID, fetch the customer data
      if (customerId) {
        console.log("[v0] Found customer ID:", customerId)
        try {
          const response = await customerService.getCustomerById(customerId)
          if (response && response.customer) {
            console.log("[v0] Customer data fetched successfully:", response.customer)
            setCustomerData(response.customer)
            return
          }
        } catch (err) {
          console.warn("[v0] Error fetching specific customer, will use default:", err)
          // Continue to default case if specific customer fetch fails
        }
      }

      // If no customer ID found or fetch failed, set to null/default
      console.log("[v0] No valid customer ID found or fetch failed, using default data")
      setCustomerData({
        name: "No Customer Assigned",
        contactInfo: {
          primaryContact: {
            email: "N/A",
          },
        },
        nic: "N/A",
        phone: "N/A",
        address: "N/A",
      })
    } catch (err) {
      console.error("[v0] Error in customer data fetch:", err)
      setError("Failed to load customer data")
      // Set default customer data on error too
      setCustomerData({
        name: "Error Loading Customer",
        contactInfo: {
          primaryContact: {
            email: "N/A",
          },
        },
        nic: "N/A",
        phone: "N/A",
        address: "N/A",
      })
    }
  }

  const fetchFinancialData = async () => {
    if (!currentProjectId) {
      console.log("[v0] No project ID found for financial data")
      return
    }

    try {
      console.log("[v0] Fetching financial data for project:", currentProjectId)
      const response = await transactionService.getProjectTransactions(currentProjectId)

      const paidSalaryData = await labourService.getPaidSalaryTotalByProject(currentProjectId)
      console.log("[v0] Paid salary data:", paidSalaryData)

      if (response && response.data) {
        console.log("[v0] Financial data received:", response.data)
        const { summary, transactions } = response.data

        const expenses = transactions.filter((t) => t.type === "expense")
        const materialCost = expenses.filter((e) => e.category === "Materials").reduce((sum, e) => sum + e.amount, 0)
        const labourerSalary = expenses.filter((e) => e.category === "Labor").reduce((sum, e) => sum + e.amount, 0)
        const subcontractorExpenses = expenses
          .filter((e) => e.category === "Subcontractor")
          .reduce((sum, e) => sum + e.amount, 0)

        const incomeTransactions = transactions
          .filter((t) => t.type === "income")
          .sort((a, b) => new Date(b.date) - new Date(a.date))

        const lastIncome = incomeTransactions.length > 0 ? incomeTransactions[0] : null

        const appointedSubcontractorTotal = calculateSubcontractorExpenses()
        console.log("[v0] Appointed subcontractor total:", appointedSubcontractorTotal)

        const totalExpenses =
          materialCost + labourerSalary + (paidSalaryData.totalPaid || 0) + appointedSubcontractorTotal

        const currentProfit = (summary.totalIncome || 0) - totalExpenses

        setFinancialSummary({
          currentProfit,
          lastIncome: lastIncome ? lastIncome.amount : 0,
          lastIncomeDate: lastIncome ? lastIncome.date : null,
          materialCost,
          labourerSalary,
          paidLabourerSalary: paidSalaryData.totalPaid || 0,
          subcontractorExpenses,
          appointedSubcontractorExpenses: appointedSubcontractorTotal,
          totalExpenses,
          totalRevenue: summary.totalIncome || 0,
        })
      }
    } catch (err) {
      console.error("[v0] Error fetching financial data:", err)
      setError("Failed to load financial data")
    }
  }

  const calculateSubcontractorExpenses = () => {
    if (!appointedSubcontractors || appointedSubcontractors.length === 0) {
      return 0
    }

    return appointedSubcontractors.reduce((total, subcontractor) => {
      const projectAppointment = subcontractor.appointments?.find(
        (app) => app.project && app.project.toString() === currentProjectId,
      )
      return total + (projectAppointment?.cost || 0)
    }, 0)
  }

  const fetchAppointedSubcontractors = async () => {
    if (!currentProjectId) return

    try {
      console.log("[v0] Fetching subcontractors for project:", currentProjectId)
      const response = await subcontractorService.getAllSubcontractors()
      if (response.subcontractors) {
        const appointed = response.subcontractors.filter(
          (sub) =>
            sub.appointments &&
            sub.appointments.some((app) => app.project && app.project.toString() === currentProjectId),
        )
        console.log("[v0] Appointed subcontractors:", appointed)
        setAppointedSubcontractors(appointed)
        return appointed
      }
    } catch (err) {
      console.error("[v0] Error fetching subcontractors:", err)
      setError("Failed to load subcontractor data")
    }
    return []
  }

  const handleAppoint = async (data) => {
    console.log("[v0] Subcontractor appointed:", data)
    await fetchAppointedSubcontractors()
    await fetchFinancialData()
  }

  const handleCustomerEdit = async (updatedData) => {
    try {
      console.log("[v0] Updating customer:", updatedData)

      // Get the customer ID
      const customerId = customerData._id || customerData.id

      if (!customerId) {
        console.error("[v0] No customer ID found")
        alert("Error: Customer ID not found")
        return
      }

      // Prepare the update payload matching the backend schema
      const updatePayload = {
        name: updatedData.name,
        nic: updatedData.nic,
        phone: updatedData.phone,
        contactInfo: {
          primaryContact: {
            email: updatedData.email,
            phone: updatedData.phone,
            mobile: updatedData.phone,
          },
        },
        address: {
          street: updatedData.street,
          city: updatedData.city,
          state: updatedData.state,
        },
      }

      console.log("[v0] Sending update payload:", updatePayload)

      // Call the customer service to update
      const response = await customerService.updateCustomer(customerId, updatePayload)

      console.log("[v0] Customer updated successfully:", response)

      // Update local state with the new customer data
      if (response && response.customer) {
        setCustomerData(response.customer)
      }

      // Close the modal
      setShowCustomerEditForm(false)

      // Show success message
      alert("Customer updated successfully!")
    } catch (error) {
      console.error("[v0] Error updating customer:", error)
      alert("Failed to update customer. Please try again.")
    }
  }

  const fetchTaskProgress = async () => {
    if (!currentProjectId) return

    try {
      const workSchedules = await workScheduleService.getWorkSchedules({
        projectId: currentProjectId,
      })
      const paymentSchedules = await paymentScheduleService.getPaymentSchedules({
        projectId: currentProjectId,
      })

      let totalAmount = 0
      let completedAmount = 0

      if (workSchedules && workSchedules.length > 0) {
        workSchedules.forEach((schedule) => {
          // Find corresponding payment schedule
          let paymentSchedule = null

          if (paymentSchedules) {
            paymentSchedule = paymentSchedules.find((ps) => ps.workSchedule === schedule._id)

            if (!paymentSchedule) {
              paymentSchedule = paymentSchedules.find(
                (ps) => ps.step === schedule.step && ps.section === schedule.section,
              )
            }

            if (!paymentSchedule) {
              paymentSchedule = paymentSchedules.find((ps) => ps.step === schedule.step)
            }
          }

          const amount = paymentSchedule ? paymentSchedule.paymentAmount : 0
          totalAmount += amount

          if (schedule.status === "completed") {
            completedAmount += amount
          }
        })
      }

      setTaskProgress({
        totalAmount,
        completedAmount,
      })
    } catch (err) {
      console.error("[v0] Error fetching task progress:", err)
    }
  }

  useEffect(() => {
    if (!currentProjectId && !location.state?.site) {
      setLoading(false)
      return
    }

    const fetchAllData = async () => {
      setLoading(true)
      try {
        console.log("[v0] Starting data fetch for project ID:", currentProjectId)

        let project = null
        if (projectId && !projectData) {
          project = await fetchProjectData()
        }

        await fetchCustomerData(project)
        await fetchAppointedSubcontractors()
        await fetchFinancialData()
        await fetchTaskProgress()
      } catch (err) {
        console.error("[v0] Error fetching data:", err)
        setError("Failed to load site data")
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [projectId, currentProjectId, location.state?.site])

  useEffect(() => {
    if (appointedSubcontractors.length > 0 && currentProjectId) {
      console.log("[v0] Recalculating financial data after subcontractors loaded")
      fetchFinancialData()
    }
  }, [appointedSubcontractors])

  if (!currentProjectId && !site) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">No site data available. Please navigate from the sites list.</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading site details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  const siteName = getProperty(site, "name", ["siteName", "projectName"])
  const locationText = getProperty(site, "location", ["siteAddress", "address"])
  const supervisor = getProperty(site, "supervisor", ["supervisorName"])
  const estimatedCost = getProperty(site, "estimatedCost", ["budget", "totalCost"])
  const documentFileNo = getProperty(site, "documentFileNo", ["fileNo", "documentNumber"])

  return (
    <div className="flex flex-col h-full w-full p-4 bg-white shadow-md rounded-lg">
      {console.log("[v0] Rendering site details for:", site)}

      <div className="flex flex-row justify-between gap-2">
        <div className="flex flex-col justify-between w-1/2 p-4 bg-gray-200 shadow-md rounded-lg">
          <h1><b>Site Name:</b> {siteName}</h1>
          <h1><b>Location:</b> {locationText}</h1>
          <h1><b>Supervisor:</b> {supervisor}</h1>
          <h1><b>Duration:</b> {durationInDays} days</h1>
          <h1><b>Estimated Cost:</b> {estimatedCost !== "N/A" ? `${formatPrice(estimatedCost)} LKR` : "N/A"}</h1>
          <h1><b>Document File No:</b> {documentFileNo}</h1>
        </div>
        <div className="flex flex-col w-1/2 rounded-lg gap-2">
          <div className="flex flex-row justify-between w-full p-4 bg-gray-200 rounded-lg">
            <div>
              <h1><b>Customer Name:</b> {customerData?.name || "N/A"}</h1>
              <h1><b>NIC Number:</b> {customerData?.nic || "N/A"}</h1>
              <h1>
                <b>Mobile Number:</b>{" "}
                {customerData?.phone ||
                  customerData?.contactInfo?.primaryContact?.phone ||
                  customerData?.contactInfo?.primaryContact?.mobile ||
                  "N/A"}
              </h1>
              <h1><b>Email:</b> {customerData?.contactInfo?.primaryContact?.email || customerData?.email || "N/A"}</h1>
              <h1>
                <b>Address:</b>{" "}
                {customerData?.address
                  ? typeof customerData.address === "object"
                    ? (() => {
                        const street = customerData.address.street || ""
                        const city = customerData.address.city || ""
                        const state = customerData.address.state || ""
                        const country = customerData.address.country || ""

                        const addressParts = [street, city, state, country].filter(
                          (part) => part && part.trim() !== "" && part !== "Not specified" && part !== "USA",
                        )

                        return addressParts.length > 0 ? addressParts.join(", ") : "N/A"
                      })()
                    : customerData.address
                  : customerData?.location || locationText || "N/A"}
              </h1>
            </div>
            <div>
              <button
                className="bg-green-500 shadow-md text-white px-4 py-2 rounded"
                onClick={() => setShowCustomerEditForm(true)}
              >
                Edit
              </button>
            </div>
          </div>
          <div className={`p-4 rounded-lg ${financialSummary.currentProfit > 0 ? "bg-green-700" : "bg-red-700"}`}>
            <div className="flex flex-row gap-4 text-white">
              <span className="font-bold tracking-wider">
                <h1>Profit :</h1>
              </span>
              <span className="tracking-wider">
                <h1>
                  {financialSummary.currentProfit >= 0 ? "+" : ""}
                  {formatPrice(financialSummary.currentProfit)} LKR
                </h1>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-row justify-between mt-4 gap-4 h-full">
        <div className="w-1/5 flex items-center justify-center">
          <VerticalProgressBar totalAmount={taskProgress.totalAmount} completedAmount={taskProgress.completedAmount} />
        </div>

        <div className="flex flex-row gap-6 w-4/5">
          <div className="bg-gray-100 p-4 shadow-md rounded-lg w-1/2">
            <div className="bg-green-700 text-white p-2 rounded-t-md font-semibold">
              <center>Summary of Project</center>
            </div>
            <div className="p-2">
              <p className="font-bold text-black">Current Profit:</p>
              <p
                className={`font-bold text-center ${financialSummary.currentProfit >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {financialSummary.currentProfit >= 0 ? "+" : ""}
                {formatPrice(financialSummary.currentProfit)} LKR
              </p>
              <p className="text-sm text-gray-600 text-center mb-4">As of {new Date().toLocaleDateString()}</p>

              <p className="font-bold text-black">Last Income:</p>
              <p className="text-green-600 font-bold text-center">{formatPrice(financialSummary.lastIncome)} LKR</p>
              <p className="text-sm text-gray-600 text-center mb-4">
                {financialSummary.lastIncomeDate
                  ? new Date(financialSummary.lastIncomeDate).toLocaleDateString()
                  : "No income recorded"}
              </p>

              <div className="mt-4">
                <h2 className="font-semibold text-center mb-2">Main Expenses in Project</h2>
                <hr className="h-1 mb-2 bg-gray-400 border-0" />
                <div className="flex justify-between text-black mb-1">
                  <span>Material Cost:</span>
                  <span className="text-red-600">-{formatPrice(financialSummary.materialCost)} LKR</span>
                </div>
                <div className="flex justify-between text-black mb-1">
                  <span>Labourers Salary:</span>
                  <span className="text-red-600">-{formatPrice(financialSummary.labourerSalary)} LKR</span>
                </div>
                <div className="flex justify-between text-black mb-1">
                  <span>Paid Labourer Salaries:</span>
                  <span className="text-red-600">-{formatPrice(financialSummary.paidLabourerSalary)} LKR</span>
                </div>
                <div className="flex justify-between text-black mb-1">
                  <span>Subcontractor Expenses:</span>
                  <span className="text-red-600">
                    -{formatPrice(financialSummary.appointedSubcontractorExpenses || 0)} LKR
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold">
                  <span className="text-black">Total of Expenses:</span>
                  <span className="text-red-600">-{formatPrice(financialSummary.totalExpenses)} LKR</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">As of {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 p-4 shadow-md rounded-lg w-1/2">
            <div className="bg-green-700 text-white p-2 rounded-t-md font-semibold">
              <center>Sub Contract</center>
            </div>
            <table className="w-full border border-collapse mt-2">
              <thead>
                <tr className="bg-gray-300 text-left text-sm">
                  <th className="border p-2">Subcontractor</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Duration</th>
                  <th className="border p-2">Expenses</th>
                </tr>
              </thead>
              <tbody>
                {appointedSubcontractors.length > 0
                  ? appointedSubcontractors.map((subcontractor, index) => {
                      const projectAppointment = subcontractor.appointments?.find(
                        (app) => app.project && app.project.toString() === site._id,
                      )
                      return (
                        <tr key={index} className="text-sm">
                          <td className="border p-2">{subcontractor.name}</td>
                          <td className="border p-2">{subcontractor.contractType}</td>
                          <td className="border p-2">
                            {projectAppointment
                              ? `${new Date(projectAppointment.startDate).toLocaleDateString()} - ${new Date(projectAppointment.endDate).toLocaleDateString()}`
                              : "N/A"}
                          </td>
                          <td className="border p-2">
                            {projectAppointment ? `${formatPrice(projectAppointment.cost)} LKR` : "N/A"}
                          </td>
                        </tr>
                      )
                    })
                  : [...Array(5)].map((_, index) => (
                      <tr key={index} className="text-sm">
                        <td className="border p-2 text-gray-400">No subcontractor</td>
                        <td className="border p-2 text-gray-400">-</td>
                        <td className="border p-2 text-gray-400">-</td>
                        <td className="border p-2 text-gray-400">-</td>
                      </tr>
                    ))}
              </tbody>
            </table>
            <div className="mt-2 text-right">
              <button className="text-green-600 font-semibold hover:underline" onClick={() => setShowForm(true)}>
                Appoint Sub Contractor
              </button>
              {showForm && (
                <AppointSubcontractorForm
                  isOpen={showForm}
                  onClose={() => setShowForm(false)}
                  onSubmit={handleAppoint}
                  projectId={currentProjectId}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <EditCustomerForm
        isOpen={showCustomerEditForm}
        onClose={() => setShowCustomerEditForm(false)}
        onSave={handleCustomerEdit}
        customer={customerData}
      />
    </div>
  )
}

export default SiteDetails