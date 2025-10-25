const express = require("express")
const { body, param, query } = require("express-validator")
const Labour = require("../models/Labour")
const LabourSalary = require("../models/LabourSalary")
const asyncHandler = require("../utils/asyncHandler")
const { handleValidationErrors } = require("../middleware/validation")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Get all labourers
// @route   GET /api/labour
// @access  Private
router.get(
  "/",
  [
    query("projectId").optional().isMongoId().withMessage("Invalid project ID"),
    query("skillLevel").optional().isIn(["Skilled", "Non"]).withMessage("Invalid skill level"),
    query("status").optional().isIn(["active", "inactive", "terminated"]).withMessage("Invalid status"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { projectId, skillLevel, status, search } = req.query

    // Build filter object
    const filter = {}
    if (projectId) filter.project = projectId
    if (skillLevel) filter.skillLevel = skillLevel
    if (status) filter.status = status

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { labourId: { $regex: search, $options: "i" } },
        { contact: { $regex: search, $options: "i" } },
      ]
    }

    const labourers = await Labour.find(filter)
      .populate("project", "name projectId")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })

    res.json({ labourers })
  }),
)

// @desc    Get labourer by ID
// @route   GET /api/labour/:id
// @access  Private
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid labour ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const labourer = await Labour.findById(req.params.id)
      .populate("project", "name projectId location")
      .populate("createdBy", "firstName lastName")

    if (!labourer) {
      return res.status(404).json({ message: "Labourer not found" })
    }

    res.json({ labourer })
  }),
)

router.post(
  "/salaries",
  authorize("supervisor", "manager"),
  [
    body("labour").isMongoId().withMessage("Valid labour ID is required"),
    body("project").isMongoId().withMessage("Valid project ID is required"),
    body("amount")
      .isNumeric()
      .withMessage("Amount must be a number")
      .isFloat({ min: 0 })
      .withMessage("Amount must be positive"),
    body("payPeriod").isIn(["daily", "weekly", "monthly", "project"]).withMessage("Invalid pay period"),
    body("paymentDate").isISO8601().withMessage("Valid payment date is required"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      console.log("Creating salary payment:", req.body)

      const salary = await LabourSalary.create({
        ...req.body,
        createdBy: req.user.id,
      })

      await salary.populate("labour", "name labourId skillLevel")
      await salary.populate("project", "name projectId")
      await salary.populate("createdBy", "firstName lastName")

      console.log("Salary payment created successfully:", salary)

      res.status(201).json({
        message: "Salary payment created successfully",
        salary,
      })
    } catch (error) {
      console.error("Error creating salary payment:", error)
      res.status(400).json({
        message: error.message || "Failed to create salary payment",
        error: process.env.NODE_ENV === "development" ? error : {},
      })
    }
  }),
)

