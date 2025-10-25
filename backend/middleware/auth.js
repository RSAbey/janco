const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" })
    }

    console.log("[v0] Token received:", token.substring(0, 20) + "...")
    console.log("[v0] JWT_SECRET exists:", !!process.env.JWT_SECRET)

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log("[v0] Token decoded successfully:", decoded.id)

    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      console.log("[v0] User not found for token:", decoded.id)
      return res.status(401).json({ message: "Token is not valid" })
    }

    console.log("[v0] User authenticated:", user.email, user.role)
    req.user = user
    next()
  } catch (error) {
    console.log("[v0] Token validation error:", error.message)
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" })
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token format" })
    }
    res.status(401).json({ message: "Token is not valid" })
  }
}

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Access denied" })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      })
    }

    next()
  }
}

module.exports = { auth, authorize, protect: auth }
