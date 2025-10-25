const mongoose = require("mongoose")

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Site name is required"],
      trim: true,
      maxlength: [100, "Site name cannot exceed 100 characters"],
    },
    supervisor: {
      type: String,
      required: [true, "Supervisor is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 day"],
    },
    estimatedCost: {
      type: Number,
      required: [true, "Estimated cost is required"],
      min: [0, "Estimated cost cannot be negative"],
    },
    documentFileNo: {
      type: String,
      required: [true, "Document file number is required"],
      trim: true,
    },
    projectId: {
      type: String,
      unique: true,
      sparse: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },
    status: {
      type: String,
      enum: ["planning", "active", "on-hold", "completed", "cancelled"],
      default: "planning",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index for better query performance
projectSchema.index({ status: 1 })
projectSchema.index({ supervisor: 1 })
projectSchema.index({ location: 1 })
projectSchema.index({ customerId: 1 })

// FIXED: Generate project ID before saving
projectSchema.pre("save", async function (next) {
  if (!this.projectId && this.isNew) {
    try {
      // Find the highest projectId and increment it
      const lastProject = await mongoose.model("Project").findOne().sort({ projectId: -1 }).select("projectId").exec()

      let nextNumber = 1
      if (lastProject && lastProject.projectId) {
        // Extract the number from the last projectId (e.g., "PRJ0003" -> 3)
        const lastNumber = Number.parseInt(lastProject.projectId.replace("PRJ", ""), 10)
        nextNumber = lastNumber + 1
      }

      this.projectId = `PRJ${String(nextNumber).padStart(4, "0")}`
    } catch (error) {
      return next(error)
    }
  }
  next()
})
module.exports = mongoose.model("Project", projectSchema)
