const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, "Employer ID is required"],
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      enum: ["supervisor", "employee"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
    },
    salary: {
      type: Number,
      required: [true, "Salary amount is required"],
      min: 0
    },
    status: {
      type: String,
      required: [true, "Payment status is required"],
      enum: ["paid", "not"],
      default: "not"
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "cash", "check"],
      default: "bank_transfer",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Only create the index we need
salarySchema.index({ id: 1, month: 1, year: 1 }, { unique: true });
salarySchema.index({ month: 1, year: 1 });
salarySchema.index({ status: 1 });

module.exports = mongoose.model("Salary", salarySchema);