// @desc    Update labourer
// @route   PUT /api/labour/:id
// @access  Private (Supervisor, Manager)
router.put(
  "/:id",
  authorize("supervisor", "manager"),
  [
    param("id").isMongoId().withMessage("Invalid labour ID"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("contact")
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage("Contact number must be at least 10 characters"),
    body("skillLevel").optional().isIn(["Skilled", "Non"]).withMessage("Invalid skill level"),
    body("baseSalary")
      .optional()
      .isNumeric()
      .withMessage("Base salary must be a number")
      .isFloat({ min: 0 })
      .withMessage("Base salary must be positive"),
    body("status").optional().isIn(["active", "inactive", "terminated"]).withMessage("Invalid status"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const labourer = await Labour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("project", "name projectId")
      .populate("createdBy", "firstName lastName")

    if (!labourer) {
      return res.status(404).json({ message: "Labourer not found" })
    }

    res.json({
      message: "Labourer updated successfully",
      labourer,
    })
  }),
)

// @desc    Delete labourer
// @route   DELETE /api/labour/:id
// @access  Private (Supervisor, Manager)
router.delete(
  "/:id",
  authorize("supervisor", "manager"),
  [param("id").isMongoId().withMessage("Invalid labour ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const labourer = await Labour.findByIdAndDelete(req.params.id)

    if (!labourer) {
      return res.status(404).json({ message: "Labourer not found" })
    }

    // Also delete associated salary records
    await LabourSalary.deleteMany({ labour: req.params.id })

    res.json({ message: "Labourer deleted successfully" })
  }),
)

// @desc    Get labourer salaries
// @route   GET /api/labour/:id/salaries
// @access  Private
router.get(
  "/:id/salaries",
  [param("id").isMongoId().withMessage("Invalid labour ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const salaries = await LabourSalary.find({ labour: req.params.id })
      .populate("project", "name projectId")
      .populate("createdBy", "firstName lastName")
      .sort({ paymentDate: -1 })

    res.json({ salaries })
  }),
)

// @desc    Get all salaries
// @route   GET /api/labour/salaries/all
// @access  Private
router.get(
  "/salaries/all",
  [
    query("projectId").optional().isMongoId().withMessage("Invalid project ID"),
    query("status").optional().isIn(["pending", "paid", "cancelled"]).withMessage("Invalid status"),
    query("startDate").optional().isISO8601().withMessage("Invalid start date"),
    query("endDate").optional().isISO8601().withMessage("Invalid end date"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { projectId, status, startDate, endDate } = req.query

    const filter = {}
    if (projectId) filter.project = projectId
    if (status) filter.status = status

    if (startDate || endDate) {
      filter.paymentDate = {}
      if (startDate) filter.paymentDate.$gte = new Date(startDate)
      if (endDate) filter.paymentDate.$lte = new Date(endDate)
    }

    const salaries = await LabourSalary.find(filter)
      .populate("labour", "name labourId skillLevel")
      .populate("project", "name projectId")
      .populate("createdBy", "firstName lastName")
      .sort({ paymentDate: -1 })

    res.json({ salaries })
  }),
)

// @desc    Create new labourer
// @route   POST /api/labour
// @access  Private (Supervisor, Manager)
router.post(
  "/",
  authorize("supervisor", "manager"),
  [
    body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
    body("contact").trim().isLength({ min: 10 }).withMessage("Contact number must be at least 10 characters"),
    body("skillLevel").isIn(["Skilled", "Non"]).withMessage("Invalid skill level"),
    body("baseSalary")
      .isNumeric()
      .withMessage("Base salary must be a number")
      .isFloat({ min: 0 })
      .withMessage("Base salary must be positive"),
    body("project").isMongoId().withMessage("Valid project ID is required"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      console.log("Received labour creation request:", req.body)

      const labourer = await Labour.create({
        ...req.body,
        createdBy: req.user.id,
      })

      await labourer.populate("project", "name projectId")
      await labourer.populate("createdBy", "firstName lastName")

      console.log("Labourer created successfully:", labourer)

      res.status(201).json({
        message: "Labourer created successfully",
        labourer,
      })
    } catch (error) {
      console.error("Error creating labourer:", error)

      // Send more detailed error message
      res.status(400).json({
        message: error.message || "Failed to create labourer",
        error: process.env.NODE_ENV === "development" ? error : {},
      })
    }
  }),
)

// @desc    Update salary payment status
// @route   PUT /api/labour/salaries/:id
// @access  Private (Supervisor, Manager)
router.put(
  "/salaries/:id",
  authorize("supervisor", "manager"),
  [
    param("id").isMongoId().withMessage("Invalid salary ID"),
    body("status").optional().isIn(["pending", "paid", "cancelled", "overdue"]).withMessage("Invalid status"),
    body("amount")
      .optional()
      .isNumeric()
      .withMessage("Amount must be a number")
      .isFloat({ min: 0 })
      .withMessage("Amount must be positive"),
    body("description").optional().isString().withMessage("Description must be a string"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const updateData = {}

    // Only include fields that are provided in the request
    if (req.body.status !== undefined) updateData.status = req.body.status
    if (req.body.amount !== undefined) updateData.amount = req.body.amount
    if (req.body.description !== undefined) updateData.description = req.body.description

    const salary = await LabourSalary.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("labour", "name labourId skillLevel")
      .populate("project", "name projectId")
      .populate("createdBy", "firstName lastName")

    if (!salary) {
      return res.status(404).json({ message: "Salary payment not found" })
    }

    res.json({
      message: "Salary payment updated successfully",
      salary,
    })
  }),
)

// @desc    Delete salary payment
// @route   DELETE /api/labour/salaries/:id
// @access  Private (Supervisor, Manager)
router.delete(
  "/salaries/:id",
  authorize("supervisor", "manager"),
  [param("id").isMongoId().withMessage("Invalid salary ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const salary = await LabourSalary.findByIdAndDelete(req.params.id)

    if (!salary) {
      return res.status(404).json({ message: "Salary payment not found" })
    }

    res.json({ message: "Salary payment deleted successfully" })
  }),
)

module.exports = router
