"use client"

import { useState, useEffect } from "react"
import Card from "../components/Card"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import ProfitSummary from "./ProfitSummary"
import expenseService from "../services/expenseService"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorMessage from "../components/ErrorMessage"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const RevenueCard = () => {
  const [showModal, setShowModal] = useState(false)
  const [revenueData, setRevenueData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true)
        setError("")

        const currentYear = new Date().getFullYear()
        // Financial year: April 1 of current year to March 31 of next year
        const financialYearStart = new Date(currentYear, 3, 1) // April 1 of current year
        const financialYearEnd = new Date(currentYear + 1, 2, 31) // March 31 of next year

        // Fetch income data for the financial year
        const incomeResponse = await expenseService.getAllExpenses({
          startDate: financialYearStart.toISOString().split("T")[0],
          endDate: financialYearEnd.toISOString().split("T")[0],
          type: "income"
        })

        const expenses = incomeResponse.expenses || incomeResponse.data?.expenses || []
        
        // Calculate monthly revenue for financial year (April to March)
        const monthlyData = []
        const monthNames = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]
        
        for (let i = 0; i < 12; i++) {
          let month, year;
          if (i < 9) { // April (3) to December (11) - current year
            month = 3 + i; // April = 3, May = 4, ..., December = 11
            year = currentYear;
          } else { // January (0) to March (2) - next year
            month = i - 9; // January = 0, February = 1, March = 2
            year = currentYear + 1;
          }
          
          const monthStart = new Date(year, month, 1)
          const monthEnd = new Date(year, month + 1, 0)
          
          const monthIncome = expenses
            .filter(expense => {
              const expenseDate = new Date(expense.date)
              return expenseDate >= monthStart && expenseDate <= monthEnd
            })
            .reduce((sum, expense) => sum + expense.amount, 0)
          
          monthlyData.push({
            month: monthNames[i],
            amount: monthIncome
          })
        }

        const totalRevenue = monthlyData.reduce((sum, month) => sum + month.amount, 0)
        
        // Get current month stats for growth calculation
        const currentDate = new Date()
        const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        
        const statsResponse = await expenseService.getExpenseStats({
          startDate: currentMonthStart.toISOString().split("T")[0],
          endDate: currentMonthEnd.toISOString().split("T")[0],
        })

        const currentMonthIncome = statsResponse.stats?.totalIncome || 0
        
        // Calculate actual growth percentage
        let growthPercentage = 0;
        if (monthlyData.length > 1) {
          const currentMonthIndex = new Date().getMonth();
          // Adjust for financial year: if current month is Jan-Mar, it's in next year's financial data
          const financialMonthIndex = currentMonthIndex >= 3 ? currentMonthIndex - 3 : currentMonthIndex + 9;
          
          if (financialMonthIndex > 0) {
            const previousMonthAmount = monthlyData[financialMonthIndex - 1]?.amount || 0;
            if (previousMonthAmount > 0) {
              growthPercentage = ((currentMonthIncome - previousMonthAmount) / previousMonthAmount) * 100;
            }
          }
        }

        setRevenueData({
          totalRevenue,
          growthPercentage: Math.round(growthPercentage * 100) / 100,
          monthlyData,
          currentBalance: statsResponse.stats?.currentBalance || 0
        })

      } catch (error) {
        setError(error.message || "Failed to fetch revenue data")
        console.error("Error fetching revenue data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRevenueData()
  }, [])

  const getChartData = () => {
    if (revenueData?.monthlyData) {
      return {
        labels: revenueData.monthlyData.map((item) => item.month),
        datasets: [
          {
            label: "Revenue",
            data: revenueData.monthlyData.map((item) => item.amount),
            backgroundColor: "#4F9863",
            barThickness: 30,
          },
        ],
      }
    }

    // Fallback data
    return {
      labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
      datasets: [
        {
          label: "Revenue",
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          backgroundColor: "#4F9863",
          barThickness: 30,
        },
      ],
    }
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'LKR ' + value.toLocaleString();
          }
        }
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return `LKR ${context.raw.toLocaleString()}`;
          }
        }
      }
    }
  }

  const retryFetch = () => {
    setError("")
    setLoading(true)
    window.location.reload()
  }

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading revenue data..." />
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={retryFetch} />
  }

  const totalRevenue = revenueData?.totalRevenue || 0
  const currentBalance = revenueData?.currentBalance || 0
  const growthPercentage = revenueData?.growthPercentage || 0
  const currentYear = new Date().getFullYear()

  return (
    <>
      <Card title="Monthly Revenue" buttonLabel="View Report" buttonOnClick={() => setShowModal(true)}>
        <p className="text-2xl font-semibold text-black">LKR {totalRevenue.toLocaleString()}.00</p>
        <p className="text-sm text-gray-600">
          Current Balance:{" "}
          <span className={`font-semibold ${currentBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
            LKR {Math.abs(currentBalance).toLocaleString()}.00 {currentBalance >= 0 ? "(Profit)" : "(Loss)"}
          </span>
        </p>
        <p>
          <span className={`text-sm pr-2 ${growthPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
            {growthPercentage >= 0 ? "+" : ""}
            {growthPercentage}%
          </span>
          <span> from last month</span>
        </p>
        <div className="w-full h-[300px] bg-white p-4 rounded-lg">
          <h2 className="text-sm font-semibold mb-2">
            Financial Year {currentYear}-{currentYear + 1} (Apr 1, {currentYear} - Mar 31, {currentYear + 1})
          </h2>
          <Bar data={getChartData()} options={options} />
        </div>
      </Card>

      {showModal && <ProfitSummary onClose={() => setShowModal(false)} />}
    </>
  )
}

export default RevenueCard