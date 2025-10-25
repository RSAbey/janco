const express = require("express")
const { body, param, query } = require("express-validator")
const Attendance = require("../models/Attendance")
const Labour = require("../models/Labour")
const asyncHandler = require("../utils/asyncHandler")
const { handleValidationErrors } = require("../middleware/validation")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
router.get(
  "/",
  [
    query("projectId").optional().isMongoId().withMessage("Invalid project ID"),
    query("labourId").optional().isMongoId().withMessage("Invalid labour ID"),
    query("startDate").optional().isISO8601().withMessage("Invalid start date"),
    query("endDate").optional().isISO8601().withMessage("Invalid end date"),
    query("status").optional().isIn(["present", "absent", "half-day", "late"]).withMessage("Invalid status"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { projectId, labourId, startDate, endDate, status } = req.query

    // Build filter object
    const filter = {}
    if (projectId) filter.project = projectId
    if (labourId) filter.labour = labourId
    if (status) filter.status = status

    // Date range filter
    if (startDate || endDate) {
      filter.date = {}
      if (startDate) filter.date.$gte = new Date(startDate)
      if (endDate) filter.date.$lte = new Date(endDate)
    }

    const attendance = await Attendance.find(filter)
      .populate("labour", "name labourId contact skillLevel")
      .populate("project", "name projectId")
      .populate("createdBy", "firstName lastName")
      .sort({ date: -1, labour: 1 })

    res.json({ attendance })
  }),
)

// @desc    Get attendance by ID
// @route   GET /api/attendance/:id
// @access  Private
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid attendance ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const attendance = await Attendance.findById(req.params.id)
      .populate("labour", "name labourId contact skillLevel")
      .populate("project", "name projectId")
      .populate("createdBy", "firstName lastName")

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" })
    }

    res.json({ attendance })
  }),
)

// @desc    Create attendance record
// @route   POST /api/attendance
// @access  Private (Supervisor, Manager)
router.post(
  "/",
  authorize("supervisor", "manager"),
  [
    body("labour").isMongoId().withMessage("Valid labour ID is required"),
    body("project").isMongoId().withMessage("Valid project ID is required"),
    body("date").isISO8601().withMessage("Valid date is required"),
    body("clockIn").optional().isISO8601().withMessage("Valid clock-in time is required"),
    body("clockOut").optional().isISO8601().withMessage("Valid clock-out time is required"),
    body("shiftType").optional().isIn(["day", "night", "full"]).withMessage("Invalid shift type"),
    body("status").optional().isIn(["present", "absent", "half-day", "late"]).withMessage("Invalid status"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { labour, project, date } = req.body

    // Check if attendance record already exists for this labour on this date
    const existingAttendance = await Attendance.findOne({
      labour,
      date: new Date(date),
    })

    if (existingAttendance) {
      return res.status(400).json({
        message: "Attendance record already exists for this labourer on this date",
      })
    }

    const attendance = await Attendance.create({
      ...req.body,
      createdBy: req.user.id,
    })

    await attendance.populate("labour", "name labourId contact skillLevel")
    await attendance.populate("project", "name projectId")
    await attendance.populate("createdBy", "firstName lastName")

    res.status(201).json({
      message: "Attendance record created successfully",
      attendance,
    })
  }),
)

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private (Supervisor, Manager)
router.put(
  "/:id",
  authorize("supervisor", "manager"),
  [
    param("id").isMongoId().withMessage("Invalid attendance ID"),
    body("clockIn").optional().isISO8601().withMessage("Valid clock-in time is required"),
    body("clockOut").optional().isISO8601().withMessage("Valid clock-out time is required"),
    body("shiftType").optional().isIn(["day", "night", "full"]).withMessage("Invalid shift type"),
    body("status").optional().isIn(["present", "absent", "half-day", "late"]).withMessage("Invalid status"),
    body("notes").optional().trim(),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("labour", "name labourId contact skillLevel")
      .populate("project", "name projectId")
      .populate("createdBy", "firstName lastName")

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" })
    }

    res.json({
      message: "Attendance record updated successfully",
      attendance,
    })
  }),
)

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private (Supervisor, Manager)
router.delete(
  "/:id",
  authorize("supervisor", "manager"),
  [param("id").isMongoId().withMessage("Invalid attendance ID")],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const attendance = await Attendance.findByIdAndDelete(req.params.id)

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" })
    }

    res.json({ message: "Attendance record deleted successfully" })
  }),
)

