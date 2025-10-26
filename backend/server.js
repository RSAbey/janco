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
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// CORS configuration
app.use(cors({
  origin: [
    'https://janco-frontend.vercel.app', // Your frontend URL
    'http://localhost:3000' // For local development
  ],
  credentials: true
}));

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
app.use("/api/attendance", require("./routes/attendance"))
app.use("/api/salary", require("./routes/salary"))
app.use("/api/projects", require("./routes/projects"))
app.use("/api/tasks", require("./routes/tasks"))
app.use("/api/expenses", require("./routes/expenses"))
app.use("/api/materials", require("./routes/materials"))
app.use("/api/suppliers", require("./routes/suppliers"))
app.use("/api/purchase-orders", require("./routes/purchase-orders"))
app.use("/api/customers", require("./routes/customers"))
app.use("/api/finance", require("./routes/finance"))
app.use("/api/dashboard", require("./routes/dashboard"))
app.use("/api/subcontractors", require("./routes/subcontractors")) // Added subcontractor routes for registration and appointment functionality

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

// Dynamic CORS allowlist that supports production, localhost and Vercel preview domains
const allowedOrigins = [
  process.env.FRONTEND_URL,                 // recommended production value (set in Vercel)
  'http://localhost:3000'                   // local dev
].filter(Boolean)

app.use(cors({
  origin: function(origin, callback) {
    // Allow non-browser requests like curl, server-to-server (no Origin)
    if (!origin) return callback(null, true)

    // Allow exact matches in allowlist
    if (allowedOrigins.includes(origin)) return callback(null, true)

    // Allow Vercel preview and vercel.app subdomains
    // e.g. https://janco-frontend-grf6tgjw2-xesachis-projects.vercel.app
    if (/\.vercel\.app$/.test(origin)) return callback(null, true)

    // Otherwise block
    return callback(new Error('CORS policy: This origin is not allowed: ' + origin), false)
  },
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept','Origin']
}))

// Explicitly handle preflight for all routes
app.options('*', cors())

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app