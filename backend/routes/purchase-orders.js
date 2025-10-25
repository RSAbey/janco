const express = require("express")
const { body, param, query } = require("express-validator")
const PurchaseOrder = require("../models/PurchaseOrder")
const Material = require("../models/Material")
const Supplier = require("../models/Supplier")
const asyncHandler = require("../utils/asyncHandler")
const { handleValidationErrors } = require("../middleware/validation")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Get purchase orders
// @route   GET /api/purchase-orders
// @access  Private
router.get(
  "/",
  [
    query("supplier").optional().isMongoId().withMessage("Invalid supplier ID"),
    query("project").optional().isMongoId().withMessage("Invalid project ID"),
    query("status")
      .optional()
      .isIn(["draft", "pending_approval", "approved", "ordered", "partially_delivered", "delivered", "cancelled"])
      .withMessage("Invalid status"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { supplier, project, status } = req.query

    // Build filter
    const filter = {}
    if (supplier) filter.supplier = supplier
    if (project) filter.project = project
    if (status) filter.status = status

    // Role-based filtering
    if (req.user.role === "employee") {
      filter.requestedBy = req.user.id
    }

    const orders = await PurchaseOrder.find(filter)
      .populate("supplier", "name companyName")
      .populate("project", "name projectId")
      .populate("requestedBy", "firstName lastName")
      .populate("approvedBy", "firstName lastName")
      .populate("items.material", "name unit")
      .sort({ orderDate: -1 })

    res.json({ orders })
  }),
)

// @desc    Create purchase order
// @route   POST /api/purchase-orders
// @access  Private
router.post(
  "/",
  [
    body("supplier").isMongoId().withMessage("Valid supplier ID is required"),
    body("expectedDeliveryDate").isISO8601().withMessage("Valid expected delivery date is required"),
    body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
    body("items.*.material").isMongoId().withMessage("Valid material ID is required"),
    body("items.*.quantity").isNumeric().withMessage("Quantity must be a number"),
    body("items.*.unitPrice").isNumeric().withMessage("Unit price must be a number"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const order = await PurchaseOrder.create({
      ...req.body,
      requestedBy: req.user.id,
    })

    await order.populate("supplier", "name companyName")
    await order.populate("requestedBy", "firstName lastName")
    await order.populate("items.material", "name unit")

    res.status(201).json({
      message: "Purchase order created successfully",
      order,
    })
  }),
)

// @desc    Approve purchase order
// @route   PUT /api/purchase-orders/:id/approve
// @access  Private (Supervisor, Manager)
router.put(
  "/:id/approve",
  authorize("supervisor", "manager"),
  [param("id").isMongoId().withMessage("Invalid purchase order ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const order = await PurchaseOrder.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: "Purchase order not found" })
    }

    if (order.status !== "pending_approval") {
      return res.status(400).json({ message: "Order is not pending approval" })
    }

    order.status = "approved"
    order.approvedBy = req.user.id
    await order.save()

    await order.populate("approvedBy", "firstName lastName")

    res.json({
      message: "Purchase order approved successfully",
      order,
    })
  }),
)

module.exports = router
