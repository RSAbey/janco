const express = require("express")
const { body } = require("express-validator")
const bcrypt = require("bcryptjs")
const User = require("../models/User")
const generateToken = require("../utils/generateToken")
const asyncHandler = require("../utils/asyncHandler")
const { handleValidationErrors } = require("../middleware/validation")
const { auth } = require("../middleware/auth")

const router = express.Router()

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (but in production, this should be restricted to managers)
router.post(
  "/register",
  [
    body("firstName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters"),
    body("lastName").trim().isLength({ min: 2, max: 50 }).withMessage("Last name must be between 2 and 50 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
    body("role").isIn(["employee", "supervisor", "manager"]).withMessage("Invalid role"),
    body("department")
      .optional()
      .isIn(["construction", "finance", "administration", "procurement"])
      .withMessage("Invalid department"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, role, department, phoneNumber } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" })
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      department,
      phoneNumber,
    })

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
      },
    })
  }),
)

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password")

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated. Please contact administrator." })
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        lastLogin: user.lastLogin,
      },
    })
  }),
)

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).populate("assignedProjects", "name status")

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        phoneNumber: user.phoneNumber,
        address: user.address,
        hireDate: user.hireDate,
        salary: user.salary,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        skills: user.skills,
        certifications: user.certifications,
        assignedProjects: user.assignedProjects,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  }),
)

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
router.put(
  "/password",
  auth,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("New password must contain at least one uppercase letter, one lowercase letter, and one number"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body

    // Get user with password
    const user = await User.findById(req.user.id).select("+password")

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({ message: "Password updated successfully" })
  }),
)

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
router.post("/logout", auth, (req, res) => {
  res.json({ message: "Logged out successfully" })
})

module.exports = router

// --- Password verification for sensitive actions ---
// @desc    Verify current user's password
// @route   POST /api/auth/verify-password
// @access  Private
router.post(
  "/verify-password",
  auth,
  [body("password").notEmpty().withMessage("Password is required")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { password } = req.body

    // Load current user with password for comparison
    const user = await User.findById(req.user.id).select("+password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const isValid = await user.comparePassword(password)
    if (!isValid) {
      return res.status(401).json({ message: "Invalid password" })
    }

    res.json({ valid: true })
  }),
)
