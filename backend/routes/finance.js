const express = require("express")
const { body, param, query } = require("express-validator")
const Invoice = require("../models/Invoice")
const Expense = require("../models/Expense")
const Salary = require("../models/Salary")
const Project = require("../models/Project")
const asyncHandler = require("../utils/asyncHandler")
const { handleValidationErrors } = require("../middleware/validation")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Get financial overview
// @route   GET /api/finance/overview
// @access  Private (Supervisor, Manager)
router.get(
  "/overview",
  authorize("supervisor", "manager"),
  [
    query("startDate").optional().isISO8601().withMessage("Invalid start date"),
    query("endDate").optional().isISO8601().withMessage("Invalid end date"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query
    const currentDate = new Date()
    const start = startDate ? new Date(startDate) : new Date(currentDate.getFullYear(), 0, 1)
    const end = endDate ? new Date(endDate) : currentDate

    // Revenue from invoices
    const revenueStats = await Invoice.aggregate([
      {
        $match: {
          invoiceDate: { $gte: start, $lte: end },
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
          pendingRevenue: {
            $sum: {
              $cond: [{ $ne: ["$status", "paid"] }, "$paymentInfo.remainingAmount", 0],
            },
          },
          totalInvoices: { $sum: 1 },
          paidInvoices: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, 1, 0],
            },
          },
        },
      },
    ])

    // Expenses
    const expenseStats = await Expense.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: "$amount" },
          paidExpenses: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$amount", 0],
            },
          },
          pendingExpenses: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "pending"] }, "$amount", 0],
            },
          },
          totalExpenseRecords: { $sum: 1 },
        },
      },
    ])

    // Salary expenses
    const salaryStats = await Salary.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalSalaries: { $sum: "$netSalary" },
          paidSalaries: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$netSalary", 0],
            },
          },
          pendingSalaries: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "pending"] }, "$netSalary", 0],
            },
          },
        },
      },
    ])

    const revenue = revenueStats[0] || {
      totalRevenue: 0,
      paidRevenue: 0,
      pendingRevenue: 0,
      totalInvoices: 0,
      paidInvoices: 0,
    }

    const expenses = expenseStats[0] || {
      totalExpenses: 0,
      paidExpenses: 0,
      pendingExpenses: 0,
      totalExpenseRecords: 0,
    }

    const salaries = salaryStats[0] || {
      totalSalaries: 0,
      paidSalaries: 0,
      pendingSalaries: 0,
    }

    const totalCosts = expenses.totalExpenses + salaries.totalSalaries
    const netProfit = revenue.totalRevenue - totalCosts

    res.json({
      overview: {
        revenue,
        expenses,
        salaries,
        summary: {
          totalRevenue: revenue.totalRevenue,
          totalCosts,
          netProfit,
          profitMargin: revenue.totalRevenue > 0 ? (netProfit / revenue.totalRevenue) * 100 : 0,
        },
      },
    })
  }),
)

// @desc    Get monthly financial trends
// @route   GET /api/finance/trends
// @access  Private (Supervisor, Manager)
router.get(
  "/trends",
  authorize("supervisor", "manager"),
  [query("months").optional().isInt({ min: 1, max: 24 }).withMessage("Months must be between 1 and 24")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const months = Number.parseInt(req.query.months) || 12
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    // Monthly revenue trends
    const revenueTrends = await Invoice.aggregate([
      {
        $match: {
          invoiceDate: { $gte: startDate, $lte: endDate },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$invoiceDate" },
            month: { $month: "$invoiceDate" },
          },
          revenue: { $sum: "$pricing.totalAmount" },
          invoiceCount: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ])

    // Monthly expense trends
    const expenseTrends = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          expenses: { $sum: "$amount" },
          expenseCount: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ])

    res.json({
      trends: {
        revenue: revenueTrends,
        expenses: expenseTrends,
      },
    })
  }),
)

// @desc    Get project profitability
// @route   GET /api/finance/project-profitability
// @access  Private (Supervisor, Manager)
router.get(
  "/project-profitability",
  authorize("supervisor", "manager"),
  asyncHandler(async (req, res) => {
    const projectProfitability = await Project.aggregate([
      {
        $lookup: {
          from: "invoices",
          localField: "_id",
          foreignField: "project",
          as: "invoices",
        },
      },
      {
        $lookup: {
          from: "expenses",
          localField: "_id",
          foreignField: "project",
          as: "expenses",
        },
      },
      {
        $project: {
          name: 1,
          projectId: 1,
          status: 1,
          estimatedBudget: "$budget.estimated",
          actualBudget: "$budget.actual",
          totalRevenue: { $sum: "$invoices.pricing.totalAmount" },
          totalExpenses: { $sum: "$expenses.amount" },
          profitLoss: {
            $subtract: [{ $sum: "$invoices.pricing.totalAmount" }, { $sum: "$expenses.amount" }],
          },
          profitMargin: {
            $cond: [
              { $gt: [{ $sum: "$invoices.pricing.totalAmount" }, 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      {
                        $subtract: [{ $sum: "$invoices.pricing.totalAmount" }, { $sum: "$expenses.amount" }],
                      },
                      { $sum: "$invoices.pricing.totalAmount" },
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $sort: { profitLoss: -1 },
      },
    ])

    res.json({ projectProfitability })
  }),
)

module.exports = router
