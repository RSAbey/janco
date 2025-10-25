const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Materials",
        "Labor",
        "Equipment",
        "Transportation",
        "Permits",
        "Utilities",
        "Subcontractor",
        "Client Payment",
        "Advance Payment",
        "Other",
      ],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer", "Check", "Credit Card", "Other"],
      default: "Cash",
    },
    paymentSlip: {
      url: {
        type: String,
        default: null,
      },
      publicId: {
        type: String,
        default: null,
      },
      originalName: {
        type: String,
        default: null,
      },
    },
    notes: {
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

// Index for efficient queries
transactionSchema.index({ projectId: 1, date: -1 })
transactionSchema.index({ projectId: 1, type: 1 })

module.exports = mongoose.model("Transaction", transactionSchema)
