const express = require("express")
const router = express.Router()
const Transaction = require("../models/Transaction")
const mongoose = require("mongoose") // Import mongoose
const { protect } = require("../middleware/auth")
const { body, validationResult, param } = require("express-validator")

// Get all transactions for a specific project
router.get(
  "/project/:projectId",
  protect,
  [param("projectId").isMongoId().withMessage("Invalid project ID")],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { projectId } = req.params
      const { page = 1, limit = 10, type, category, startDate, endDate } = req.query

      // Build filter object
      const filter = { projectId }

      if (type) filter.type = type
      if (category) filter.category = category
      if (startDate || endDate) {
        filter.date = {}
        if (startDate) filter.date.$gte = new Date(startDate)
        if (endDate) filter.date.$lte = new Date(endDate)
      }

      const transactions = await Transaction.find(filter)
        .populate("createdBy", "name email")
        .sort({ date: -1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)

      const total = await Transaction.countDocuments(filter)

      // Calculate totals
      const totals = await Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ])

      const totalIncome = totals.find((t) => t._id === "income")?.total || 0
      const totalExpense = totals.find((t) => t._id === "expense")?.total || 0
      const balance = totalIncome - totalExpense

      res.status(200).json({
        success: true,
        data: {
          transactions,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total,
          },
          summary: {
            totalIncome,
            totalExpense,
            balance,
          },
        },
      })
    } catch (error) {
      console.error("Error fetching transactions:", error)
      res.status(500).json({
        success: false,
        message: "Server error while fetching transactions",
      })
    }
  },
)

// Create a new transaction
router.post(
  "/",
  protect,
  [
    body("projectId").isMongoId().withMessage("Invalid project ID"),
    body("type").isIn(["income", "expense"]).withMessage("Type must be income or expense"),
    body("category").notEmpty().withMessage("Category is required"),
    body("description").trim().isLength({ min: 1 }).withMessage("Description is required"),
    body("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
    body("date").isISO8601().withMessage("Invalid date format"),
    body("paymentMethod").optional().isIn(["Cash", "Bank Transfer", "Check", "Credit Card", "Other"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const transactionData = {
        ...req.body,
        createdBy: req.user.id,
      }

      const transaction = await Transaction.create(transactionData)
      await transaction.populate("createdBy", "name email")

      res.status(201).json({
        success: true,
        data: transaction,
        message: "Transaction created successfully",
      })
    } catch (error) {
      console.error("Error creating transaction:", error)
      res.status(500).json({
        success: false,
        message: "Server error while creating transaction",
      })
    }
  },
)

// Update a transaction
router.put(
  "/:id",
  protect,
  [
    param("id").isMongoId().withMessage("Invalid transaction ID"),
    body("type").optional().isIn(["income", "expense"]),
    body("category").optional().notEmpty(),
    body("description").optional().trim().isLength({ min: 1 }),
    body("amount").optional().isFloat({ min: 0 }),
    body("date").optional().isISO8601(),
    body("paymentMethod").optional().isIn(["Cash", "Bank Transfer", "Check", "Credit Card", "Other"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate("createdBy", "name email")

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        })
      }

      res.status(200).json({
        success: true,
        data: transaction,
        message: "Transaction updated successfully",
      })
    } catch (error) {
      console.error("Error updating transaction:", error)
      res.status(500).json({
        success: false,
        message: "Server error while updating transaction",
      })
    }
  },
)

// Delete a transaction
router.delete("/:id", protect, [param("id").isMongoId().withMessage("Invalid transaction ID")], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const transaction = await Transaction.findByIdAndDelete(req.params.id)

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting transaction:", error)
    res.status(500).json({
      success: false,
      message: "Server error while deleting transaction",
    })
  }
})

// Get transaction summary for a project
router.get(
  "/project/:projectId/summary",
  protect,
  [param("projectId").isMongoId().withMessage("Invalid project ID")],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { projectId } = req.params

      const summary = await Transaction.aggregate([
        { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ])

      const categoryBreakdown = await Transaction.aggregate([
        { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
        {
          $group: {
            _id: { type: "$type", category: "$category" },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ])

      const totalIncome = summary.find((s) => s._id === "income")?.total || 0
      const totalExpense = summary.find((s) => s._id === "expense")?.total || 0
      const balance = totalIncome - totalExpense

      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalIncome,
            totalExpense,
            balance,
            incomeCount: summary.find((s) => s._id === "income")?.count || 0,
            expenseCount: summary.find((s) => s._id === "expense")?.count || 0,
          },
          categoryBreakdown,
        },
      })
    } catch (error) {
      console.error("Error fetching transaction summary:", error)
      res.status(500).json({
        success: false,
        message: "Server error while fetching transaction summary",
      })
    }
  },
)

module.exports = router
