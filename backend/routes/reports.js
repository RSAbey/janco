const express = require("express")
const { body } = require("express-validator")
const { generateExpenseReport } = require("../controllers/reportController")
const { handleValidationErrors } = require("../middleware/validation")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Generate expense report PDF
// @route   POST /api/reports/expenses
// @access  Private
router.post(
  "/expenses",
  [
    body("reportTypes")
      .isArray({ min: 1 })
      .withMessage("Report types must be an array with at least one type"),
    body("reportTypes.*").isIn(["income", "expense"]).withMessage("Invalid report type"),
    body("startDate").isISO8601().withMessage("Valid start date is required"),
    body("endDate").isISO8601().withMessage("Valid end date is required"),
  ],
  handleValidationErrors,
  generateExpenseReport,
)

module.exports = router
