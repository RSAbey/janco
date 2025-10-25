const mongoose = require("mongoose")

const paymentScheduleSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },
    workSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkSchedule",
      required: [true, "Work schedule reference is required"],
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
    paymentAmount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Payment amount cannot be negative"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "overdue", "cancelled"],
      default: "pending",
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    order: {
      type: Number,
      default: 0,
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
paymentScheduleSchema.index({ project: 1 })
paymentScheduleSchema.index({ workSchedule: 1 })
paymentScheduleSchema.index({ dueDate: 1 })
paymentScheduleSchema.index({ paymentStatus: 1 })

module.exports = mongoose.model("PaymentSchedule", paymentScheduleSchema)
