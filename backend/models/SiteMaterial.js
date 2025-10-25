const mongoose = require("mongoose")

const siteMaterialSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    material: {
      type: String,
      required: true,
      enum: ["Cement", "Sand", "Concrete Stones", "Concrete Wire", "Other"],
    },
    supplier: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountType: {
      type: String,
      required: true,
      enum: ["Packs", "Cubes", "Pieces", "Kg", "Tons", "Other"],
    },
    unitCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    receivedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expectedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["ordered", "received", "in-transit", "cancelled"],
      default: "received",
    },
    notes: {
      type: String,
      trim: true,
    },
    deliveryChallan: {
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

// Calculate total cost before saving
siteMaterialSchema.pre("save", function (next) {
  if (this.amount && this.unitCost) {
    this.totalCost = this.amount * this.unitCost
  }
  next()
})

// Index for efficient queries
siteMaterialSchema.index({ projectId: 1, receivedDate: -1 })
siteMaterialSchema.index({ projectId: 1, material: 1 })
siteMaterialSchema.index({ projectId: 1, status: 1 })

// Virtual for formatted received date
siteMaterialSchema.virtual("formattedReceivedDate").get(function () {
  return this.receivedDate.toISOString().split("T")[0]
})

// Instance method to get material summary
siteMaterialSchema.methods.getSummary = function () {
  return {
    material: this.material,
    quantity: `${this.amount} ${this.amountType}`,
    cost: this.totalCost,
    status: this.status,
  }
}

module.exports = mongoose.model("SiteMaterial", siteMaterialSchema)