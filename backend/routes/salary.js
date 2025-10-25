const express = require("express")
const { body, param, query } = require("express-validator")
const Salary = require("../models/Salary")
const asyncHandler = require("../utils/asyncHandler")
const { handleValidationErrors } = require("../middleware/validation")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

router.use(auth)

// @desc    Create new salary record
// @route   POST /api/salary
// @access  Private (Manager only)
router.post(
  "/",
  authorize("manager"),
  [
    body("id").trim().isLength({ min: 1 }).withMessage("Employer ID is required"),
    body("position").isIn(["supervisor", "employee"]).withMessage("Invalid position"),
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("salary").isNumeric().withMessage("Salary must be a number"),
    body("status").isIn(["paid", "not"]).withMessage("Invalid status"),
    body("month").isInt({ min: 1, max: 12 }).withMessage("Month must be between 1 and 12"),
    body("year").isInt({ min: 2020 }).withMessage("Invalid year"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id, position, email, salary, status, month, year } = req.body

    console.log("Creating salary with data:", req.body);

    // Check if salary already exists for this employee and period
    const existingPeriodSalary = await Salary.findOne({ 
      id,
      month: Number.parseInt(month), 
      year: Number.parseInt(year) 
    })
    
    if (existingPeriodSalary) {
      return res.status(400).json({ message: "Salary already exists for this employee and period" })
    }

    const salaryRecord = await Salary.create({
      id,
      position,
      email,
      salary: Number.parseFloat(salary),
      status,
      month: Number.parseInt(month),
      year: Number.parseInt(year),
      processedBy: req.user.id,
    });

    res.status(201).json({
      message: "Salary record created successfully",
      salary: salaryRecord,
    })
  }),
)

// @desc    Get all salary records
// @route   GET /api/salary
// @access  Private
router.get(
  "/",
  [
    query("month").optional().isInt({ min: 1, max: 12 }).withMessage("Invalid month"),
    query("year").optional().isInt({ min: 2020 }).withMessage("Invalid year"),
    query("status").optional().isIn(["paid", "not"]).withMessage("Invalid status"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      const { month, year, status } = req.query

      const filter = {}

      if (month) filter.month = Number.parseInt(month)
      if (year) filter.year = Number.parseInt(year)
      if (status) filter.status = status

      console.log("Fetching salaries with filter:", filter)

      const salaries = await Salary.find(filter)
        .sort({ year: -1, month: -1, createdAt: -1 })

      console.log("Found salaries:", salaries.length)

      res.json({ 
        success: true,
        salaries 
      })
    } catch (error) {
      console.error("Error in GET /api/salary:", error)
      res.status(500).json({ 
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : {}
      })
    }
  }),
)

// @desc    Update salary record
// @route   PUT /api/salary/:id
// @access  Private (Manager only)
router.put(
  "/:id",
  authorize("manager"),
  [
    param("id").isMongoId().withMessage("Invalid salary ID"),
    body("position").optional().isIn(["supervisor", "employee"]).withMessage("Invalid position"),
    body("email").optional().isEmail().withMessage("Please enter a valid email"),
    body("salary").optional().isNumeric().withMessage("Salary must be a number"),
    body("status").optional().isIn(["paid", "not"]).withMessage("Invalid status"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const salary = await Salary.findById(req.params.id)
    if (!salary) {
      return res.status(404).json({ message: "Salary record not found" })
    }

    const updatedSalary = await Salary.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true },
    )

    res.json({
      message: "Salary record updated successfully",
      salary: updatedSalary,
    })
  }),
)

// @desc    Delete salary record
// @route   DELETE /api/salary/:id
// @access  Private (Manager only)
router.delete(
  "/:id",
  authorize("manager"),
  [param("id").isMongoId().withMessage("Invalid salary ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const salary = await Salary.findById(req.params.id)
    if (!salary) {
      return res.status(404).json({ message: "Salary record not found" })
    }

    await Salary.findByIdAndDelete(req.params.id)

    res.json({
      message: "Salary record deleted successfully",
    })
  }),
)

module.exports = router