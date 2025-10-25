const mongoose = require("mongoose")

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxlength: [100, "Customer name cannot exceed 100 characters"],
    },
    nic: {
      type: String,
      trim: true,
      maxlength: [12, "NIC cannot exceed 12 characters"],
    },
    phone: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    customerCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    type: {
      type: String,
      enum: ["individual", "company", "government", "non_profit"],
      default: "individual",
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
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    financialInfo: {
      creditLimit: {
        type: Number,
        default: 0,
      },
      currentBalance: {
        type: Number,
        default: 0,
      },
      totalPaid: {
        type: Number,
        default: 0,
      },
      totalOutstanding: {
        type: Number,
        default: 0,
      },
      paymentTerms: {
        type: String,
        enum: ["net_15", "net_30", "net_45", "net_60", "advance", "custom"],
        default: "net_30",
      },
      customPaymentTerms: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blacklisted"],
      default: "active",
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
customerSchema.index({ name: 1, type: 1 })
customerSchema.index({ customerCode: 1 })
customerSchema.index({ status: 1 })

// Generate customer code before saving
customerSchema.pre("save", async function (next) {
  if (!this.customerCode && this.isNew) {
    const count = await mongoose.model("Customer").countDocuments()
    this.customerCode = `CUS${String(count + 1).padStart(4, "0")}`
  }
  next()
})

module.exports = mongoose.model("Customer", customerSchema)
