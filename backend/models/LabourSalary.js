const mongoose = require("mongoose")

const labourSalarySchema = new mongoose.Schema(
  {
    labour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Labour",
      required: [true, "Labour reference is required"],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },
    amount: {
      type: Number,
      required: [true, "Salary amount is required"],
      min: [0, "Salary amount cannot be negative"],
    },
    payPeriod: {
      type: String,
      enum: ["daily", "weekly", "monthly", "project"],
      default: "monthly",
    },
    paymentDate: {
      type: Date,
      required: [true, "Payment date is required"],
    },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    description: {
      type: String,
      trim: true,
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
labourSalarySchema.index({ labour: 1 })
labourSalarySchema.index({ project: 1 })
labourSalarySchema.index({ paymentDate: 1 })
labourSalarySchema.index({ status: 1 })

module.exports = mongoose.model("LabourSalary", labourSalarySchema)