import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Delete, Edit, Image, ArrowBack, Add, FilterList, Sort } from "@mui/icons-material";
import AddTransaction from "./AddTransaction";
import EditTransactionForm from "./EditForms/EditTransactionForm";
import transactionService from "../services/transactionService";
import PaymentSlipViewer from "../components/PaymentSlipViewer";

const SupervisorExpenses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const projectId = location.state?.projectId;

  // State variables
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingEditTransaction, setPendingEditTransaction] = useState(null);
  const [sortOrder, setSortOrder] = useState("Newest");
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [selectedPaymentSlip, setSelectedPaymentSlip] = useState(null);
  const [isPaymentSlipViewerOpen, setIsPaymentSlipViewerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const transactionsPerPage = 10;

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.amount.includes(searchTerm)
  );

  const fetchSiteTransactions = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await transactionService.getProjectTransactions(projectId);
      console.log("[SupervisorExpenses] Full API response:", response); // Debug log

      if (response && response.data) {
        const formattedTransactions = response.data.transactions.map((transaction) => ({
          id: transaction._id,
          date: new Date(transaction.date).toISOString().split("T")[0],
          description: transaction.description,
          amount: transaction.amount.toFixed(2),
          type: transaction.type,
          category: transaction.category,
          paymentMethod: transaction.paymentMethod,
          updatedOn: new Date(transaction.updatedAt).toLocaleDateString(),
          paymentSlip: transaction.paymentSlip,
          notes: transaction.notes,
        }));

        setTransactions(formattedTransactions);
        
        // FIX: Handle summary data properly
        const responseSummary = response.data.summary || response.summary || {};
        
        // Calculate totals if summary is not provided in response
        let totalIncome = responseSummary.totalIncome || 0;
        let totalExpense = responseSummary.totalExpense || 0;
        
        // If summary data is missing, calculate from transactions
        if (!responseSummary.totalIncome && !responseSummary.totalExpense) {
          console.log("[SupervisorExpenses] Calculating summary from transactions");
          totalIncome = formattedTransactions
            .filter(t => t.type === "income")
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
          totalExpense = formattedTransactions
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        }
        
        const balance = totalIncome - totalExpense;
        
        setSummary({
          totalIncome,
          totalExpense,
          balance
        });
        
        console.log("[SupervisorExpenses] Summary set:", {
          totalIncome,
          totalExpense,
          balance
        });
      } else {
        // If no data in response, set default summary
        console.log("[SupervisorExpenses] No data in response, setting default summary");
        setSummary({
          totalIncome: 0,
          totalExpense: 0,
          balance: 0
        });
      }
    } catch (err) {
      console.error("Error fetching site transactions:", err);
      setError("Failed to load transactions. Please try again.");
      // Set default summary on error
      setSummary({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteTransactions();
  }, [projectId]);

  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  const handleAddTransaction = async (transactionData) => {
    try {
      await transactionService.createTransaction(transactionData);
      fetchSiteTransactions(); // Refresh to update summary
    } catch (err) {
      console.error("Error adding transaction:", err);
      setError("Failed to add transaction. Please try again.");
    }
  };

  const handleEditTransaction = (transaction) => {
    setPendingEditTransaction(transaction);
    setIsDeleting(false);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSubmit = () => {
    const correctPassword = "admin123";

    if (passwordInput === correctPassword) {
      if (isDeleting) {
        handleDeleteTransaction();
      } else {
        setEditingTransaction(pendingEditTransaction);
        setIsEditModalOpen(true);
      }

      setIsPasswordModalOpen(false);
      setPasswordInput("");
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };

  const handleSaveEdit = async (updatedTransaction) => {
    try {
      await transactionService.updateTransaction(editingTransaction.id, updatedTransaction);
      fetchSiteTransactions(); // Refresh to update summary
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Error updating transaction:", err);
      setError("Failed to update transaction. Please try again.");
    }
  };

  const handleDeleteClick = (transaction) => {
    setPendingEditTransaction(transaction);
    setIsDeleting(true);
    setIsPasswordModalOpen(true);
  };

  const handleDeleteTransaction = async () => {
    try {
      await transactionService.deleteTransaction(pendingEditTransaction.id);
      fetchSiteTransactions(); // Refresh to update summary
      setPendingEditTransaction(null);
      setIsPasswordModalOpen(false);
      setPasswordInput("");
      setPasswordError("");
      setIsDeleting(false);
    } catch (err) {
      console.error("Error deleting transaction:", err);
      setError("Failed to delete transaction. Please try again.");
    }
  };

  const handleViewPaymentSlip = (paymentSlip) => {
    setSelectedPaymentSlip(paymentSlip);
    setIsPaymentSlipViewerOpen(true);
  };

  const handleSort = (order) => {
    setSortOrder(order);
    const sortedTransactions = [...transactions];

    if (order === "Newest") {
      sortedTransactions.sort((a, b) => new Date(b.updatedOn) - new Date(a.updatedOn));
    } else if (order === "Oldest") {
      sortedTransactions.sort((a, b) => new Date(a.updatedOn) - new Date(b.updatedOn));
    } else if (order === "Name") {
      sortedTransactions.sort((a, b) => a.description.localeCompare(b.description));
    } else if (order === "Amount") {
      sortedTransactions.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
    }

    setTransactions(sortedTransactions);
  };

  // Statistics
  const stats = {
    totalTransactions: filteredTransactions.length,
    incomeCount: filteredTransactions.filter(t => t.type === "income").length,
    expenseCount: filteredTransactions.filter(t => t.type === "expense").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center py-8 text-red-600 text-sm">
          {error}
          <button onClick={fetchSiteTransactions} className="ml-2 text-green-600 hover:text-green-800">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center py-8 text-gray-500 text-sm">
          No project selected
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-8">
      {/* Compact Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/supervisordash")}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go Back"
            >
              <ArrowBack size={16} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Expenses Management</h1>
              <p className="text-gray-600 text-sm">Track project income and expenses</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick Stats */}
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">💰 {stats.totalTransactions}</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">📈 {stats.incomeCount}</span>
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded">📉 {stats.expenseCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        {/* Control Bar */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Summary Cards - Compact */}
              {/* FIXED: Summary display with proper fallback values */}
              <div className="flex gap-2 text-xs">
                <div className="bg-green-50 px-3 py-1 rounded border border-green-200">
                  <div className="text-green-700 font-semibold">
                    +LKR.{(summary.totalIncome || 0).toFixed(2)}
                  </div>
                  <div className="text-green-600">Income</div>
                </div>
                <div className="bg-red-50 px-3 py-1 rounded border border-red-200">
                  <div className="text-red-700 font-semibold">
                    -LKR.{(summary.totalExpense || 0).toFixed(2)}
                  </div>
                  <div className="text-red-600">Expenses</div>
                </div>
                <div className="bg-blue-50 px-3 py-1 rounded border border-blue-200">
                  <div className={`font-semibold ${(summary.balance || 0) >= 0 ? "text-green-700" : "text-red-700"}`}>
                    LKR.{(summary.balance || 0).toFixed(2)}
                  </div>
                  <div className="text-blue-600">Balance</div>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 border border-gray-300 rounded text-sm w-40 focus:ring-1 focus:ring-green-500"
                />
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1 rounded ${showFilters ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                title="Toggle Filters"
              >
                <FilterList fontSize="small" />
              </button>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
            >
              <Add fontSize="small" />
              <span>Add Transaction</span>
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium">Sort:</span>
                {["Newest", "Oldest", "Name", "Amount"].map((order) => (
                  <button
                    key={order}
                    onClick={() => handleSort(order)}
                    className={`px-2 py-1 rounded ${
                      sortOrder === order 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {order}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <div className="overflow-auto">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {searchTerm ? "No transactions match your search" : "No transactions found. Add your first transaction to get started."}
            </div>
          ) : (
            <div className="min-w-max">
              {/* Table Header */}
              <div className="grid grid-cols-[100px_1fr_120px_100px_80px_120px_80px] gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700">
                <div>Date</div>
                <div>Description</div>
                <div>Category</div>
                <div className="text-right">Amount</div>
                <div className="text-center">Slip</div>
                <div className="text-center">Updated</div>
                <div className="text-center">Actions</div>
              </div>

              {/* Table Rows */}
              <div className="max-h-96 overflow-y-auto">
                {filteredTransactions
                  .slice((currentPage - 1) * transactionsPerPage, currentPage * transactionsPerPage)
                  .map((transaction, index) => (
                    <div
                      key={transaction.id || index}
                      className="grid grid-cols-[100px_1fr_120px_100px_80px_120px_80px] gap-1 px-3 py-2 border-b border-gray-100 hover:bg-blue-50 text-sm"
                    >
                      {/* Date */}
                      <div className="text-xs text-gray-600">{transaction.date}</div>
                      
                      {/* Description */}
                      <div className="truncate" title={transaction.description}>
                        {transaction.description}
                      </div>
                      
                      {/* Category */}
                      <div className="text-xs">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {transaction.category}
                        </span>
                      </div>
                      
                      {/* Amount */}
                      <div className={`text-right font-semibold ${
                        transaction.type === "income" ? "text-green-600" : "text-red-600"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}LKR.{transaction.amount}
                      </div>
                      
                      {/* Payment Slip */}
                      <div className="text-center">
                        {transaction.paymentSlip ? (
                          <Image
                            className="cursor-pointer text-blue-500 hover:text-blue-700"
                            fontSize="small"
                            onClick={() => handleViewPaymentSlip(transaction.paymentSlip)}
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>
                      
                      {/* Updated */}
                      <div className="text-center text-xs text-gray-500">{transaction.updatedOn}</div>
                      
                      {/* Actions */}
                      <div className="flex justify-center gap-2">
                        <Edit 
                          className="cursor-pointer text-blue-500 hover:text-blue-700" 
                          fontSize="small"
                          onClick={() => handleEditTransaction(transaction)} 
                        />
                        <Delete
                          className="cursor-pointer text-red-500 hover:text-red-700"
                          fontSize="small"
                          onClick={() => handleDeleteClick(transaction)}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>
                  Showing {((currentPage - 1) * transactionsPerPage) + 1} to {Math.min(currentPage * transactionsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  >
                    ◀
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`px-2 py-1 rounded text-xs ${
                        currentPage === index + 1 
                          ? "bg-green-600 text-white" 
                          : "hover:bg-gray-200"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  >
                    ▶
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AddTransaction
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTransaction}
        projectId={projectId}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
        transaction={editingTransaction}
      />

      {/* Payment Slip Viewer */}
      <PaymentSlipViewer
        isOpen={isPaymentSlipViewerOpen}
        onClose={() => setIsPaymentSlipViewerOpen(false)}
        paymentSlipUrl={selectedPaymentSlip}
      />

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">
              {isDeleting ? "Enter Password to Delete" : "Enter Password to Edit"}
            </h3>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password"
              className="w-full p-2 border rounded text-sm mb-2 focus:ring-1 focus:ring-green-500"
            />
            {passwordError && <p className="text-xs text-red-600 mb-2">{passwordError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordInput("");
                  setPasswordError("");
                }}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handlePasswordSubmit} 
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorExpenses;