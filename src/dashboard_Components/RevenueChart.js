import React, { useState, useEffect } from 'react'
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import expenseService from "../services/expenseService"
import LoadingSpinner from "../components/LoadingSpinner"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const RevenueChart = () => {
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const currentYear = new Date().getFullYear()
        // Financial year: April 1 of current year to March 31 of next year
        const startDate = new Date(currentYear, 3, 1) // April 1 of current year
        const endDate = new Date(currentYear + 1, 2, 31) // March 31 of next year

        // Fetch income data for the financial year
        const response = await expenseService.getAllExpenses({
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          type: "income"
        })

        const expenses = response.expenses || response.data?.expenses || []
        
        // Process monthly data for financial year (April to March)
        const monthlyTotals = Array(12).fill(0)
        const monthNames = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]
        
        expenses.forEach(expense => {
          const date = new Date(expense.date)
          const month = date.getMonth()
          
          // Map months to financial year order:
          // April (3) -> 0, May (4) -> 1, ..., March (2) -> 11
          let financialMonth;
          if (month >= 3) { // April (3) to December (11)
            financialMonth = month - 3;
          } else { // January (0) to March (2)
            financialMonth = month + 9; // 0+9=9, 1+9=10, 2+9=11
          }
          
          if (financialMonth >= 0 && financialMonth < 12) {
            monthlyTotals[financialMonth] += expense.amount
          }
        })

        const chartData = monthlyTotals.map((amount, index) => ({
          month: monthNames[index],
          amount: amount
        }))

        setMonthlyData(chartData)

      } catch (error) {
        console.error("Error fetching monthly data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMonthlyData()
  }, [])

  const getChartData = () => {
    return {
      labels: monthlyData.map(item => item.month),
      datasets: [
        {
          label: "Revenue",
          data: monthlyData.map(item => item.amount),
          backgroundColor: "#4F9863",
        },
      ],
    }
  }

  if (loading) {
    return (
      <div className='bg-white p-4 rounded-lg flex items-center justify-center h-[300px]'>
        <LoadingSpinner size="md" />
      </div>
    )
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className='bg-white p-4 rounded-lg'>
      <h2 className="text-sm font-semibold mb-4">
        Financial Year {currentYear}-{currentYear + 1} (Apr 1, {currentYear} - Mar 31, {currentYear + 1})
      </h2>
      <Bar data={getChartData()} className='h-[250px] w-full'/>
    </div>
  )
}

export default RevenueChart