const express = require("express")
const User = require("../models/User")
const Project = require("../models/Project")
const Labour = require("../models/Labour")
const Material = require("../models/Material")
const Supplier = require("../models/Supplier")
const Attendance = require("../models/Attendance")
const Invoice = require("../models/Invoice")
const Expense = require("../models/Expense")
const asyncHandler = require("../utils/asyncHandler")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Get dashboard overview
// @route   GET /api/dashboard/overview
// @access  Private
router.get(
  "/overview",
  asyncHandler(async (req, res) => {
    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1)

    // Projects overview
    const projectStats = await Project.aggregate([
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          activeProjects: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          completedProjects: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          onHoldProjects: { $sum: { $cond: [{ $eq: ["$status", "on-hold"] }, 1, 0] } },
          totalBudget: { $sum: "$budget.estimated" },
          totalSpent: { $sum: "$budget.actual" },
        },
      },
    ])

    // Employee stats
    const employeeStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          activeEmployees: { $sum: { $cond: ["$isActive", 1, 0] } },
          employees: { $sum: { $cond: [{ $eq: ["$role", "employee"] }, 1, 0] } },
          supervisors: { $sum: { $cond: [{ $eq: ["$role", "supervisor"] }, 1, 0] } },
          managers: { $sum: { $cond: [{ $eq: ["$role", "manager"] }, 1, 0] } },
        },
      },
    ])

    // Today's attendance
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const attendanceToday = await Attendance.countDocuments({
      date: today,
    })

    // Material alerts
    const lowStockMaterials = await Material.countDocuments({
      isActive: true,
      $expr: {
        $lte: ["$inventory.currentStock", "$inventory.reorderLevel"],
      },
    })

    // Recent invoices
    const recentInvoices = await Invoice.find()
      .populate("customer", "name")
      .populate("project", "name")
      .sort({ createdAt: -1 })
      .limit(5)

    // Monthly revenue
    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          invoiceDate: { $gte: startOfMonth },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$pricing.totalAmount" },
          paidRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, "$pricing.totalAmount", 0],
            },
          },
        },
      },
    ])

    // Monthly expenses
    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: "$amount" },
        },
      },
    ])

    res.json({
      projects: projectStats[0] || {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        onHoldProjects: 0,
        totalBudget: 0,
        totalSpent: 0,
      },
      employees: employeeStats[0] || {
        totalEmployees: 0,
        activeEmployees: 0,
        employees: 0,
        supervisors: 0,
        managers: 0,
      },
      attendance: {
        todayPresent: attendanceToday,
      },
      materials: {
        lowStockAlerts: lowStockMaterials,
      },
      finance: {
        monthlyRevenue: monthlyRevenue[0]?.totalRevenue || 0,
        monthlyPaidRevenue: monthlyRevenue[0]?.paidRevenue || 0,
        monthlyExpenses: monthlyExpenses[0]?.totalExpenses || 0,
        monthlyProfit: (monthlyRevenue[0]?.totalRevenue || 0) - (monthlyExpenses[0]?.totalExpenses || 0),
      },
      recentInvoices,
    })
  }),
)

