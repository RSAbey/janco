const mongoose = require("mongoose")

const subcontractorSchema = new mongoose.Schema(
  {
    contractId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Subcontractor name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    nic: {
      type: String,
      required: [true, "NIC number is required"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    contractType: {
      type: String,
      enum: ["Electrical", "Plumbing", "Carpentry", "Masonry", "Painting", "Steelwork", "Roofing", "Landscaping"],
      required: [true, "Contract type is required"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    appointments: [
      {
        project: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
        },
        startDate: Date,
        endDate: Date,
        cost: Number,
        appointedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        appointedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Generate contract ID before saving
subcontractorSchema.pre("save", async function (next) {
  if (!this.contractId && this.isNew) {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substr(2, 4).toUpperCase()
    this.contractId = `SC-${timestamp}-${random}`
  }
  next()
})

module.exports = mongoose.model("Subcontractor", subcontractorSchema)
