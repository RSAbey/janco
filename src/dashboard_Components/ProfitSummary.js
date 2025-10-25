"use client"

import { useRef, useState, useEffect } from "react"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import expenseService from "../services/expenseService"
import LoadingSpinner from "../components/LoadingSpinner"

const ProfitSummary = ({ onClose }) => {
  const selectRef = useRef(null)
  const [profitData, setProfitData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  const companyDetails = {
    name: "Janco Home & Construction (Pvt) Ltd.",
    regNo: "REG123456",
    contact: "jancohomearch@gmail.com | +94 112 090 090",
    logo: "/logo.png",
  }

  useEffect(() => {
    fetchProfitData()
  }, [])

  const fetchProfitData = async () => {
    try {
      setLoading(true)
      setError("")
      
      const currentYear = new Date().getFullYear()
      // Financial year: April current year to March next year
      const startDate = new Date(currentYear, 3, 1) // April 1 of current year
      const endDate = new Date(currentYear + 1, 2, 31) // March 31 of next year

      // Fetch both income and expenses for the financial year
      const [incomeResponse, expensesResponse] = await Promise.all([
        expenseService.getAllExpenses({
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          type: "income"
        }),
        expenseService.getAllExpenses({
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          type: "expense"
        })
      ])

      const incomeData = incomeResponse.expenses || incomeResponse.data?.expenses || []
      const expensesData = expensesResponse.expenses || expensesResponse.data?.expenses || []

      // Process monthly data for financial year (April to March)
      const monthlyProfitData = []
      const monthNames = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"]
      
      for (let i = 0; i < 12; i++) {
        let month, year;
        if (i < 9) { // April (3) to December (11) - current year
          month = 3 + i;
          year = currentYear;
        } else { // January (0) to March (2) - next year
          month = i - 9;
          year = currentYear + 1;
        }
        
        const monthStart = new Date(year, month, 1)
        const monthEnd = new Date(year, month + 1, 0)
        
        // Calculate monthly income
        const monthIncome = incomeData
          .filter(expense => {
            const expenseDate = new Date(expense.date)
            return expenseDate >= monthStart && expenseDate <= monthEnd
          })
          .reduce((sum, expense) => sum + expense.amount, 0)
        
        // Calculate monthly expenses
        const monthExpenses = expensesData
          .filter(expense => {
            const expenseDate = new Date(expense.date)
            return expenseDate >= monthStart && expenseDate <= monthEnd
          })
          .reduce((sum, expense) => sum + expense.amount, 0)
        
        const monthProfit = monthIncome - monthExpenses

        monthlyProfitData.push({
          id: i + 1,
          month: monthNames[i],
          income: monthIncome,
          expense: monthExpenses,
          profit: monthProfit,
          monthNumber: month,
          year: year
        })
      }

      setProfitData(monthlyProfitData)

    } catch (error) {
      setError(error.message || "Failed to fetch profit data")
      console.error("Error fetching profit data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const handleDownload = () => {
    const selectedOption = selectRef.current.value

    if (!selectedOption) {
      alert("Please select a document type")
      return
    }

    if (selectedOption.includes("pdf")) {
      downloadAsPDF()
    } else if (selectedOption.includes("xlsx")) {
      downloadAsExcel()
    }
  }

  const downloadAsPDF = () => {
    const doc = new jsPDF()
    const currentYear = new Date().getFullYear()
    let yPosition = 20

    // Add title
    doc.setFontSize(16)
    doc.text("Company Monthly Profit Summary", 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(12)
    doc.text(`Financial Year ${currentYear}-${currentYear + 1} (Apr ${currentYear} - Mar ${currentYear + 1})`, 20, yPosition)
    yPosition += 15

    // Add company details
    doc.setFontSize(10)
    doc.text(companyDetails.name, 20, yPosition)
    yPosition += 5
    doc.text(`Reg No: ${companyDetails.regNo}`, 20, yPosition)
    yPosition += 5
    doc.text(`Contact: ${companyDetails.contact}`, 20, yPosition)
    yPosition += 15

    // Table headers
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text("Month", 20, yPosition)
    doc.text("Total Income (LKR)", 60, yPosition)
    doc.text("Total Expenses (LKR)", 100, yPosition)
    doc.text("Profit/Loss (LKR)", 140, yPosition)
    yPosition += 8

    // Draw line under headers
    doc.line(20, yPosition, 180, yPosition)
    yPosition += 10

    // Table data
    doc.setFont(undefined, 'normal')
    profitData.forEach((item) => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      doc.text(item.month, 20, yPosition)
      doc.text(formatCurrency(item.income), 60, yPosition)
      doc.text(formatCurrency(item.expense), 100, yPosition)
      
      // Color code profit/loss
      if (item.profit >= 0) {
        doc.setTextColor(0, 128, 0) // Green for profit
      } else {
        doc.setTextColor(255, 0, 0) // Red for loss
      }
      doc.text(formatCurrency(item.profit), 140, yPosition)
      doc.setTextColor(0, 0, 0) // Reset to black
      
      yPosition += 8
    })

    // Add total row
    const totalIncome = profitData.reduce((sum, item) => sum + item.income, 0)
    const totalExpenses = profitData.reduce((sum, item) => sum + item.expense, 0)
    const totalProfit = totalIncome - totalExpenses

    yPosition += 5
    doc.line(20, yPosition, 180, yPosition)
    yPosition += 8

    doc.setFont(undefined, 'bold')
    doc.text("TOTAL", 20, yPosition)
    doc.text(formatCurrency(totalIncome), 60, yPosition)
    doc.text(formatCurrency(totalExpenses), 100, yPosition)
    
    if (totalProfit >= 0) {
      doc.setTextColor(0, 128, 0)
    } else {
      doc.setTextColor(255, 0, 0)
    }
    doc.text(formatCurrency(totalProfit), 140, yPosition)
    doc.setTextColor(0, 0, 0)

    doc.save(`profit_summary_${currentYear}_${currentYear + 1}.pdf`)
  }

  const downloadAsExcel = () => {
    const worksheetData = profitData.map(item => ({
      Month: item.month,
      'Total Income (LKR)': item.income,
      'Total Expenses (LKR)': item.expense,
      'Profit/Loss (LKR)': item.profit
    }))

    // Add summary row
    const totalIncome = profitData.reduce((sum, item) => sum + item.income, 0)
    const totalExpenses = profitData.reduce((sum, item) => sum + item.expense, 0)
    const totalProfit = totalIncome - totalExpenses

    worksheetData.push({
      Month: 'TOTAL',
      'Total Income (LKR)': totalIncome,
      'Total Expenses (LKR)': totalExpenses,
      'Profit/Loss (LKR)': totalProfit
    })

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Profit Summary")
    
    const currentYear = new Date().getFullYear()
    XLSX.writeFile(workbook, `profit_summary_${currentYear}_${currentYear + 1}.xlsx`)
  }

  const currentYear = new Date().getFullYear()
  const totalIncome = profitData.reduce((sum, item) => sum + item.income, 0)
  const totalExpenses = profitData.reduce((sum, item) => sum + item.expense, 0)
  const totalProfit = totalIncome - totalExpenses

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-lg">
          <LoadingSpinner message="Loading profit data..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-lg">
          <div className="text-red-600 mb-4">{error}</div>
          <button onClick={onClose} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-4xl max-h-[90vh] overflow-auto">
        <h2 className="text-center text-xl font-semibold mb-4">
          Financial Year {currentYear}-{currentYear + 1} (Apr {currentYear} - Mar {currentYear + 1})
        </h2>
        <h3 className="text-lg font-semibold mb-4 text-center">Company Monthly Profit Summary</h3>
        
        {/* Summary Section */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded text-center">
            <div className="text-sm text-green-600">Total Income</div>
            <div className="text-2xl font-bold text-green-700">LKR {formatCurrency(totalIncome)}</div>
          </div>
          <div className="bg-red-50 p-4 rounded text-center">
            <div className="text-sm text-red-600">Total Expenses</div>
            <div className="text-2xl font-bold text-red-700">LKR {formatCurrency(totalExpenses)}</div>
          </div>
          <div className={`p-4 rounded text-center ${totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className={`text-sm ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalProfit >= 0 ? 'Total Profit' : 'Total Loss'}
            </div>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              LKR {formatCurrency(Math.abs(totalProfit))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead>
              <tr className="text-sm font-normal bg-gray-50">
                <th className="p-3 border font-semibold">Month</th>
                <th className="p-3 border font-semibold">Total Income (LKR)</th>
                <th className="p-3 border font-semibold">Total Expenses (LKR)</th>
                <th className="p-3 border font-semibold">Profit/Loss (LKR)</th>
              </tr>
            </thead>
            <tbody>
              {profitData.map((data, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-3 border font-normal">{data.month}</td>
                  <td className="p-3 border font-normal text-right text-green-600">
                    {formatCurrency(data.income)}
                  </td>
                  <td className="p-3 border font-normal text-right text-red-600">
                    {formatCurrency(data.expense)}
                  </td>
                  <td className={`p-3 border font-normal text-right ${
                    data.profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(data.profit)}
                  </td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="bg-gray-100 font-semibold">
                <td className="p-3 border">TOTAL</td>
                <td className="p-3 border text-right text-green-600">
                  {formatCurrency(totalIncome)}
                </td>
                <td className="p-3 border text-right text-red-600">
                  {formatCurrency(totalExpenses)}
                </td>
                <td className={`p-3 border text-right ${
                  totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(totalProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-row justify-between items-center mt-6 gap-4">
          <div className="flex items-center">
            <select ref={selectRef} className="p-2 border rounded-md" defaultValue="">
              <option value="">Select Document Type:</option>
              <option value="pdf">Download as PDF</option>
              <option value="xlsx">Download as Excel</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Download Report
            </button>
            <button onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfitSummary