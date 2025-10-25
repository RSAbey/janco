const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    clockIn: {
      type: Date,
    },
    clockOut: {
      type: Date,
    },
    hoursWorked: {
      type: Number,
      default: 0,
      min: [0, "Hours worked cannot be negative"],
    },
    shiftType: {
      type: String,
      enum: ["day", "night", "full"],
      default: "day",
    },
    status: {
      type: String,
      enum: ["present", "absent", "half-day", "late"],
      default: "absent",
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
  }
);

// Index for better query performance
attendanceSchema.index({ labour: 1 });
attendanceSchema.index({ project: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ labour: 1, date: 1 }, { unique: true }); // Prevent duplicate entries

// Calculate hours worked before saving
attendanceSchema.pre("save", function (next) {
  if (this.clockIn && this.clockOut) {
    const hoursWorked = (this.clockOut - this.clockIn) / (1000 * 60 * 60);
    this.hoursWorked = parseFloat(hoursWorked.toFixed(2));
    
    // Determine shift type based on hours worked
    if (this.hoursWorked >= 8) {
      this.shiftType = "full";
      this.status = "present";
    } else if (this.hoursWorked >= 4) {
      this.status = this.shiftType === "night" ? "present" : "half-day";
    } else if (this.hoursWorked > 0) {
      this.status = "late";
    }
  }
  next();
});

module.exports = mongoose.model("Attendance", attendanceSchema);