// @desc    Get recent activities
// @route   GET /api/dashboard/activities
// @access  Private
router.get(
  "/activities",
  asyncHandler(async (req, res) => {
    const limit = Number.parseInt(req.query.limit) || 10

    // Recent projects
    const recentProjects = await Project.find()
      .populate("projectManager", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("name status createdAt projectManager")

    // Recent expenses
    const recentExpenses = await Expense.find()
      .populate("project", "name")
      .populate("recordedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("description amount category project recordedBy createdAt")

    // Recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("firstName lastName role createdAt")

    res.json({
      recentProjects,
      recentExpenses,
      recentUsers,
    })
  }),
)

// @desc    Get performance metrics
// @route   GET /api/dashboard/metrics
// @access  Private (Supervisor, Manager)
router.get(
  "/metrics",
  authorize("supervisor", "manager"),
  asyncHandler(async (req, res) => {
    const currentDate = new Date()
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    // Project completion rate
    const projectMetrics = await Project.aggregate([
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          completedProjects: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          onTimeProjects: {
            $sum: {
              $cond: [
                {
                  $and: [{ $eq: ["$status", "completed"] }, { $lte: ["$actualEndDate", "$endDate"] }],
                },
                1,
                0,
              ],
            },
          },
          averageProgress: { $avg: "$progress" },
        },
      },
    ])

    // Employee productivity (based on attendance)
    const employeeMetrics = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: lastMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalAttendanceRecords: { $sum: 1 },
          totalHours: { $sum: "$totalHours" },
          averageHoursPerDay: { $avg: "$totalHours" },
          totalOvertimeHours: { $sum: "$overtimeHours" },
        },
      },
    ])

    // Supplier performance
    const supplierMetrics = await Supplier.aggregate([
      {
        $group: {
          _id: null,
          totalSuppliers: { $sum: 1 },
          averageRating: { $avg: "$performance.rating" },
          averageDeliveryTime: { $avg: "$performance.averageDeliveryTime" },
        },
      },
    ])

    res.json({
      projects: projectMetrics[0] || {
        totalProjects: 0,
        completedProjects: 0,
        onTimeProjects: 0,
        averageProgress: 0,
      },
      employees: employeeMetrics[0] || {
        totalAttendanceRecords: 0,
        totalHours: 0,
        averageHoursPerDay: 0,
        totalOvertimeHours: 0,
      },
      suppliers: supplierMetrics[0] || {
        totalSuppliers: 0,
        averageRating: 0,
        averageDeliveryTime: 0,
      },
    })
  }),
)

// @desc    Get revenue data
// @route   GET /api/dashboard/revenue
// @access  Private
router.get(
  "/revenue",
  asyncHandler(async (req, res) => {
    const { period, year } = req.query
    const currentYear = parseInt(year) || new Date().getFullYear()
    
    // Financial year: April 1 of current year to March 31 of next year
    const financialYearStart = new Date(currentYear, 3, 1) // April 1 of current year
    const financialYearEnd = new Date(currentYear + 1, 2, 31) // March 31 of next year

    // Get all income transactions for the financial year
    const incomeData = await Expense.find({
      type: "income",
      date: {
        $gte: financialYearStart,
        $lte: financialYearEnd
      }
    }).sort({ date: 1 })

    // Group by month for financial year (April to March)
    const monthlyData = []
    const monthNames = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]
    
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
      
      const monthIncome = incomeData
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

    // Calculate total revenue and growth
    const totalRevenue = monthlyData.reduce((sum, month) => sum + month.amount, 0)
    
    // Growth calculation based on current month vs previous month
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    // Adjust for financial year: if current month is Jan-Mar, it's in next year's financial data
    const financialMonthIndex = currentMonth >= 3 ? currentMonth - 3 : currentMonth + 9
    
    const currentMonthAmount = monthlyData[financialMonthIndex]?.amount || 0
    const previousMonthAmount = financialMonthIndex > 0 ? monthlyData[financialMonthIndex - 1]?.amount || 0 : 0
    const growthPercentage = previousMonthAmount > 0 
      ? ((currentMonthAmount - previousMonthAmount) / previousMonthAmount) * 100 
      : 0

    res.json({
      success: true,
      revenue: {
        totalRevenue,
        growthPercentage: Math.round(growthPercentage * 100) / 100,
        monthlyData
      }
    })
  })
)

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const currentDate = new Date()
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    // Get current month stats
    const currentMonthStats = await Expense.aggregate([
      {
        $match: {
          date: {
            $gte: currentMonthStart,
            $lte: currentMonthEnd
          }
        }
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ])

    const income = currentMonthStats.find(stat => stat._id === "income")?.total || 0
    const expenses = currentMonthStats.find(stat => stat._id === "expense")?.total || 0
    const profit = income - expenses

    res.json({
      success: true,
      stats: {
        totalIncome: income,
        totalExpenses: expenses,
        currentBalance: profit,
        transactionCount: currentMonthStats.reduce((sum, stat) => sum + stat.count, 0)
      }
    })
  })
)

module.exports = router
