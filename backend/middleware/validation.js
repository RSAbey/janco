const { validationResult } = require("express-validator")

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    console.log("[v0] Validation failed:")
    console.log("[v0] Request body:", JSON.stringify(req.body, null, 2))
    console.log("[v0] User role:", req.user?.role)
    console.log("[v0] Validation errors:", errors.array())

    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    })
  }

  next()
}

module.exports = { handleValidationErrors }
