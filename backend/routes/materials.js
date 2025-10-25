const express = require("express")
const { body, param, query } = require("express-validator")
const Material = require("../models/Material")
const asyncHandler = require("../utils/asyncHandler")
const { handleValidationErrors } = require("../middleware/validation")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Get all materials
// @route   GET /api/materials
// @access  Private
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const materials = await Material.find().populate("createdBy", "firstName lastName").sort({ recDate: -1 })

    res.json({ materials })
  }),
)

// @desc    Get material by ID
// @route   GET /api/materials/:id
// @access  Private
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid material ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const material = await Material.findById(req.params.id).populate("createdBy", "firstName lastName")

    if (!material) {
      return res.status(404).json({ message: "Material not found" })
    }

    res.json({ material })
  }),
)

// @desc    Create new material
// @route   POST /api/materials
// @access  Private
router.post(
  "/",
  [
    body("name").isIn(["Cement", "Sand", "Concrete Stones", "Concrete Wire"]).withMessage("Invalid material type"),
    body("supplier")
      .isIn(["Sandaruwan Hardware & Suppliers", "Mckinney", "Ronald Richard"])
      .withMessage("Invalid supplier"),
    body("quantity")
      .isNumeric()
      .withMessage("Amount must be a number")
      .isFloat({ min: 0 })
      .withMessage("Amount must be positive"),
    body("unit").isIn(["packs", "cubes", "pieces", "Packs", "Cubes", "Pieces"]).withMessage("Invalid amount type"),
    body("receivedDate").isISO8601().withMessage("Invalid received date"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const normalizeUnit = (unit) => {
      const unitMap = {
        packs: "Packs",
        cubes: "Cubes",
        pieces: "Pieces",
        Packs: "Packs",
        Cubes: "Cubes",
        Pieces: "Pieces",
      }
      return unitMap[unit] || unit
    }

    const materialData = {
      material: req.body.name,
      supplier: req.body.supplier,
      amount: req.body.quantity,
      amountType: normalizeUnit(req.body.unit),
      recDate: req.body.receivedDate,
      description: req.body.description,
      createdBy: req.user.id,
    }

    const material = await Material.create(materialData)

    await material.populate("createdBy", "firstName lastName")

    res.status(201).json({
      message: "Material added successfully",
      material,
    })
  }),
)

// @desc    Update material
// @route   PUT /api/materials/:id
// @access  Private
router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid material ID"),
    body("name")
      .optional()
      .isIn(["Cement", "Sand", "Concrete Stones", "Concrete Wire"])
      .withMessage("Invalid material type"),
    body("supplier")
      .optional()
      .isIn(["Sandaruwan Hardware & Suppliers", "Mckinney", "Ronald Richard"])
      .withMessage("Invalid supplier"),
    body("quantity")
      .optional()
      .isNumeric()
      .withMessage("Amount must be a number")
      .isFloat({ min: 0 })
      .withMessage("Amount must be positive"),
    body("unit")
      .optional()
      .isIn(["packs", "cubes", "pieces", "Packs", "Cubes", "Pieces"])
      .withMessage("Invalid amount type"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const normalizeUnit = (unit) => {
      const unitMap = {
        packs: "Packs",
        cubes: "Cubes",
        pieces: "Pieces",
        Packs: "Packs",
        Cubes: "Cubes",
        Pieces: "Pieces",
      }
      return unitMap[unit] || unit
    }

    const materialData = {
      material: req.body.name,
      supplier: req.body.supplier,
      amount: req.body.quantity,
      amountType: req.body.unit ? normalizeUnit(req.body.unit) : undefined,
      recDate: req.body.receivedDate,
      description: req.body.description,
      updatedOn: new Date(),
    }

    const material = await Material.findByIdAndUpdate(req.params.id, materialData, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "firstName lastName")

    if (!material) {
      return res.status(404).json({ message: "Material not found" })
    }

    res.json({
      message: "Material updated successfully",
      material,
    })
  }),
)

// @desc    Delete material
// @route   DELETE /api/materials/:id
// @access  Private
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid material ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const material = await Material.findByIdAndDelete(req.params.id)

    if (!material) {
      return res.status(404).json({ message: "Material not found" })
    }

    res.json({ message: "Material deleted successfully" })
  }),
)

module.exports = router
