const express = require("express")
const { body, param, query } = require("express-validator")
const User = require("../models/User")
const asyncHandler = require("../utils/asyncHandler")
const { handleValidationErrors } = require("../middleware/validation")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Supervisor, Manager)
router.get(
  "/",
  authorize("supervisor", "manager"),
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("role").optional().isIn(["employee", "supervisor", "manager"]).withMessage("Invalid role filter"),
    query("department")
      .optional()
      .isIn(["construction", "finance", "administration", "procurement"])
      .withMessage("Invalid department filter"),
    query("search").optional().isLength({ min: 1 }).withMessage("Search term cannot be empty"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Build filter object
    const filter = {}
    if (req.query.role) filter.role = req.query.role
    if (req.query.department) filter.department = req.query.department
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: "i" } },
        { lastName: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
        { employeeId: { $regex: req.query.search, $options: "i" } },
      ]
    }

    // Get users with pagination
    const users = await User.find(filter)
      .select("-password")
      .populate("assignedProjects", "name status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await User.countDocuments(filter)

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    })
  }),
)

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Supervisor, Manager, or own profile)
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid user ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const userId = req.params.id

    // Check if user can access this profile
    if (req.user.role === "employee" && req.user.id !== userId) {
      return res.status(403).json({ message: "Access denied" })
    }

    const user = await User.findById(userId)
      .select("-password")
      .populate("assignedProjects", "name status startDate endDate")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ user })
  }),
)

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Manager or own profile for limited fields)
router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid user ID"),
    body("firstName")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters"),
    body("lastName")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters"),
    body("email").optional().isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("phoneNumber")
      .optional()
      .matches(/^\+?[\d\s-()]+$/)
      .withMessage("Please enter a valid phone number"),
    body("role").optional().isIn(["employee", "supervisor", "manager"]).withMessage("Invalid role"),
    body("department")
      .optional()
      .isIn(["construction", "finance", "administration", "procurement"])
      .withMessage("Invalid department"),
    body("salary").optional().isNumeric().withMessage("Salary must be a number"),
    body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const userId = req.params.id
    const updates = req.body

    // Check permissions
    const isOwnProfile = req.user.id === userId
    const isManager = req.user.role === "manager"

    if (!isOwnProfile && !isManager) {
      return res.status(403).json({ message: "Access denied" })
    }

    // Restrict fields for non-managers
    if (!isManager) {
      const allowedFields = ["firstName", "lastName", "phoneNumber", "address", "skills"]
      const restrictedFields = Object.keys(updates).filter((field) => !allowedFields.includes(field))

      if (restrictedFields.length > 0) {
        return res.status(403).json({
          message: `Access denied. Cannot update: ${restrictedFields.join(", ")}`,
        })
      }
    }

    // Check if email is already taken
    if (updates.email) {
      const existingUser = await User.findOne({ email: updates.email, _id: { $ne: userId } })
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" })
      }
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).populate("assignedProjects", "name status")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      message: "User updated successfully",
      user,
    })
  }),
)

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Manager only)
router.delete(
  "/:id",
  authorize("manager"),
  [param("id").isMongoId().withMessage("Invalid user ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const userId = req.params.id

    // Prevent self-deletion
    if (req.user.id === userId) {
      return res.status(400).json({ message: "Cannot delete your own account" })
    }

    const user = await User.findByIdAndDelete(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ message: "User deleted successfully" })
  }),
)

// @desc    Get user statistics
// @route   GET /api/users/stats/overview
// @access  Private (Supervisor, Manager)
router.get(
  "/stats/overview",
  authorize("supervisor", "manager"),
  asyncHandler(async (req, res) => {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ["$isActive", 1, 0] } },
          inactiveUsers: { $sum: { $cond: ["$isActive", 0, 1] } },
          employees: { $sum: { $cond: [{ $eq: ["$role", "employee"] }, 1, 0] } },
          supervisors: { $sum: { $cond: [{ $eq: ["$role", "supervisor"] }, 1, 0] } },
          managers: { $sum: { $cond: [{ $eq: ["$role", "manager"] }, 1, 0] } },
        },
      },
    ])

    const departmentStats = await User.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
    ])

    res.json({
      overview: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        employees: 0,
        supervisors: 0,
        managers: 0,
      },
      departmentBreakdown: departmentStats,
    })
  }),
)

module.exports = router
