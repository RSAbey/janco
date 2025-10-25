const mongoose = require("mongoose")
require("dotenv").config()

async function fixAttendanceIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("Connected to MongoDB")

    const db = mongoose.connection.db
    const collection = db.collection("attendances")

    // Get existing indexes
    const indexes = await collection.indexes()
    console.log(
      "Current indexes:",
      indexes.map((idx) => idx.name),
    )

    // Check if the problematic employee_1_date_1 index exists
    const hasEmployeeIndex = indexes.some((idx) => idx.name === "employee_1_date_1")

    if (hasEmployeeIndex) {
      console.log("Dropping old employee_1_date_1 index...")
      await collection.dropIndex("employee_1_date_1")
      console.log("Successfully dropped employee_1_date_1 index")
    } else {
      console.log("employee_1_date_1 index not found")
    }

    // Ensure the correct labour_1_date_1 index exists
    const hasLabourIndex = indexes.some((idx) => idx.name === "labour_1_date_1")

    if (!hasLabourIndex) {
      console.log("Creating labour_1_date_1 index...")
      await collection.createIndex({ labour: 1, date: 1 }, { unique: true, name: "labour_1_date_1" })
      console.log("Successfully created labour_1_date_1 index")
    } else {
      console.log("labour_1_date_1 index already exists")
    }

    // Verify final indexes
    const finalIndexes = await collection.indexes()
    console.log(
      "Final indexes:",
      finalIndexes.map((idx) => idx.name),
    )

    console.log("Migration completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
  } finally {
    await mongoose.disconnect()
    console.log("Disconnected from MongoDB")
  }
}

// Run the migration
fixAttendanceIndex()
