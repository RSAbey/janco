"use client"

import { useState, useEffect } from "react"
import AddExpenseForm from "./AddExpenseForm"
import DownloadReportForm from "./DownloadReportForm"
import PaymentSlipViewer from "../components/PaymentSlipViewer"
import expenseService from "../services/expenseService"
import { useErrorHandler } from "../hooks/useErrorHandler"
import LoadingSpinner from "../components/LoadingSpinner"
import { useAuth } from "../contexts/AuthContext"

const FinanceSection = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [showDownloadForm, setShowDownloadForm] = useState(false)
  const [showPaymentSlip, setShowPaymentSlip] = useState(false)
  const [selectedPaymentSlip, setSelectedPaymentSlip] = useState({ url: "", description: "" })
  const [expenses, setExpenses] = useState([])
  const [stats, setStats] = useState({ totalIncome: 0, totalExpenses: 0, currentBalance: 0 })
  const [isLoading, setIsLoading] = useState(true)

  // Get current month start and end dates
  const getCurrentMonthDates = () => {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    }
  }

  const [filters, setFilters] = useState({
    startDate: getCurrentMonthDates().startDate,
    endDate: getCurrentMonthDates().endDate,
    search: "",
  })

  const { handleError } = useErrorHandler()
  const { user } = useAuth()

  const handleViewPaymentSlip = (expense) => {
    if (expense.paymentSlip) {
      setSelectedPaymentSlip({
        url: expense.paymentSlip,
        description: `${expense.description} - ${new Date(expense.date).toLocaleDateString()}`,
      })
      setShowPaymentSlip(true)
    }
  }

  // Add this function to calculate current month revenue
  const calculateCurrentMonthRevenue = (expenses) => {
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const currentMonthIncome = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= currentMonthStart && 
               expenseDate <= currentMonthEnd && 
               expense.type === "income"
      })
      .reduce((sum, expense) => sum + expense.amount, 0)

    const currentMonthExpenses = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= currentMonthStart && 
               expenseDate <= currentMonthEnd && 
               expense.type === "expense"
      })
      .reduce((sum, expense) => sum + expense.amount, 0)

    return currentMonthIncome - currentMonthExpenses
  }

  // Update the fetchData function to include current month revenue
  const fetchData = async () => {
    try {
      setIsLoading(true)

      console.log("Fetching data with filters:", filters)

      // Fetch expenses
      const expensesResponse = await expenseService.getAllExpenses({
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.search,
      })

      console.log("Expenses response:", expensesResponse)

      // Fetch stats
      const statsResponse = await expenseService.getExpenseStats({
        startDate: filters.startDate,
        endDate: filters.endDate,
      })

      console.log("Stats response:", statsResponse)

      // Check the actual response structure
      const expensesData = expensesResponse.expenses || expensesResponse.data?.expenses || []
      const statsData = statsResponse.stats ||
        statsResponse.data?.stats || {
          totalIncome: 0,
          totalExpenses: 0,
          currentBalance: 0,
        }

      // Calculate current month revenue
      const currentMonthRevenue = calculateCurrentMonthRevenue(expensesData)

      setExpenses(expensesData)
      setStats({
        ...statsData,
        currentMonthRevenue // Add current month revenue to stats
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      handleError(error, "Failed to fetch financial data")
      // Set empty data on error
      setExpenses([])
      setStats({ 
        totalIncome: 0, 
        totalExpenses: 0, 
        currentBalance: 0,
        currentMonthRevenue: 0 
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters])

  const handleAddExpense = async (expenseData) => {
    try {
      await expenseService.createExpense(expenseData)
      await fetchData() // Refresh data
      setShowForm(false)
    } catch (error) {
      handleError(error, "Failed to add expense")
    }
  }

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value })
  }

  // Navigation functions for date range
  const navigateToPreviousMonth = () => {
    const startDate = new Date(filters.startDate)
    const newStartDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1)
    const newEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0)

    setFilters({
      ...filters,
      startDate: newStartDate.toISOString().split("T")[0],
      endDate: newEndDate.toISOString().split("T")[0],
    })
  }

  const navigateToNextMonth = () => {
    const startDate = new Date(filters.startDate)
    const newStartDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1)
    const newEndDate = new Date(startDate.getFullYear(), startDate.getMonth() + 2, 0)

    setFilters({
      ...filters,
      startDate: newStartDate.toISOString().split("T")[0],
      endDate: newEndDate.toISOString().split("T")[0],
    })
  }

  const resetToCurrentMonth = () => {
    setFilters({
      ...filters,
      ...getCurrentMonthDates(),
    })
  }

  const formatBalance = (balance) => {
    const sign = balance >= 0 ? "+" : "-"
    const absBalance = Math.abs(balance)
    return `${sign}${absBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  console.log("Current expenses:", expenses)
  console.log("Current stats:", stats)
  console.log("Current date filters:", filters)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md w-full">
      <h1 className="text-xl font-semibold mb-6">Finance Section</h1>

      {/* Summary Boxes */}
      <div className="flex flex-row gap-4 mb-6">
        <div className="flex-1 bg-white shadow p-4 text-center rounded">
          <p className="text-sm font-medium">Total Income</p>
          <p className="text-green-600 font-bold text-lg">
            +{stats.totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="flex-1 bg-white shadow p-4 text-center rounded">
          <p className="text-sm font-medium">Total Expenses</p>
          <p className="text-red-600 font-bold text-lg">
            -{stats.totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="flex-1 bg-white shadow p-4 text-center rounded">
          <p className="text-sm font-medium">Current Month Revenue</p>
          <p className={`font-bold text-lg ${stats.currentMonthRevenue >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatBalance(stats.currentMonthRevenue)}
          </p>
        </div>
        <div className="flex-1 bg-white shadow p-4 text-center rounded">
          <p className="text-sm font-medium">Overall Balance</p>
          <p className={`font-bold text-lg ${stats.currentBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatBalance(stats.currentBalance)}
          </p>
        </div>
        <div className="p-6">
          <button
            onClick={() => setShowDownloadForm(true)}
            className="bg-green-400 text-white px-5 py-2 rounded hover:bg-green-500"
          >
            Download Report
          </button>
          {showDownloadForm && <DownloadReportForm onClose={() => setShowDownloadForm(false)} />}
        </div>
      </div>

      {/* Date Range and Search */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 items-center">
          <button
            onClick={navigateToPreviousMonth}
            className="text-2xl hover:bg-gray-100 p-1 rounded"
            title="Previous month"
          >
            &lt;
          </button>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="border p-2 rounded w-32"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="border p-2 rounded w-32"
          />
          <button onClick={navigateToNextMonth} className="text-2xl hover:bg-gray-100 p-1 rounded" title="Next month">
            &gt;
          </button>
          <button
            onClick={resetToCurrentMonth}
            className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200"
            title="Reset to current month"
          >
            Today
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search"
            value={filters.search}
            onChange={handleSearch}
            className="border p-2 rounded"
          />
          <select className="border p-2 rounded">
            <option>Newest</option>
            <option>Oldest</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead className="text-gray-600 text-sm">
            <tr>
              <th>Date</th>
              <th>Section</th>
              <th>Description</th>
              <th>Income</th>
              <th>Expenses</th>
              <th>Payment Slips</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {expenses.length > 0 ? (
              expenses.map((expense, index) => (
                <tr key={expense._id || index} className="bg-white shadow rounded">
                  <td className="p-2">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="p-2">{expense.section}</td>
                  <td className="p-2">{expense.description}</td>
                  <td className="p-2 text-green-600 font-medium">
                    {expense.type === "income" ? `+${expense.amount.toLocaleString()}` : ""}
                  </td>
                  <td className="p-2 text-red-600 font-medium">
                    {expense.type === "expense" ? `-${expense.amount.toLocaleString()}` : ""}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {expense.paymentSlip ? (
                        <button
                          onClick={() => handleViewPaymentSlip(expense)}
                          className="flex items-center gap-2 hover:bg-gray-100 p-1 rounded transition"
                          title="Click to view payment slip"
                        >
                          <img
                            src="https://cdn-icons-png.flaticon.com/512/337/337940.png"
                            alt="View payment slip"
                            className="w-6 h-6"
                          />
                          <span className="text-blue-600 hover:underline">View Slip</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <img
                            src="https://cdn-icons-png.flaticon.com/512/337/337940.png"
                            alt="No slip"
                            className="w-6 h-6 opacity-50"
                          />
                          <span>No slip</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No expenses found for the selected period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
        >
          + Add Expenses
        </button>

        {showForm && <AddExpenseForm onClose={() => setShowForm(false)} onSubmit={handleAddExpense} />}

        <div className="flex gap-2 items-center">
          <button className="px-2">&lt;</button>
          {[1, 2, 3, 4].map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded ${page === currentPage ? "bg-green-600 text-white" : "bg-gray-100"}`}
            >
              {page}
            </button>
          ))}
          <span>...</span>
          <button className="px-3 py-1 rounded bg-gray-100">10</button>
          <button className="px-2">&gt;</button>
        </div>
      </div>

      {/* PaymentSlipViewer modal */}
      <PaymentSlipViewer
        isOpen={showPaymentSlip}
        onClose={() => setShowPaymentSlip(false)}
        paymentSlipUrl={selectedPaymentSlip.url}
        description={selectedPaymentSlip.description}
      />
    </div>
  )
}

export default FinanceSection
