const mongoose = require("mongoose")

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
    },
    phase: {
      type: String,
      required: [true, "Phase is required"],
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "review", "completed", "cancelled"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    completedDate: Date,
    estimatedHours: {
      type: Number,
      min: 0,
    },
    actualHours: {
      type: Number,
      default: 0,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    materials: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Material",
        },
        quantity: Number,
        unit: String,
      },
    ],
    equipment: [
      {
        name: String,
        quantity: Number,
        duration: Number, // in hours
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        comment: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        name: String,
        url: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tags: [String],
  },
  {
    timestamps: true,
  },
)

// Index for better query performance
taskSchema.index({ project: 1, status: 1 })
taskSchema.index({ assignedTo: 1 })
taskSchema.index({ dueDate: 1 })
taskSchema.index({ priority: 1, status: 1 })

// Update completed date when status changes to completed
taskSchema.pre("save", function (next) {
  if (this.status === "completed" && !this.completedDate) {
    this.completedDate = new Date()
  }
  next()
})

module.exports = mongoose.model("Task", taskSchema)
