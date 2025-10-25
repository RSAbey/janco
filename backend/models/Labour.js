const mongoose = require("mongoose")

const labourSchema = new mongoose.Schema(
  {
    labourId: {
      type: String,
      //required: [true, "Labour ID is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    contact: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },
    skillLevel: {
      type: String,
      enum: ["Skilled", "Non"],
      default: "Non",
    },
    baseSalary: {
      type: Number,
      required: [true, "Base salary is required"],
      min: [0, "Salary cannot be negative"],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "terminated"],
      default: "active",
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
labourSchema.index({ labourId: 1 })
labourSchema.index({ project: 1 })
labourSchema.index({ skillLevel: 1 })
labourSchema.index({ status: 1 })

// Labour.js - Add this pre-save hook for _id
labourSchema.pre("save", function(next) {
    // Ensure _id is not manually set to prevent conflicts
    if (this.isNew && this._id) {
      console.warn("WARNING: _id is being manually set, removing to prevent conflicts");
      this._id = undefined; // Let MongoDB generate the _id
    }
    next();
  });
  
  // Keep your existing labourId generation hook
  labourSchema.pre("save", async function (next) {
    if (this.isNew && !this.labourId) {
      try {
        const lastLabour = await mongoose.model("Labour")
          .findOne()
          .sort({ labourId: -1 })
          .select('labourId');
        
        let nextNumber = 1;
        if (lastLabour && lastLabour.labourId) {
          const matches = lastLabour.labourId.match(/\d+$/);
          if (matches) {
            nextNumber = parseInt(matches[0]) + 1;
          }
        }
        
        this.labourId = `JHC/LAB/${String(nextNumber).padStart(4, "0")}`;
        console.log("Generated labourId:", this.labourId);
      } catch (error) {
        console.error("Error generating labourId:", error);
        this.labourId = `JHC/LAB/${Date.now()}`; // Fallback with timestamp
      }
    }
    next();
  });

module.exports = mongoose.model("Labour", labourSchema)