const express = require("express")
const { body, param, query } = require("express-validator")
const Project = require("../models/Project")
const Task = require("../models/Task")
const Expense = require("../models/Expense")
const asyncHandler = require("../utils/asyncHandler")
const { handleValidationErrors } = require("../middleware/validation")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
router.get(
  "/",
  [
    query("status")
      .optional()
      .isIn(["planning", "active", "on-hold", "completed", "cancelled"])
      .withMessage("Invalid status"),
    query("location").optional().isLength({ min: 1 }).withMessage("Location cannot be empty"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { status, location, search } = req.query

    // Build filter object
    const filter = { isActive: true }
    if (status) filter.status = status
    if (location) filter.location = new RegExp(location, "i")

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { projectId: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { documentFileNo: { $regex: search, $options: "i" } },
      ]
    }

    const projects = await Project.find(filter)
      .populate("supervisor", "firstName lastName email")
      .sort({ createdAt: -1 })

    res.json({ projects })
  }),
)

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid project ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)
      .populate("supervisor", "firstName lastName email phone")
      .populate("customerId", "name contactInfo address nic phone")

    if (!project) {
      return res.status(404).json({ message: "Project not found" })
    }

    res.json({ project })
  }),
)

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Supervisor, Manager)
router.post(
  "/",
  authorize("supervisor", "manager"),
  [
    body("name").trim().isLength({ min: 3, max: 100 }).withMessage("Site name must be between 3 and 100 characters"),
    body("supervisor").trim().isLength({ min: 1 }).withMessage("Supervisor name is required"),
    body("location").trim().isLength({ min: 2 }).withMessage("Location is required"),
    body("startDate").isISO8601().withMessage("Valid start date is required"),
    body("endDate").isISO8601().withMessage("Valid end date is required"),
    body("estimatedCost").isNumeric().withMessage("Estimated cost must be a number"),
    body("documentFileNo").trim().isLength({ min: 1 }).withMessage("Document file number is required"),
    body("customerId").optional().isMongoId().withMessage("Valid customer ID is required"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    console.log("[v0] Backend: Received project creation request")
    console.log("[v0] Backend: Request body:", req.body)
    console.log("[v0] Backend: Customer ID received:", req.body.customerId)

    const startDate = new Date(req.body.startDate)
    const endDate = new Date(req.body.endDate)
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) // Duration in days

    const projectData = {
      name: req.body.name,
      supervisor: req.body.supervisor, // Store as string name
      location: req.body.location,
      duration: duration, // Calculated duration
      startDate: startDate,
      endDate: endDate,
      estimatedCost: req.body.estimatedCost,
      documentFileNo: req.body.documentFileNo,
      status: "planning",
      customerId: req.body.customerId || null,
    }

    console.log("[v0] Backend: Project data to be saved:", projectData)

    const project = await Project.create(projectData)

    console.log("[v0] Backend: Project created successfully:", project)
    console.log("[v0] Backend: Customer ID in created project:", project.customerId)

    res.status(201).json({
      message: "Site created successfully",
      project,
    })
  }),
)

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Supervisor, Manager)
router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid project ID"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage("Site name must be between 3 and 100 characters"),
    body("supervisor").optional().isMongoId().withMessage("Valid supervisor ID is required"),
    body("location").optional().trim().isLength({ min: 2 }).withMessage("Location is required"),
    body("duration").optional().isInt({ min: 1 }).withMessage("Duration must be a positive number"),
    body("estimatedCost").optional().isNumeric().withMessage("Estimated cost must be a number"),
    body("documentFileNo").optional().trim().isLength({ min: 1 }).withMessage("Document file number is required"),
    body("status")
      .optional()
      .isIn(["planning", "active", "on-hold", "completed", "cancelled"])
      .withMessage("Invalid status"),
    body("progress").optional().isInt({ min: 0, max: 100 }).withMessage("Progress must be between 0 and 100"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({ message: "Project not found" })
    }

    // Check permissions
    const canEdit = req.user.role === "manager" || req.user.role === "supervisor"

    if (!canEdit) {
      return res.status(403).json({ message: "Access denied" })
    }

    const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("supervisor", "firstName lastName email")

    res.json({
      message: "Site updated successfully",
      project: updatedProject,
    })
  }),
)

// @desc    Assign employee to project
// @route   POST /api/projects/:id/assign
// @access  Private (Supervisor, Manager, Project Manager)
router.post(
  "/:id/assign",
  [
    param("id").isMongoId().withMessage("Invalid project ID"),
    body("employeeId").isMongoId().withMessage("Valid employee ID is required"),
    body("role")
      .optional()
      .isIn(["laborer", "electrician", "plumber", "carpenter", "mason", "operator"])
      .withMessage("Invalid role"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { employeeId, role = "laborer" } = req.body

    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ message: "Project not found" })
    }

    // Check permissions
    const canAssign =
      req.user.role === "manager" || req.user.role === "supervisor" || project.projectManager.toString() === req.user.id

    if (!canAssign) {
      return res.status(403).json({ message: "Access denied" })
    }

    // Check if employee is already assigned
    const isAlreadyAssigned = project.assignedEmployees.some((emp) => emp.employee.toString() === employeeId)

    if (isAlreadyAssigned) {
      return res.status(400).json({ message: "Employee is already assigned to this project" })
    }

    project.assignedEmployees.push({
      employee: employeeId,
      role,
      assignedDate: new Date(),
    })

    await project.save()

    await project.populate("assignedEmployees.employee", "firstName lastName employeeId")

    res.json({
      message: "Employee assigned successfully",
      project,
    })
  }),
)

// @desc    Get project statistics
// @route   GET /api/projects/stats/overview
// @access  Private (Supervisor, Manager)
router.get(
  "/stats/overview",
  authorize("supervisor", "manager"),
  asyncHandler(async (req, res) => {
    const stats = await Project.aggregate([
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          activeProjects: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          completedProjects: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          onHoldProjects: { $sum: { $cond: [{ $eq: ["$status", "on-hold"] }, 1, 0] } },
          totalBudget: { $sum: "$budget.estimated" },
          totalActualCost: { $sum: "$budget.actual" },
          averageProgress: { $avg: "$progress" },
        },
      },
    ])

    const statusBreakdown = await Project.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalBudget: { $sum: "$budget.estimated" },
        },
      },
    ])

    res.json({
      overview: stats[0] || {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        onHoldProjects: 0,
        totalBudget: 0,
        totalActualCost: 0,
        averageProgress: 0,
      },
      statusBreakdown,
    })
  }),
)

module.exports = router
