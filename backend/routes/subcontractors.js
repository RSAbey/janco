const express = require("express")
const { body, param } = require("express-validator")
const Subcontractor = require("../models/Subcontractor")
const asyncHandler = require("../utils/asyncHandler")
const { handleValidationErrors } = require("../middleware/validation")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Get all subcontractors
// @route   GET /api/subcontractors
// @access  Private
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const subcontractors = await Subcontractor.find().populate("createdBy", "firstName lastName").sort({ name: 1 })

    res.json({ subcontractors })
  }),
)

// @desc    Create new subcontractor
// @route   POST /api/subcontractors
// @access  Private (Supervisor, Manager)
router.post(
  "/",
  authorize("supervisor", "manager"),
  [
    body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
    body("nic").trim().isLength({ min: 10, max: 12 }).withMessage("NIC must be between 10 and 12 characters"),
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("phone").trim().isLength({ min: 10 }).withMessage("Phone number is required"),
    body("contractType")
      .isIn(["Electrical", "Plumbing", "Carpentry", "Masonry", "Painting", "Steelwork", "Roofing", "Landscaping"])
      .withMessage("Invalid contract type"),
    body("address").trim().isLength({ min: 10 }).withMessage("Address must be at least 10 characters long"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const subcontractor = await Subcontractor.create({
      ...req.body,
      createdBy: req.user.id,
    })

    await subcontractor.populate("createdBy", "firstName lastName")

    res.status(201).json({
      message: "Subcontractor registered successfully",
      subcontractor,
    })
  }),
)

// @desc    Appoint subcontractor to project
// @route   POST /api/subcontractors/:id/appoint
// @access  Private (Supervisor, Manager)
router.post(
  "/:id/appoint",
  authorize("supervisor", "manager"),
  [
    param("id").isMongoId().withMessage("Invalid subcontractor ID"),
    body("project").optional().isMongoId().withMessage("Invalid project ID"),
    body("startDate").isISO8601().withMessage("Valid start date is required"),
    body("endDate").isISO8601().withMessage("Valid end date is required"),
    body("cost").isNumeric().withMessage("Cost must be a number"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { startDate, endDate, cost, project } = req.body

    const subcontractor = await Subcontractor.findById(req.params.id)
    if (!subcontractor) {
      return res.status(404).json({ message: "Subcontractor not found" })
    }

    const appointment = {
      project,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      cost: Number.parseFloat(cost),
      appointedBy: req.user.id,
    }

    subcontractor.appointments.push(appointment)
    await subcontractor.save()

    await subcontractor.populate("appointments.appointedBy", "firstName lastName")

    res.status(201).json({
      message: "Subcontractor appointed successfully",
      appointment: subcontractor.appointments[subcontractor.appointments.length - 1],
    })
  }),
)

// @desc    Update subcontractor
// @route   PUT /api/subcontractors/:id
// @access  Private (Supervisor, Manager)
router.put(
  "/:id",
  authorize("supervisor", "manager"),
  [
    param("id").isMongoId().withMessage("Invalid subcontractor ID"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("nic")
      .optional()
      .trim()
      .isLength({ min: 10, max: 12 })
      .withMessage("NIC must be between 10 and 12 characters"),
    body("email").optional().isEmail().withMessage("Please enter a valid email"),
    body("phone").optional().trim().isLength({ min: 10 }).withMessage("Phone number is required"),
    body("contractType")
      .optional()
      .isIn(["Electrical", "Plumbing", "Carpentry", "Masonry", "Painting", "Steelwork", "Roofing", "Landscaping"])
      .withMessage("Invalid contract type"),
    body("address").optional().trim().isLength({ min: 10 }).withMessage("Address must be at least 10 characters long"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const subcontractor = await Subcontractor.findById(req.params.id)
    if (!subcontractor) {
      return res.status(404).json({ message: "Subcontractor not found" })
    }

    const updatedSubcontractor = await Subcontractor.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).populate("createdBy", "firstName lastName")

    res.json({
      message: "Subcontractor updated successfully",
      subcontractor: updatedSubcontractor,
    })
  }),
)

// @desc    Delete subcontractor
// @route   DELETE /api/subcontractors/:id
// @access  Private (Manager only)
router.delete(
  "/:id",
  authorize("manager"),
  [param("id").isMongoId().withMessage("Invalid subcontractor ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const subcontractor = await Subcontractor.findById(req.params.id)
    if (!subcontractor) {
      return res.status(404).json({ message: "Subcontractor not found" })
    }

    await Subcontractor.findByIdAndDelete(req.params.id)

    res.json({
      message: "Subcontractor deleted successfully",
    })
  }),
)

module.exports = router
