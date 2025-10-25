const express = require("express")
const { body, param, query } = require("express-validator")
const Supplier = require("../models/Supplier")
const PurchaseOrder = require("../models/PurchaseOrder")
const asyncHandler = require("../utils/asyncHandler")
const { handleValidationErrors } = require("../middleware/validation")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
router.get(
  "/",
  [
    query("category")
      .optional()
      .isIn([
        "building_materials",
        "electrical_supplies",
        "plumbing_supplies",
        "tools_equipment",
        "safety_equipment",
        "paint_chemicals",
        "hardware",
        "services",
        "other",
      ])
      .withMessage("Invalid category"),
    query("status")
      .optional()
      .isIn(["active", "inactive", "blacklisted", "pending_approval"])
      .withMessage("Invalid status"),
    query("search").optional().isLength({ min: 1 }).withMessage("Search term cannot be empty"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { category, status, search } = req.query

    // Build filter object
    const filter = {}
    if (category) filter.category = category
    if (status) filter.status = status

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { supplierCode: { $regex: search, $options: "i" } },
        { "contactInfo.primaryContact.email": { $regex: search, $options: "i" } },
      ]
    }

    const suppliers = await Supplier.find(filter).populate("createdBy", "firstName lastName").sort({ name: 1 })

    res.json({ suppliers })
  }),
)

// @desc    Get supplier by ID
// @route   GET /api/suppliers/:id
// @access  Private
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid supplier ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.findById(req.params.id)
      .populate("materials.material", "name category unit")
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName")

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" })
    }

    res.json({ supplier })
  }),
)

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private (Supervisor, Manager)
router.post(
  "/",
  authorize("supervisor", "manager"),
  [
    body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
    body("category")
      .isIn([
        "building_materials",
        "electrical_supplies",
        "plumbing_supplies",
        "tools_equipment",
        "safety_equipment",
        "paint_chemicals",
        "hardware",
        "services",
        "other",
      ])
      .withMessage("Invalid category"),
    body("address.street").trim().isLength({ min: 5 }).withMessage("Street address is required"),
    body("address.city").trim().isLength({ min: 2 }).withMessage("City is required"),
    body("address.state").trim().isLength({ min: 2 }).withMessage("State is required"),
    body("contactInfo.primaryContact.email").optional().isEmail().withMessage("Please enter a valid email"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.create({
      ...req.body,
      createdBy: req.user.id,
    })

    await supplier.populate("createdBy", "firstName lastName")

    res.status(201).json({
      message: "Supplier created successfully",
      supplier,
    })
  }),
)

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Supervisor, Manager)
router.put(
  "/:id",
  authorize("supervisor", "manager"),
  [
    param("id").isMongoId().withMessage("Invalid supplier ID"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("performance.rating").optional().isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("contactInfo.primaryContact.email").optional().isEmail().withMessage("Please enter a valid email"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.findByIdAndUpdate(
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
      .populate("materials.material", "name category")
      .populate("updatedBy", "firstName lastName")

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" })
    }

    res.json({
      message: "Supplier updated successfully",
      supplier,
    })
  }),
)

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Supervisor, Manager)
router.delete(
  "/:id",
  authorize("supervisor", "manager"),
  [param("id").isMongoId().withMessage("Invalid supplier ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.findById(req.params.id)
    
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" })
    }

    // Check if supplier has associated purchase orders
    const hasOrders = await PurchaseOrder.exists({ supplier: req.params.id })
    
    if (hasOrders) {
      return res.status(400).json({ 
        message: "Cannot delete supplier with associated purchase orders. Please deactivate instead." 
      })
    }

    await Supplier.findByIdAndDelete(req.params.id)

    res.json({
      message: "Supplier deleted successfully",
    })
  })
)

// @desc    Get supplier purchase orders
// @route   GET /api/suppliers/:id/orders
// @access  Private
router.get(
  "/:id/orders",
  [param("id").isMongoId().withMessage("Invalid supplier ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const orders = await PurchaseOrder.find({ supplier: req.params.id })
      .populate("project", "name projectId")
      .populate("requestedBy", "firstName lastName")
      .populate("items.material", "name unit")
      .sort({ orderDate: -1 })

    res.json({ orders })
  }),
)

// @desc    Get supplier performance metrics
// @route   GET /api/suppliers/:id/performance
// @access  Private (Supervisor, Manager)
router.get(
  "/:id/performance",
  authorize("supervisor", "manager"),
  [param("id").isMongoId().withMessage("Invalid supplier ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.findById(req.params.id)
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" })
    }

    // Get recent orders for performance calculation
    const recentOrders = await PurchaseOrder.find({
      supplier: req.params.id,
      status: { $in: ["delivered", "partially_delivered"] },
    })
      .sort({ orderDate: -1 })
      .limit(10)

    const performance = {
      totalOrders: supplier.performance.totalOrders,
      completedOrders: supplier.performance.completedOrders,
      completionRate: supplier.completionRate,
      onTimeDeliveryRate: supplier.onTimeDeliveryRate,
      averageDeliveryTime: supplier.performance.averageDeliveryTime,
      qualityScore: supplier.performance.qualityScore,
      rating: supplier.performance.rating,
      recentOrders: recentOrders.map((order) => ({
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        expectedDeliveryDate: order.expectedDeliveryDate,
        actualDeliveryDate: order.actualDeliveryDate,
        totalAmount: order.pricing.totalAmount,
        status: order.status,
      })),
    }

    res.json({ performance })
  }),
)

// @desc    Get supplier statistics
// @route   GET /api/suppliers/stats
// @access  Private (Supervisor, Manager)
router.get(
  "/stats",
  authorize("supervisor", "manager"),
  asyncHandler(async (req, res) => {
    const stats = await Supplier.aggregate([
      {
        $group: {
          _id: null,
          totalSuppliers: { $sum: 1 },
          activeSuppliers: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          preferredSuppliers: { $sum: { $cond: ["$isPreferred", 1, 0] } },
          averageRating: { $avg: "$performance.rating" },
          totalOrders: { $sum: "$performance.totalOrders" },
        },
      },
    ])

    const categoryStats = await Supplier.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          averageRating: { $avg: "$performance.rating" },
        },
      },
    ])

    res.json({
      overview: stats[0] || {
        totalSuppliers: 0,
        activeSuppliers: 0,
        preferredSuppliers: 0,
        averageRating: 0,
        totalOrders: 0,
      },
      categoryBreakdown: categoryStats,
    })
  }),
)

module.exports = router
