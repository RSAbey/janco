const express = require("express")
const router = express.Router()
const SiteMaterial = require("../models/SiteMaterial")
const mongoose = require("mongoose")
const { protect } = require("../middleware/auth")
const { body, validationResult, param } = require("express-validator")

// Get all materials for a specific project
router.get(
  "/project/:projectId",
  protect,
  [param("projectId").isMongoId().withMessage("Invalid project ID")],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { projectId } = req.params
      const { page = 1, limit = 10, material, status, startDate, endDate } = req.query

      // Build filter object
      const filter = { projectId }

      if (material) filter.material = material
      if (status) filter.status = status
      if (startDate || endDate) {
        filter.receivedDate = {}
        if (startDate) filter.receivedDate.$gte = new Date(startDate)
        if (endDate) filter.receivedDate.$lte = new Date(endDate)
      }

      const materials = await SiteMaterial.find(filter)
        .populate("createdBy", "name email")
        .sort({ receivedDate: -1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)

      const total = await SiteMaterial.countDocuments(filter)

      // Calculate totals and summaries
      const summary = await SiteMaterial.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalMaterials: { $sum: 1 },
            totalCost: { $sum: "$totalCost" },
            totalQuantity: { $sum: "$amount" },
          },
        },
      ])

      const materialBreakdown = await SiteMaterial.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$material",
            totalCost: { $sum: "$totalCost" },
            totalQuantity: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ])

      const statusBreakdown = await SiteMaterial.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalCost: { $sum: "$totalCost" },
          },
        },
      ])

      res.status(200).json({
        success: true,
        data: {
          materials,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total,
          },
          summary: {
            totalMaterials: summary[0]?.totalMaterials || 0,
            totalCost: summary[0]?.totalCost || 0,
            totalQuantity: summary[0]?.totalQuantity || 0,
          },
          breakdown: {
            byMaterial: materialBreakdown,
            byStatus: statusBreakdown,
          },
        },
      })
    } catch (error) {
      console.error("Error fetching site materials:", error)
      res.status(500).json({
        success: false,
        message: "Server error while fetching materials",
      })
    }
  },
)

// Create a new site material
router.post(
  "/",
  protect,
  [
    body("projectId").isMongoId().withMessage("Invalid project ID"),
    body("material").isIn(["Cement", "Sand", "Concrete Stones", "Concrete Wire", "Other"]).withMessage("Invalid material type"),
    body("supplier").trim().isLength({ min: 1 }).withMessage("Supplier is required"),
    body("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
    body("amountType").isIn(["Packs", "Cubes", "Pieces", "Kg", "Tons", "Other"]).withMessage("Invalid amount type"),
    body("unitCost").optional().isFloat({ min: 0 }),
    body("receivedDate").isISO8601().withMessage("Invalid date format"),
    body("status").optional().isIn(["ordered", "received", "in-transit", "cancelled"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const materialData = {
        ...req.body,
        createdBy: req.user.id,
      }

      // Calculate total cost if unitCost is provided
      if (materialData.amount && materialData.unitCost) {
        materialData.totalCost = materialData.amount * materialData.unitCost
      }

      const material = await SiteMaterial.create(materialData)
      await material.populate("createdBy", "name email")

      res.status(201).json({
        success: true,
        data: material,
        message: "Material added successfully",
      })
    } catch (error) {
      console.error("Error creating material:", error)
      res.status(500).json({
        success: false,
        message: "Server error while creating material",
      })
    }
  },
)

// Update a site material
router.put(
  "/:id",
  protect,
  [
    param("id").isMongoId().withMessage("Invalid material ID"),
    body("material").optional().isIn(["Cement", "Sand", "Concrete Stones", "Concrete Wire", "Other"]),
    body("supplier").optional().trim().isLength({ min: 1 }),
    body("amount").optional().isFloat({ min: 0 }),
    body("amountType").optional().isIn(["Packs", "Cubes", "Pieces", "Kg", "Tons", "Other"]),
    body("unitCost").optional().isFloat({ min: 0 }),
    body("receivedDate").optional().isISO8601(),
    body("status").optional().isIn(["ordered", "received", "in-transit", "cancelled"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const updateData = { ...req.body }

      // Recalculate total cost if amount or unitCost is updated
      if (updateData.amount !== undefined || updateData.unitCost !== undefined) {
        const existingMaterial = await SiteMaterial.findById(req.params.id)
        const amount = updateData.amount !== undefined ? updateData.amount : existingMaterial.amount
        const unitCost = updateData.unitCost !== undefined ? updateData.unitCost : existingMaterial.unitCost
        updateData.totalCost = amount * unitCost
      }

      const material = await SiteMaterial.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      }).populate("createdBy", "name email")

      if (!material) {
        return res.status(404).json({
          success: false,
          message: "Material not found",
        })
      }

      res.status(200).json({
        success: true,
        data: material,
        message: "Material updated successfully",
      })
    } catch (error) {
      console.error("Error updating material:", error)
      res.status(500).json({
        success: false,
        message: "Server error while updating material",
      })
    }
  },
)

// Delete a site material
router.delete("/:id", protect, [param("id").isMongoId().withMessage("Invalid material ID")], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const material = await SiteMaterial.findByIdAndDelete(req.params.id)

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "Material deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting material:", error)
    res.status(500).json({
      success: false,
      message: "Server error while deleting material",
    })
  }
})

// Get material summary for a project
router.get(
  "/project/:projectId/summary",
  protect,
  [param("projectId").isMongoId().withMessage("Invalid project ID")],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { projectId } = req.params

      const summary = await SiteMaterial.aggregate([
        { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
        {
          $group: {
            _id: null,
            totalMaterials: { $sum: 1 },
            totalCost: { $sum: "$totalCost" },
            totalQuantity: { $sum: "$amount" },
            averageCost: { $avg: "$unitCost" },
          },
        },
      ])

      const materialSummary = await SiteMaterial.aggregate([
        { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
        {
          $group: {
            _id: "$material",
            totalCost: { $sum: "$totalCost" },
            totalQuantity: { $sum: "$amount" },
            averageUnitCost: { $avg: "$unitCost" },
            count: { $sum: 1 },
          },
        },
      ])

      const statusSummary = await SiteMaterial.aggregate([
        { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalCost: { $sum: "$totalCost" },
          },
        },
      ])

      res.status(200).json({
        success: true,
        data: {
          overview: summary[0] || {
            totalMaterials: 0,
            totalCost: 0,
            totalQuantity: 0,
            averageCost: 0,
          },
          byMaterial: materialSummary,
          byStatus: statusSummary,
        },
      })
    } catch (error) {
      console.error("Error fetching material summary:", error)
      res.status(500).json({
        success: false,
        message: "Server error while fetching material summary",
      })
    }
  },
)

module.exports = router