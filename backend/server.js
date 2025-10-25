const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

const app = express()

// Security middleware
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit
})
app.use(limiter)

// Enhanced CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Origin"
    ],
    optionsSuccessStatus: 200
  })
)

// Handle preflight requests
app.options("*", cors())

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/janco_construction", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/users", require("./routes/users"))
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/salary", require("./routes/salary"))
app.use("/api/projects", require("./routes/projects"))
app.use("/api/tasks", require("./routes/tasks"))
app.use("/api/expenses", require("./routes/expenses"))
app.use("/api/transactions", require("./routes/transactions"))
app.use("/api/materials", require("./routes/materials"))
app.use("/api/suppliers", require("./routes/suppliers"))
app.use("/api/purchase-orders", require("./routes/purchase-orders"))
app.use("/api/customers", require("./routes/customers"))
app.use("/api/finance", require("./routes/finance"))
app.use("/api/labour", require("./routes/labour"))
app.use("/api/dashboard", require("./routes/dashboard"))
app.use("/api/subcontractors", require("./routes/subcontractors"))
app.use("/api/work-schedule", require("./routes/workSchedule"))
app.use("/api/payment-schedule", require("./routes/paymentSchedule"))
app.use("/api/site-materials", require("./routes/siteMaterials"))
app.use("/api/reports", require("./routes/reports"))

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app