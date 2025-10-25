"use client"

import { useState, useEffect } from "react"
import { Delete, Edit, Image } from "@mui/icons-material"
import { red } from "@mui/material/colors"
import AddTransaction from "./AddTransaction"
import EditTransactionForm from "./EditForms/EditTransactionForm"
import transactionService from "../services/transactionService"
import PaymentSlipViewer from "../components/PaymentSlipViewer"
import ConfirmPasswordModal from "../components/ConfirmPasswordModal";

const SiteExpenses = ({ projectId }) => {
  console.log("[v0] SiteExpenses received projectId:", projectId)

  // For password state when Editing
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [pendingEditTransaction, setPendingEditTransaction] = useState(null)
  const [sortOrder, setSortOrder] = useState("")

  // For handling state while deletion
  const [isDeleting, setIsDeleting] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const transactionsPerPage = 8
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState({ 
    totalIncome: 0, 
    totalExpense: 0, 
    balance: 0 
  })

  const [selectedPaymentSlip, setSelectedPaymentSlip] = useState(null)
  const [isPaymentSlipViewerOpen, setIsPaymentSlipViewerOpen] = useState(false)

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

  const fetchSiteTransactions = async () => {
    if (!projectId) {
      console.log("[v0] No projectId provided, skipping transaction fetch")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Fetching transactions for project:", projectId)

      const response = await transactionService.getProjectTransactions(projectId)
      console.log("[v0] Full transactions response:", response)

      if (response && response.data) {
        const formattedTransactions = response.data.transactions.map((transaction) => ({
          id: transaction._id,
          date: new Date(transaction.date).toISOString().split("T")[0],
          description: transaction.description,
          amount: transaction.amount.toFixed(2),
          type: transaction.type,
          category: transaction.category,
          paymentMethod: transaction.paymentMethod,
          updatedOn: new Date(transaction.updatedAt).toISOString().split("T")[0],
          paymentSlip: transaction.paymentSlip,
          notes: transaction.notes,
        }))

        setTransactions(formattedTransactions)
        
        // FIX: Handle different possible response structures for summary
        const responseSummary = response.data.summary || response.summary || {}
        
        // Calculate totals if summary is not provided
        let totalIncome = responseSummary.totalIncome || 0
        let totalExpense = responseSummary.totalExpense || 0
        
        // If summary is not available, calculate from transactions
        if (!responseSummary.totalIncome && !responseSummary.totalExpense) {
          totalIncome = formattedTransactions
            .filter(t => t.type === "income")
            .reduce((sum, t) => sum + parseFloat(t.amount), 0)
            
          totalExpense = formattedTransactions
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + parseFloat(t.amount), 0)
        }
        
        const balance = totalIncome - totalExpense
        
        setSummary({
          totalIncome,
          totalExpense,
          balance
        })
        
        console.log("[v0] Summary calculated:", {
          totalIncome,
          totalExpense,
          balance
        })
      } else {
        // If no data in response, set empty summary
        setSummary({
          totalIncome: 0,
          totalExpense: 0,
          balance: 0
        })
      }
    } catch (err) {
      console.error("[v0] Error fetching site transactions:", err)
      setError("Failed to load transactions. Please try again.")
      // Set default summary on error
      setSummary({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSiteTransactions()
  }, [projectId])

  const totalPages = Math.ceil(transactions.length / transactionsPerPage)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleAddTransaction = async (transactionData) => {
    try {
      await transactionService.createTransaction(transactionData)
      fetchSiteTransactions() // This will refresh the data including summary
    } catch (err) {
      console.error("Error adding transaction:", err)
      setError("Failed to add transaction. Please try again.")
    }
  }

  const handleEditTransaction = (transaction) => {
    setPendingEditTransaction(transaction)
    setIsPasswordModalOpen(true)
  }

  const onPasswordVerified = async () => {
    if (isDeleting) {
      await handleDeleteTransaction();
    } else {
      setEditingTransaction(pendingEditTransaction);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async (updatedTransaction) => {
    try {
      await transactionService.updateTransaction(editingTransaction.id, updatedTransaction)
      fetchSiteTransactions() // This will refresh the data including summary
      setIsEditModalOpen(false)
    } catch (err) {
      console.error("Error updating transaction:", err)
      setError("Failed to update transaction. Please try again.")
    }
  }

  const handleDeleteClick = (transaction) => {
    setPendingEditTransaction(transaction)
    setIsDeleting(true)
    setIsPasswordModalOpen(true)
  }

  const handleDeleteTransaction = async () => {
    try {
      await transactionService.deleteTransaction(pendingEditTransaction.id)
      fetchSiteTransactions() // This will refresh the data including summary
      setPendingEditTransaction(null)
      setIsPasswordModalOpen(false)
      setPasswordInput("")
      setPasswordError("")
      setIsDeleting(false)
    } catch (err) {
      console.error("Error deleting transaction:", err)
      setError("Failed to delete transaction. Please try again.")
    }
  }

  const handleViewPaymentSlip = (paymentSlip) => {
    setSelectedPaymentSlip(paymentSlip)
    setIsPaymentSlipViewerOpen(true)
  }

  const handleSort = (order) => {
    setSortOrder(order)
    const sortedTransactions = [...transactions]

    if (order === "Newest") {
      sortedTransactions.sort((a, b) => {
        const dateA = new Date(a.updatedOn)
        const dateB = new Date(b.updatedOn)
        return dateB - dateA
      })
    } else if (order === "Oldest") {
      sortedTransactions.sort((a, b) => new Date(a.updatedOn) - new Date(b.updatedOn))
    } else if (order === "Name") {
      sortedTransactions.sort((a, b) => a.description.localeCompare(b.description))
    }

    setTransactions(sortedTransactions)
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full p-4 bg-white shadow-md rounded-lg">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading transactions...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-full w-full p-4 bg-white shadow-md rounded-lg">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
          <button onClick={fetchSiteTransactions} className="ml-4 bg-green-500 text-white px-4 py-2 rounded-lg">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!projectId) {
    return (
      <div className="flex flex-col h-full w-full p-4 bg-white shadow-md rounded-lg">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No project selected</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full p-4 bg-white shadow-md rounded-lg">
      <div className="text-sm text-gray-600 mb-2">Project ID: {projectId}</div>

      {/* FIXED: Summary display with proper fallback values */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600">Total Income</div>
          <div className="text-lg font-bold text-green-600">
            +{formatPrice(summary.totalIncome || 0)}
          </div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600">Total Expenses</div>
          <div className="text-lg font-bold text-red-600">
            -{formatPrice(summary.totalExpense || 0)}
          </div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600">Current Balance</div>
          <div className={`text-lg font-bold ${(summary.balance || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
            {(summary.balance || 0) >= 0 ? "+" : ""}
            {formatPrice(summary.balance || 0)}
          </div>
        </div>
      </div>

      {/* Rest of your component remains the same */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-black">Transactions</h3>

        <div className="flex items-center">
          <label className="mr-2 text-gray-700 font-semibold">Sort By:</label>
          <select className="p-2 border rounded-md" value={sortOrder} onChange={(e) => handleSort(e.target.value)}>
            <option value="Newest">Newest</option>
            <option value="Oldest">Oldest</option>
            <option value="Name">Name</option>
          </select>
        </div>
      </div>
      <div className="flex-grow overflow-auto mt-4">
        <div>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions found for this site. Add your first transaction to get started.
            </div>
          ) : (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="text-gray-500">
                  <th className="border border-gray-300 p-2 font-normal">Date</th>
                  <th className="border border-gray-300 p-2 font-normal">Description</th>
                  <th className="border border-gray-300 p-2 font-normal">Category</th>
                  <th className="border border-gray-300 p-2 font-normal">Amount</th>
                  <th className="border border-gray-300 p-2 font-normal">Payment Slips</th>
                  <th className="border border-gray-300 p-2 font-normal">Updated Time</th>
                  <th className="border border-gray-300 p-2 font-normal">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions
                  .slice((currentPage - 1) * transactionsPerPage, currentPage * transactionsPerPage)
                  .map((transaction, index) => (
                    <tr key={transaction.id || index} className="border border-gray-300">
                      <td className="border border-gray-300 p-2 text-center">{transaction.date}</td>
                      <td className="border border-gray-300 p-2">{transaction.description}</td>
                      <td className="border border-gray-300 p-2 text-center">{transaction.category}</td>
                      <td
                        className={`border border-gray-300 p-2 text-center ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatPrice(transaction.amount)}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {transaction.paymentSlip ? (
                          <Image
                            className="cursor-pointer text-blue-500"
                            onClick={() => handleViewPaymentSlip(transaction.paymentSlip)}
                          />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">{transaction.updatedOn}</td>
                      <td className="border border-gray-300 p-2 text-center">
                        <Edit className="cursor-pointer mr-2" onClick={() => handleEditTransaction(transaction)} />
                        <Delete
                          className="cursor-pointer ml-2"
                          style={{ color: red[500] }}
                          onClick={() => handleDeleteClick(transaction)}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          <div className="flex justify-between items-center mt-4">
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg" onClick={() => setIsModalOpen(true)}>
              + Add Transaction
            </button>

            {transactions.length > 0 && (
              <div className="flex space-x-2">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === index + 1 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          <AddTransaction
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleAddTransaction}
            projectId={projectId}
          />

          <EditTransactionForm
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveEdit}
            transaction={editingTransaction}
          />

          <PaymentSlipViewer
            isOpen={isPaymentSlipViewerOpen}
            onClose={() => setIsPaymentSlipViewerOpen(false)}
            paymentSlipUrl={selectedPaymentSlip}
          />

        </div>
      </div>
      {/* Confirm password modal */}
      <ConfirmPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={onPasswordVerified}
        title={isDeleting ? "Confirm Delete" : "Confirm Edit"}
      />
    </div>
  )
}

export default SiteExpenses