// @desc    Bulk create attendance records
// @route   POST /api/attendance/bulk
// @access  Private (Supervisor, Manager)
router.post(
  "/bulk",
  authorize("supervisor", "manager"),
  [
    body().isArray().withMessage("Request body must be an array"),
    body("*.labour").isMongoId().withMessage("Valid labour ID is required"),
    body("*.project").isMongoId().withMessage("Valid project ID is required"),
    body("*.date").isISO8601().withMessage("Valid date is required"),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      const attendanceRecords = req.body

      console.log("Bulk attendance creation request:", {
        count: attendanceRecords.length,
        sample: attendanceRecords[0],
      })

      const bulkOperations = attendanceRecords.map((record) => ({
        updateOne: {
          filter: {
            labour: record.labour,
            date: new Date(record.date),
          },
          update: {
            $set: {
              ...record,
              createdBy: req.user.id,
              date: new Date(record.date),
              clockIn: record.clockIn ? new Date(record.clockIn) : null,
              clockOut: record.clockOut ? new Date(record.clockOut) : null,
            },
          },
          upsert: true,
        },
      }))

      const result = await Attendance.bulkWrite(bulkOperations, { ordered: false })

      console.log("Bulk write result:", {
        inserted: result.insertedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
        errors: result.hasWriteErrors() ? result.getWriteErrors().length : 0,
      })

      if (result.hasWriteErrors()) {
        const errors = result.getWriteErrors()
        console.warn(
          "Some records had errors:",
          errors.map((e) => ({
            index: e.index,
            error: e.errmsg,
            code: e.code,
          })),
        )

        // Check if errors are due to old index issues
        const indexErrors = errors.filter((e) => e.code === 11000 && e.errmsg.includes("employee_1_date_1"))
        if (indexErrors.length > 0) {
          return res.status(500).json({
            message:
              "Database index conflict detected. Please run the database migration script to fix attendance indexes.",
            error:
              "Old 'employee' index conflicts with current 'labour' field. Run: node scripts/fix-attendance-index.js",
            details: indexErrors.map((e) => e.errmsg),
          })
        }
      }

      // Get the created/updated records to return
      const labourIds = attendanceRecords.map((r) => r.labour)
      const dates = [...new Set(attendanceRecords.map((r) => new Date(r.date)))]

      const createdRecords = await Attendance.find({
        labour: { $in: labourIds },
        date: { $in: dates },
      })
        .populate("labour", "name labourId contact skillLevel")
        .populate("project", "name projectId")
        .populate("createdBy", "firstName lastName")

      res.status(201).json({
        message: `Attendance records processed successfully. ${result.upsertedCount + result.modifiedCount} records saved.`,
        attendance: createdRecords,
        stats: {
          inserted: result.insertedCount,
          modified: result.modifiedCount,
          upserted: result.upsertedCount,
          errors: result.hasWriteErrors() ? result.getWriteErrors().length : 0,
        },
      })
    } catch (error) {
      console.error("Error in bulk attendance creation:", error)

      if (error.code === 11000 && error.message.includes("employee_1_date_1")) {
        return res.status(500).json({
          message: "Database index conflict detected. Please run the database migration script.",
          error:
            "Old 'employee' index conflicts with current 'labour' field. Run: node scripts/fix-attendance-index.js",
          details: error.message,
        })
      }

      res.status(500).json({
        message: "Failed to create attendance records",
        error: process.env.NODE_ENV === "development" ? error.message : {},
      })
    }
  }),
)

// Add to your attendance routes (attendances.js)
router.get(
  '/stats/site-percentages',
  auth,
  asyncHandler(async (req, res) => {
    try {
      const { month, year } = req.query;
      const targetDate = new Date(year || new Date().getFullYear(), month || new Date().getMonth(), 1);
      const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      
      const attendanceStats = await Attendance.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              project: '$project',
              status: '$status'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.project',
            total: { $sum: '$count' },
            present: {
              $sum: {
                $cond: [
                  { $in: ['$_id.status', ['present', 'half-day']] },
                  '$count',
                  0
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: '_id',
            foreignField: '_id',
            as: 'project'
          }
        },
        {
          $unwind: '$project'
        },
        {
          $project: {
            projectId: '$_id',
            projectName: '$project.name',
            percentage: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 0] }
              ]
            },
            presentCount: '$present',
            totalCount: '$total'
          }
        },
        {
          $sort: { projectName: 1 }
        }
      ]);

      res.json({
        success: true,
        data: attendanceStats,
        period: {
          month: startDate.getMonth(),
          year: startDate.getFullYear(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attendance statistics'
      });
    }
  })
);

// In your attendances.js routes file
router.get(
  '/stats/simple',
  auth,
  asyncHandler(async (req, res) => {
    try {
      // Get all active projects
      const projects = await Project.find({ status: 'active', isActive: true });
      
      const stats = await Promise.all(projects.map(async (project) => {
        try {
          // Get count of laborers assigned to this project
          const laborCount = await Labour.countDocuments({ 
            project: project._id, 
            status: 'active' 
          });
          
          if (laborCount === 0) {
            return null;
          }
          
          // Get present count for today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const presentCount = await Attendance.countDocuments({
            project: project._id,
            date: today,
            status: { $in: ['present', 'half-day'] }
          });
          
          const percentage = laborCount > 0 ? Math.round((presentCount / laborCount) * 100) : 0;
          
          return {
            projectId: project._id,
            projectName: project.name,
            percentage,
            presentCount,
            totalCount: laborCount
          };
        } catch (error) {
          console.error(`Error processing project ${project.name}:`, error);
          return null;
        }
      }));
      
      // Filter out null values (projects with no laborers or errors)
      const validStats = stats.filter(stat => stat !== null);
      
      res.json({
        success: true,
        data: validStats
      });
    } catch (error) {
      console.error('Error in simple attendance stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attendance statistics'
      });
    }
  })
);

module.exports = router
