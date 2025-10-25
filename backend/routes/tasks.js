const express = require("express")
const { body, param, query } = require("express-validator")
const Task = require("../models/Task")
const Project = require("../models/Project")
const asyncHandler = require("../utils/asyncHandler")
const { handleValidationErrors } = require("../middleware/validation")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
router.get(
  "/",
  [
    query("project").optional().isMongoId().withMessage("Invalid project ID"),
    query("status")
      .optional()
      .isIn(["todo", "in-progress", "review", "completed", "cancelled"])
      .withMessage("Invalid status"),
    query("priority").optional().isIn(["low", "medium", "high", "urgent"]).withMessage("Invalid priority"),
    query("assignedTo").optional().isMongoId().withMessage("Invalid user ID"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { project, status, priority, assignedTo } = req.query

    // Build filter
    const filter = {}
    if (project) filter.project = project
    if (status) filter.status = status
    if (priority) filter.priority = priority
    if (assignedTo) filter.assignedTo = assignedTo

    // Role-based filtering
    if (req.user.role === "employee") {
      filter.assignedTo = req.user.id
    }

    const tasks = await Task.find(filter)
      .populate("project", "name projectId")
      .populate("assignedTo", "firstName lastName employeeId")
      .populate("createdBy", "firstName lastName")
      .sort({ dueDate: 1, priority: -1 })

    res.json({ tasks })
  }),
)

// @desc    Create task
// @route   POST /api/tasks
// @access  Private (Supervisor, Manager, Project Manager)
router.post(
  "/",
  [
    body("title").trim().isLength({ min: 3, max: 200 }).withMessage("Title must be between 3 and 200 characters"),
    body("project").isMongoId().withMessage("Valid project ID is required"),
    body("phase").trim().isLength({ min: 1 }).withMessage("Phase is required"),
    body("startDate").isISO8601().withMessage("Valid start date is required"),
    body("dueDate").isISO8601().withMessage("Valid due date is required"),
    body("assignedTo").optional().isArray().withMessage("Assigned users must be an array"),
    body("priority").optional().isIn(["low", "medium", "high", "urgent"]).withMessage("Invalid priority"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    // Check if user can create tasks for this project
    const project = await Project.findById(req.body.project)
    if (!project) {
      return res.status(404).json({ message: "Project not found" })
    }

    const canCreate =
      req.user.role === "manager" || req.user.role === "supervisor" || project.projectManager.toString() === req.user.id

    if (!canCreate) {
      return res.status(403).json({ message: "Access denied" })
    }

    const task = await Task.create({
      ...req.body,
      createdBy: req.user.id,
    })

    await task.populate("project", "name projectId")
    await task.populate("assignedTo", "firstName lastName employeeId")
    await task.populate("createdBy", "firstName lastName")

    res.status(201).json({
      message: "Task created successfully",
      task,
    })
  }),
)

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid task ID"),
    body("status")
      .optional()
      .isIn(["todo", "in-progress", "review", "completed", "cancelled"])
      .withMessage("Invalid status"),
    body("progress").optional().isInt({ min: 0, max: 100 }).withMessage("Progress must be between 0 and 100"),
    body("actualHours").optional().isNumeric().withMessage("Actual hours must be a number"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id).populate("project")

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    // Check permissions
    const isAssigned = task.assignedTo.some((user) => user.toString() === req.user.id)
    const canEdit =
      req.user.role === "manager" ||
      req.user.role === "supervisor" ||
      task.project.projectManager.toString() === req.user.id ||
      isAssigned

    if (!canEdit) {
      return res.status(403).json({ message: "Access denied" })
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("project", "name projectId")
      .populate("assignedTo", "firstName lastName employeeId")
      .populate("createdBy", "firstName lastName")

    res.json({
      message: "Task updated successfully",
      task: updatedTask,
    })
  }),
)

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
router.post(
  "/:id/comments",
  [
    param("id").isMongoId().withMessage("Invalid task ID"),
    body("comment").trim().isLength({ min: 1, max: 1000 }).withMessage("Comment must be between 1 and 1000 characters"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    task.comments.push({
      user: req.user.id,
      comment: req.body.comment,
    })

    await task.save()

    await task.populate("comments.user", "firstName lastName")

    res.json({
      message: "Comment added successfully",
      comments: task.comments,
    })
  }),
)

module.exports = router
