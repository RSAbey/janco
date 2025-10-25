const mongoose = require("mongoose")

const workScheduleSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },
    section: {
      type: String,
      enum: ["Pre-Project Process", "Project Process", "Project Handover Process"],
      required: [true, "Section is required"],
    },
    step: {
      type: String,
      required: [true, "Step identifier is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    timeFrame: {
      type: String,
      required: [true, "Time frame is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    workDescription: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
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

// Index for better query performance
workScheduleSchema.index({ project: 1 })
workScheduleSchema.index({ section: 1 })
workScheduleSchema.index({ startDate: 1 })
workScheduleSchema.index({ status: 1 })

module.exports = mongoose.model("WorkSchedule", workScheduleSchema)
