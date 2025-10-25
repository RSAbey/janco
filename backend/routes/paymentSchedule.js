const express = require("express")
const { body, param, query } = require("express-validator")
const PaymentSchedule = require("../models/PaymentSchedule")
const WorkSchedule = require("../models/WorkSchedule")
const asyncHandler = require("../utils/asyncHandler")
const { handleValidationErrors } = require("../middleware/validation")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Create payment schedule
// @route   POST /api/payment-schedule
// @access  Private (Supervisor, Manager)
router.post(
  "/",
  authorize("supervisor", "manager"),
  [
    body("project").isMongoId().withMessage("Valid project ID is required"),
    body("workSchedule").isMongoId().withMessage("Valid work schedule ID is required"),
    body("step").trim().isLength({ min: 1 }).withMessage("Step identifier is required"),
    body("title").trim().isLength({ min: 2, max: 200 }).withMessage("Title must be between 2 and 200 characters"),
    body("timeFrame").trim().isLength({ min: 1 }).withMessage("Time frame is required"),
    body("startDate").isISO8601().withMessage("Valid start date is required"),
    body("endDate").isISO8601().withMessage("Valid end date is required"),
    body("paymentAmount")
      .isNumeric()
      .withMessage("Payment amount must be a number")
      .isFloat({ min: 0 })
      .withMessage("Payment amount must be positive"),
    body("dueDate").isISO8601().withMessage("Valid due date is required"),
    body("order").optional().isInt({ min: 0 }).withMessage("Order must be a positive integer"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      console.log("Creating payment schedule:", req.body)

      // Verify work schedule exists
      const workSchedule = await WorkSchedule.findById(req.body.workSchedule)
      if (!workSchedule) {
        return res.status(404).json({ message: "Work schedule not found" })
      }

      const paymentSchedule = await PaymentSchedule.create({
        ...req.body,
        createdBy: req.user.id,
      })

      await paymentSchedule.populate("project", "name projectId")
      await paymentSchedule.populate("workSchedule", "title step section")
      await paymentSchedule.populate("createdBy", "firstName lastName")

      console.log("Payment schedule created successfully:", paymentSchedule)

      res.status(201).json({
        message: "Payment schedule created successfully",
        paymentSchedule,
      })
    } catch (error) {
      console.error("Error creating payment schedule:", error)
      res.status(400).json({
        message: error.message || "Failed to create payment schedule",
        error: process.env.NODE_ENV === "development" ? error : {},
      })
    }
  }),
)

// @desc    Get payment schedules
// @route   GET /api/payment-schedule
// @access  Private
router.get(
  "/",
  [
    query("projectId").optional().isMongoId().withMessage("Invalid project ID"),
    query("paymentStatus")
      .optional()
      .isIn(["pending", "paid", "overdue", "cancelled"])
      .withMessage("Invalid payment status"),
    query("startDate").optional().isISO8601().withMessage("Invalid start date"),
    query("endDate").optional().isISO8601().withMessage("Invalid end date"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { projectId, paymentStatus, startDate, endDate } = req.query

    const filter = {}
    if (projectId) filter.project = projectId
    if (paymentStatus) filter.paymentStatus = paymentStatus

    if (startDate || endDate) {
      filter.dueDate = {}
      if (startDate) filter.dueDate.$gte = new Date(startDate)
      if (endDate) filter.dueDate.$lte = new Date(endDate)
    }

    const paymentSchedules = await PaymentSchedule.find(filter)
      .populate("project", "name projectId")
      .populate("workSchedule", "title step section")
      .populate("createdBy", "firstName lastName")
      .sort({ order: 1, dueDate: 1 })

    res.json({ paymentSchedules })
  }),
)

// @desc    Update payment schedule
// @route   PUT /api/payment-schedule/:id
// @access  Private (Supervisor, Manager)
router.put(
  "/:id",
  authorize("supervisor", "manager"),
  [
    param("id").isMongoId().withMessage("Invalid payment schedule ID"),
    body("paymentAmount")
      .optional()
      .isNumeric()
      .withMessage("Payment amount must be a number")
      .isFloat({ min: 0 })
      .withMessage("Payment amount must be positive"),
    body("paymentStatus")
      .optional()
      .isIn(["pending", "paid", "overdue", "cancelled"])
      .withMessage("Invalid payment status"),
    body("dueDate").optional().isISO8601().withMessage("Valid due date is required"),
    body("order").optional().isInt({ min: 0 }).withMessage("Order must be a positive integer"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const paymentSchedule = await PaymentSchedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("project", "name projectId")
      .populate("workSchedule", "title step section")
      .populate("createdBy", "firstName lastName")

    if (!paymentSchedule) {
      return res.status(404).json({ message: "Payment schedule not found" })
    }

    res.json({
      message: "Payment schedule updated successfully",
      paymentSchedule,
    })
  }),
)

// @desc    Delete payment schedule
// @route   DELETE /api/payment-schedule/:id
// @access  Private (Supervisor, Manager)
router.delete(
  "/:id",
  authorize("supervisor", "manager"),
  [param("id").isMongoId().withMessage("Invalid payment schedule ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const paymentSchedule = await PaymentSchedule.findByIdAndDelete(req.params.id)

    if (!paymentSchedule) {
      return res.status(404).json({ message: "Payment schedule not found" })
    }

    res.json({ message: "Payment schedule deleted successfully" })
  }),
)

module.exports = router
