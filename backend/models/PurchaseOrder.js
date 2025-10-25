const mongoose = require("mongoose")

const purchaseOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier is required"],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    expectedDeliveryDate: {
      type: Date,
      required: [true, "Expected delivery date is required"],
    },
    actualDeliveryDate: Date,
    status: {
      type: String,
      enum: ["draft", "pending_approval", "approved", "ordered", "partially_delivered", "delivered", "cancelled"],
      default: "draft",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    items: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Material",
          required: true,
        },
        description: String,
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
        deliveredQuantity: {
          type: Number,
          default: 0,
        },
        remainingQuantity: {
          type: Number,
          default: 0,
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
      shippingCost: {
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
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      contactPerson: String,
      contactPhone: String,
    },
    paymentTerms: {
      type: String,
      enum: ["net_15", "net_30", "net_45", "net_60", "cod", "advance"],
      default: "net_30",
    },
    specialInstructions: String,
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notes: String,
    isUrgent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Index for better query performance
purchaseOrderSchema.index({ supplier: 1, status: 1 })
purchaseOrderSchema.index({ orderNumber: 1 })
purchaseOrderSchema.index({ orderDate: 1 })
purchaseOrderSchema.index({ requestedBy: 1 })

// Generate order number before saving
purchaseOrderSchema.pre("save", async function (next) {
  if (!this.orderNumber && this.isNew) {
    const count = await mongoose.model("PurchaseOrder").countDocuments()
    this.orderNumber = `PO${String(count + 1).padStart(4, "0")}`
  }
  next()
})

// Calculate totals before saving
purchaseOrderSchema.pre("save", function (next) {
  // Calculate item totals
  this.items.forEach((item) => {
    item.totalPrice = item.quantity * item.unitPrice
    item.remainingQuantity = item.quantity - item.deliveredQuantity
  })

  // Calculate order totals
  this.pricing.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0)
  this.pricing.taxAmount = this.pricing.subtotal * (this.pricing.taxRate / 100)
  this.pricing.totalAmount =
    this.pricing.subtotal + this.pricing.taxAmount + this.pricing.shippingCost - this.pricing.discount

  next()
})

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema)
