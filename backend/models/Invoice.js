const mongoose = require("mongoose")

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "cancelled"],
      default: "draft",
    },
    items: [
      {
        description: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [0, "Quantity cannot be negative"],
        },
        unit: String,
        unitPrice: {
          type: Number,
          required: true,
          min: [0, "Unit price cannot be negative"],
        },
        totalPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    pricing: {
      subtotal: {
        type: Number,
        required: true,
        default: 0,
      },
      taxRate: {
        type: Number,
        default: 0,
      },
      taxAmount: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        required: true,
        default: 0,
      },
    },
    paymentInfo: {
      paidAmount: {
        type: Number,
        default: 0,
      },
      remainingAmount: {
        type: Number,
        default: 0,
      },
      paymentDate: Date,
      paymentMethod: {
        type: String,
        enum: ["cash", "check", "credit_card", "bank_transfer", "other"],
      },
      paymentReference: String,
    },
    notes: String,
    terms: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

// Index for better query performance
invoiceSchema.index({ customer: 1, status: 1 })
invoiceSchema.index({ invoiceNumber: 1 })
invoiceSchema.index({ dueDate: 1 })

// Generate invoice number before saving
invoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNumber && this.isNew) {
    const count = await mongoose.model("Invoice").countDocuments()
    this.invoiceNumber = `INV${String(count + 1).padStart(4, "0")}`
  }
  next()
})

// Calculate totals before saving
invoiceSchema.pre("save", function (next) {
  // Calculate item totals
  this.items.forEach((item) => {
    item.totalPrice = item.quantity * item.unitPrice
  })

  // Calculate invoice totals
  this.pricing.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0)
  this.pricing.taxAmount = this.pricing.subtotal * (this.pricing.taxRate / 100)
  this.pricing.totalAmount = this.pricing.subtotal + this.pricing.taxAmount - this.pricing.discount

  // Calculate remaining amount
  this.paymentInfo.remainingAmount = this.pricing.totalAmount - this.paymentInfo.paidAmount

  next()
})

module.exports = mongoose.model("Invoice", invoiceSchema)
