const express = require("express")
const { body, param } = require("express-validator")
const Expense = require("../models/Expense")
const asyncHandler = require("../utils/asyncHandler")
const { handleValidationErrors } = require("../middleware/validation")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Get expenses with filters
// @route   GET /api/expenses
// @access  Private
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { startDate, endDate, section, type, search } = req.query
    
    // Build filter object
    const filter = {}
    
    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    
    // Section filter
    if (section && section !== 'all') {
      filter.section = section
    }
    
    // Type filter
    if (type && type !== 'all') {
      filter.type = type
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { section: { $regex: search, $options: 'i' } }
      ]
    }

    const expenses = await Expense.find(filter)
      .populate("createdBy", "firstName lastName")
      .sort({ date: -1, createdAt: -1 })
    
    res.json({ 
      success: true,
      expenses 
    })
  }),
)

// @desc    Create expense
// @route   POST /api/expenses
// @access  Private
router.post(
  "/",
  [
    body("date").isISO8601().withMessage("Valid date is required"),
    body("section").isIn(["Construction Site", "Employee", "Supplier"]).withMessage("Invalid section"),
    body("description")
      .trim()
      .isLength({ min: 3, max: 500 })
      .withMessage("Description must be between 3 and 500 characters"),
    body("type").isIn(["income", "expense"]).withMessage("Type must be either income or expense"),
    body("amount").isNumeric().withMessage("Amount must be a number").custom(value => value > 0),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { date, section, description, type, amount, paymentSlip } = req.body

    const expense = await Expense.create({
      date: new Date(date),
      section,
      description,
      type,
      amount: Number.parseFloat(amount),
      paymentSlip: paymentSlip || "",
      createdBy: req.user.id,
    })

    await expense.populate("createdBy", "firstName lastName")

    res.status(201).json({
      message: "Expense recorded successfully",
      expense,
    })
  }),
)

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
router.put(
  "/:id",
  authorize("supervisor", "manager"),
  [
    param("id").isMongoId().withMessage("Invalid expense ID"),
    body("date").optional().isISO8601().withMessage("Valid date is required"),
    body("section").optional().isIn(["Construction Site", "Employee", "Supplier"]).withMessage("Invalid section"),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 3, max: 500 })
      .withMessage("Description must be between 3 and 500 characters"),
    body("type").optional().isIn(["income", "expense"]).withMessage("Type must be either income or expense"),
    body("amount").optional().isNumeric().withMessage("Amount must be a number").custom(value => value > 0),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("createdBy", "firstName lastName")

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" })
    }

    res.json({
      message: "Expense updated successfully",
      expense,
    })
  }),
)

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private (Manager only)
router.delete(
  "/:id",
  authorize("manager"),
  [param("id").isMongoId().withMessage("Invalid expense ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const expense = await Expense.findByIdAndDelete(req.params.id)

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" })
    }

    res.json({ message: "Expense deleted successfully" })
  }),
)

// @desc    Get expense statistics
// @route   GET /api/expenses/stats
// @access  Private
router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query
    
    const filter = {}
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }

    const stats = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] }
          },
          totalExpenses: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] }
          },
          count: { $sum: 1 }
        }
      }
    ])

    const result = stats[0] || { totalIncome: 0, totalExpenses: 0, count: 0 }
    const currentBalance = result.totalIncome - result.totalExpenses

    res.json({
      success: true,
      stats: {
        ...result,
        currentBalance
      }
    })
  }),
)

module.exports = router