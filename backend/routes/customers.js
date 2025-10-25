const express = require("express")
const { body, param, query } = require("express-validator")
const Customer = require("../models/Customer")
const Project = require("../models/Project")
const Invoice = require("../models/Invoice")
const asyncHandler = require("../utils/asyncHandler")
const { handleValidationErrors } = require("../middleware/validation")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
router.get(
  "/",
  [
    query("type").optional().isIn(["individual", "company", "government", "non_profit"]).withMessage("Invalid type"),
    query("status").optional().isIn(["active", "inactive", "blacklisted"]).withMessage("Invalid status"),
    query("search").optional().isLength({ min: 1 }).withMessage("Search term cannot be empty"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { type, status, search } = req.query

    // Build filter object
    const filter = {}
    if (type) filter.type = type
    if (status) filter.status = status

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { customerCode: { $regex: search, $options: "i" } },
        { "contactInfo.primaryContact.email": { $regex: search, $options: "i" } },
      ]
    }

    const customers = await Customer.find(filter)
      .populate("projects", "name status")
      .populate("createdBy", "firstName lastName")
      .sort({ name: 1 })

    res.json({ customers })
  }),
)

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid customer ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id)
      .populate("projects", "name status startDate endDate budget")
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName")

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" })
    }

    res.json({ customer })
  }),
)

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private (Supervisor, Manager)
router.post(
  "/",
  authorize("supervisor", "manager"),
  [
    body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
    body("type").optional().isIn(["individual", "company", "government", "non_profit"]).withMessage("Invalid type"),
    body("address.street").trim().isLength({ min: 5 }).withMessage("Street address is required"),
    body("address.city").trim().isLength({ min: 2 }).withMessage("City is required"),
    body("address.state").trim().isLength({ min: 2 }).withMessage("State is required"),
    body("contactInfo.primaryContact.email").optional().isEmail().withMessage("Please enter a valid email"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const customer = await Customer.create({
      ...req.body,
      createdBy: req.user.id,
    })

    await customer.populate("createdBy", "firstName lastName")

    res.status(201).json({
      message: "Customer created successfully",
      customer,
    })
  }),
)

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private (Supervisor, Manager)
router.put(
  "/:id",
  authorize("supervisor", "manager"),
  [
    param("id").isMongoId().withMessage("Invalid customer ID"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("contactInfo.primaryContact.email").optional().isEmail().withMessage("Please enter a valid email"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user.id,
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("projects", "name status")
      .populate("updatedBy", "firstName lastName")

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" })
    }

    res.json({
      message: "Customer updated successfully",
      customer,
    })
  }),
)

module.exports = router
