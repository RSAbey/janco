const mongoose = require("mongoose")

const materialSchema = new mongoose.Schema(
  {
    material: {
      type: String,
      required: [true, "Material is required"],
      enum: ["Cement", "Sand", "Concrete Stones", "Concrete Wire"],
    },
    supplier: {
      type: String,
      required: [true, "Supplier is required"],
      enum: ["Sandaruwan Hardware & Suppliers", "Mckinney", "Ronald Richard"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    amountType: {
      type: String,
      required: [true, "Amount type is required"],
      enum: ["Packs", "Cubes", "Pieces"],
    },
    recDate: {
      type: Date,
      required: [true, "Received date is required"],
    },
    description: {
      type: String,
    },
    updatedOn: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

materialSchema.index({ material: 1, supplier: 1 })
materialSchema.index({ recDate: 1 })

module.exports = mongoose.model("Material", materialSchema)
