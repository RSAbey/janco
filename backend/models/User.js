const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ["employee", "supervisor", "manager"],
      default: "employee",
      required: true,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true, // Allow null values but ensure uniqueness when present
    },
    department: {
      type: String,
      enum: ["construction", "finance", "administration", "procurement"],
      default: "construction",
    },
    phoneNumber: {
      type: String,
      match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: "USA" },
    },
    dateOfBirth: Date,
    hireDate: {
      type: Date,
      default: Date.now,
    },
    salary: {
      type: Number,
      min: [0, "Salary cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    profileImage: String,
    emergencyContact: {
      name: String,
      relationship: String,
      phoneNumber: String,
    },
    skills: [String],
    certifications: [
      {
        name: String,
        issuedBy: String,
        issuedDate: Date,
        expiryDate: Date,
      },
    ],
    assignedProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Index for better query performance
userSchema.index({ email: 1 })
userSchema.index({ employeeId: 1 })
userSchema.index({ role: 1 })

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Generate employee ID before saving
userSchema.pre("save", async function (next) {
  if (!this.employeeId && this.isNew) {
    const count = await mongoose.model("User").countDocuments()
    this.employeeId = `EMP${String(count + 1).padStart(4, "0")}`
  }
  next()
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Get full name virtual
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`
})

// Transform JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject()
  delete user.password
  return user
}

module.exports = mongoose.model("User", userSchema)
