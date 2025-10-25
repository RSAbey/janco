const express = require("express")
const { body, param, query } = require("express-validator")
const WorkSchedule = require("../models/WorkSchedule")
const asyncHandler = require("../utils/asyncHandler")
const { handleValidationErrors } = require("../middleware/validation")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Create work schedule
// @route   POST /api/work-schedule
// @access  Private (Supervisor, Manager)
router.post(
  "/",
  authorize("supervisor", "manager"),
  [
    body("project").isMongoId().withMessage("Valid project ID is required"),
    body("section")
      .isIn(["Pre-Project Process", "Project Process", "Project Handover Process"])
      .withMessage("Invalid section"),
    body("step").trim().isLength({ min: 1 }).withMessage("Step identifier is required"),
    body("title").trim().isLength({ min: 2, max: 200 }).withMessage("Title must be between 2 and 200 characters"),
    body("timeFrame").trim().isLength({ min: 1 }).withMessage("Time frame is required"),
    body("startDate").isISO8601().withMessage("Valid start date is required"),
    body("endDate").isISO8601().withMessage("Valid end date is required"),
    body("workDescription").optional().trim(),
    body("order").optional().isInt({ min: 0 }).withMessage("Order must be a positive integer"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      console.log("Creating work schedule:", req.body)

      const workSchedule = await WorkSchedule.create({
        ...req.body,
        createdBy: req.user.id,
      })

      await workSchedule.populate("project", "name projectId")
      await workSchedule.populate("createdBy", "firstName lastName")

      console.log("Work schedule created successfully:", workSchedule)

      res.status(201).json({
        message: "Work schedule created successfully",
        workSchedule,
      })
    } catch (error) {
      console.error("Error creating work schedule:", error)
      res.status(400).json({
        message: error.message || "Failed to create work schedule",
        error: process.env.NODE_ENV === "development" ? error : {},
      })
    }
  }),
)

// @desc    Get work schedules
// @route   GET /api/work-schedule
// @access  Private
router.get(
  "/",
  [
    query("projectId").optional().isMongoId().withMessage("Invalid project ID"),
    query("section")
      .optional()
      .isIn(["Pre-Project Process", "Project Process", "Project Handover Process"])
      .withMessage("Invalid section"),
    query("status").optional().isIn(["pending", "in-progress", "completed", "cancelled"]).withMessage("Invalid status"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { projectId, section, status } = req.query

    const filter = {}
    if (projectId) filter.project = projectId
    if (section) filter.section = section
    if (status) filter.status = status

    const workSchedules = await WorkSchedule.find(filter)
      .populate("project", "name projectId")
      .populate("createdBy", "firstName lastName")
      .sort({ section: 1, order: 1, createdAt: 1 })

    res.json({ workSchedules })
  }),
)

// @desc    Update work schedule
// @route   PUT /api/work-schedule/:id
// @access  Private (Supervisor, Manager)
router.put(
  "/:id",
  authorize("supervisor", "manager"),
  [
    param("id").isMongoId().withMessage("Invalid work schedule ID"),
    body("title")
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage("Title must be between 2 and 200 characters"),
    body("timeFrame").optional().trim().isLength({ min: 1 }).withMessage("Time frame is required"),
    body("startDate").optional().isISO8601().withMessage("Valid start date is required"),
    body("endDate").optional().isISO8601().withMessage("Valid end date is required"),
    body("workDescription").optional().trim(),
    body("status").optional().isIn(["pending", "in-progress", "completed", "cancelled"]).withMessage("Invalid status"),
    body("order").optional().isInt({ min: 0 }).withMessage("Order must be a positive integer"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const workSchedule = await WorkSchedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("project", "name projectId")
      .populate("createdBy", "firstName lastName")

    if (!workSchedule) {
      return res.status(404).json({ message: "Work schedule not found" })
    }

    res.json({
      message: "Work schedule updated successfully",
      workSchedule,
    })
  }),
)

// @desc    Delete work schedule
// @route   DELETE /api/work-schedule/:id
// @access  Private (Supervisor, Manager)
router.delete(
  "/:id",
  authorize("supervisor", "manager"),
  [param("id").isMongoId().withMessage("Invalid work schedule ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const workSchedule = await WorkSchedule.findByIdAndDelete(req.params.id)

    if (!workSchedule) {
      return res.status(404).json({ message: "Work schedule not found" })
    }

    res.json({ message: "Work schedule deleted successfully" })
  }),
)

module.exports = router
