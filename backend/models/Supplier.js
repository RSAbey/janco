const mongoose = require("mongoose")

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
      maxlength: [100, "Supplier name cannot exceed 100 characters"],
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    supplierCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    type: {
      type: String,
      enum: ["manufacturer", "distributor", "retailer", "contractor", "service_provider"],
      default: "distributor",
    },
    category: {
      type: String,
      enum: [
        "building_materials",
        "electrical_supplies",
        "plumbing_supplies",
        "tools_equipment",
        "safety_equipment",
        "paint_chemicals",
        "hardware",
        "services",
        "other",
      ],
      required: [true, "Category is required"],
    },
    contactInfo: {
      primaryContact: {
        name: String,
        title: String,
        email: {
          type: String,
          match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
        },
        phone: String,
        mobile: String,
      },
      secondaryContact: {
        name: String,
        title: String,
        email: String,
        phone: String,
      },
      website: String,
    },
    address: {
      street: {
        type: String,
        required: [true, "Street address is required"],
      },
      city: {
        type: String,
        required: [true, "City is required"],
      },
      state: {
        type: String,
        required: [true, "State is required"],
      },
      zipCode: String,
      country: {
        type: String,
        default: "USA",
      },
    },
    businessInfo: {
      taxId: String,
      licenseNumber: String,
      registrationNumber: String,
      businessType: {
        type: String,
        enum: ["sole_proprietorship", "partnership", "corporation", "llc", "other"],
      },
      yearsInBusiness: Number,
      employeeCount: Number,
    },
    financialInfo: {
      creditLimit: {
        type: Number,
        default: 0,
      },
      currentBalance: {
        type: Number,
        default: 0,
      },
      paymentTerms: {
        type: String,
        enum: ["net_15", "net_30", "net_45", "net_60", "cod", "advance", "custom"],
        default: "net_30",
      },
      customPaymentTerms: String,
      creditRating: {
        type: String,
        enum: ["excellent", "good", "fair", "poor", "not_rated"],
        default: "not_rated",
      },
    },
    performance: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 3,
      },
      totalOrders: {
        type: Number,
        default: 0,
      },
      completedOrders: {
        type: Number,
        default: 0,
      },
      onTimeDeliveries: {
        type: Number,
        default: 0,
      },
      qualityScore: {
        type: Number,
        min: 1,
        max: 5,
        default: 3,
      },
      lastOrderDate: Date,
      averageDeliveryTime: Number, // in days
    },
    certifications: [
      {
        name: String,
        issuedBy: String,
        issuedDate: Date,
        expiryDate: Date,
        certificateNumber: String,
      },
    ],
    materials: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Material",
        },
        unitPrice: Number,
        minimumOrderQuantity: Number,
        leadTime: Number,
        isPreferred: {
          type: Boolean,
          default: false,
        },
      },
    ],
    bankDetails: {
      bankName: String,
      accountNumber: String,
      routingNumber: String,
      accountType: {
        type: String,
        enum: ["checking", "savings", "business"],
      },
    },
    documents: [
      {
        name: String,
        type: {
          type: String,
          enum: ["contract", "license", "certificate", "tax_document", "insurance", "other"],
        },
        url: String,
        expiryDate: Date,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "blacklisted", "pending_approval"],
      default: "active",
    },
    isPreferred: {
      type: Boolean,
      default: false,
    },
    notes: String,
    tags: [String],
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
supplierSchema.index({ name: 1, category: 1 })
supplierSchema.index({ supplierCode: 1 })
supplierSchema.index({ status: 1 })
supplierSchema.index({ "contactInfo.primaryContact.email": 1 })

// Generate supplier code before saving
supplierSchema.pre("save", async function (next) {
  if (!this.supplierCode && this.isNew) {
    const count = await mongoose.model("Supplier").countDocuments()
    this.supplierCode = `SUP${String(count + 1).padStart(4, "0")}`
  }
  next()
})

// Virtual for completion rate
supplierSchema.virtual("completionRate").get(function () {
  if (this.performance.totalOrders === 0) return 0
  return (this.performance.completedOrders / this.performance.totalOrders) * 100
})

// Virtual for on-time delivery rate
supplierSchema.virtual("onTimeDeliveryRate").get(function () {
  if (this.performance.completedOrders === 0) return 0
  return (this.performance.onTimeDeliveries / this.performance.completedOrders) * 100
})

module.exports = mongoose.model("Supplier", supplierSchema)
