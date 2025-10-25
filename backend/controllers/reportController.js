const PDFDocument = require("pdfkit")
const Expense = require("../models/Expense")
const asyncHandler = require("../utils/asyncHandler")
const axios = require("axios")
const path = require("path")
const fs = require("fs")

// @desc    Generate expense report
// @route   POST /api/reports/expenses
// @access  Private
exports.generateExpenseReport = asyncHandler(async (req, res) => {
  const { reportTypes, startDate, endDate } = req.body

  // Validate input
  if (!reportTypes || reportTypes.length === 0) {
    return res.status(400).json({ message: "Please select at least one report type" })
  }

  if (!startDate || !endDate) {
    return res.status(400).json({ message: "Please provide start and end dates" })
  }

  // Build filter
  const filter = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  }

  // Filter by type if not both selected
  if (reportTypes.length === 1) {
    filter.type = reportTypes[0]
  }

  // Fetch expenses
  const expenses = await Expense.find(filter)
    .populate("createdBy", "firstName lastName")
    .sort({ date: -1 })

  // Calculate totals
  const totalIncome = expenses
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0)

  const totalExpense = expenses
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0)

  const balance = totalIncome - totalExpense

  // Create PDF
  const doc = new PDFDocument({ margin: 50, size: "A4" })

  // Set response headers
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=expense-report-${new Date().getTime()}.pdf`,
  )

  // Pipe PDF to response
  doc.pipe(res)

  // Load logo
  const logoPath = path.join(__dirname, "../../public/logo.png")
  let logoExists = false
  try {
    if (fs.existsSync(logoPath)) {
      logoExists = true
    }
  } catch (err) {
    console.log("Logo file not found:", err)
  }

  // Header with logo
  const pageWidth = doc.page.width
  const pageHeight = doc.page.height

  // Add logo to top right corner
  if (logoExists) {
    try {
      doc.image(logoPath, pageWidth - 150, 50, { width: 100 })
    } catch (err) {
      console.log("Error adding logo:", err)
    }
  }

  // Company header on the left
  doc.fontSize(18).font("Helvetica-Bold").text("Janco Home & Construction (Pvt) Ltd.", 50, 50)

  doc.fontSize(12).font("Helvetica").text("Architectural Designing and Construction", 50, 75)

  // Contact details
  doc.fontSize(9).font("Helvetica").text("458/1 High Level Road, Pannipitiya.", 50, 95)

  doc.text("011 20 900 90 | 070 60 900 92 | 70 60 900 93 | 077 12 873 74", 50, 110)

  doc.text("jancohomearch@gmail.com | info@jancohome.com", 50, 125)

  doc.text("jancohome.com", 50, 140)

  // Horizontal line
  doc
    .strokeColor("#000000")
    .lineWidth(1)
    .moveTo(50, 160)
    .lineTo(pageWidth - 50, 160)
    .stroke()

  // Report Title
  doc.moveDown(2)
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Financial Report", 50, 180, { align: "center" })

  // Date Range
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(
      `Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      50,
      210,
      { align: "center" },
    )

  doc.text(`Generated: ${new Date().toLocaleString()}`, 50, 225, { align: "center" })

  // Summary section
  doc.moveDown(2)
  let currentY = 260

  doc.fontSize(12).font("Helvetica-Bold").text("Summary", 50, currentY)

  currentY += 25

  // Summary boxes
  doc.fontSize(10).font("Helvetica")

  if (reportTypes.includes("income")) {
    doc.text(`Total Income: `, 50, currentY)
    doc
      .fillColor("#00AA00")
      .text(`Rs. ${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 150, currentY)
    doc.fillColor("#000000")
    currentY += 20
  }

  if (reportTypes.includes("expense")) {
    doc.text(`Total Expenses: `, 50, currentY)
    doc
      .fillColor("#AA0000")
      .text(`Rs. ${totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 150, currentY)
    doc.fillColor("#000000")
    currentY += 20
  }

  if (reportTypes.length === 2 || reportTypes.includes("income") || reportTypes.includes("expense")) {
    doc.text(`Net Balance: `, 50, currentY)
    doc
      .fillColor(balance >= 0 ? "#00AA00" : "#AA0000")
      .text(
        `Rs. ${balance >= 0 ? "+" : "-"}${Math.abs(balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        150,
        currentY,
      )
    doc.fillColor("#000000")
    currentY += 30
  }

  // Transactions table
  doc.fontSize(12).font("Helvetica-Bold").text("Transactions", 50, currentY)

  currentY += 25

  // Table headers
  const tableTop = currentY
  const colWidths = {
    date: 80,
    section: 100,
    description: 180,
    income: 80,
    expense: 80,
  }

  doc.fontSize(9).font("Helvetica-Bold")

  doc.text("Date", 50, tableTop)
  doc.text("Section", 50 + colWidths.date, tableTop)
  doc.text("Description", 50 + colWidths.date + colWidths.section, tableTop)
  doc.text("Income", 50 + colWidths.date + colWidths.section + colWidths.description, tableTop, {
    width: colWidths.income,
    align: "right",
  })
  doc.text(
    "Expense",
    50 + colWidths.date + colWidths.section + colWidths.description + colWidths.income,
    tableTop,
    { width: colWidths.expense, align: "right" },
  )

  currentY = tableTop + 20

  // Draw line under headers
  doc
    .strokeColor("#CCCCCC")
    .lineWidth(0.5)
    .moveTo(50, currentY - 5)
    .lineTo(pageWidth - 50, currentY - 5)
    .stroke()

  // Table rows
  doc.fontSize(8).font("Helvetica")

  for (const expense of expenses) {
    // Check if we need a new page
    if (currentY > pageHeight - 150) {
      doc.addPage();
      currentY = 50;
    }

    const description =
      expense.description.length > 30 ? expense.description.substring(0, 27) + "..." : expense.description

    doc.fillColor("#000000").text(new Date(expense.date).toLocaleDateString(), 50, currentY)

    doc.text(expense.section, 50 + colWidths.date, currentY, { width: colWidths.section })

    doc.text(description, 50 + colWidths.date + colWidths.section, currentY, {
      width: colWidths.description,
    })

    if (expense.type === "income") {
      doc
        .fillColor("#00AA00")
        .text(
          `+${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          50 + colWidths.date + colWidths.section + colWidths.description,
          currentY,
          { width: colWidths.income, align: "right" },
        )
      doc.fillColor("#000000")
    } else {
      doc
        .fillColor("#AA0000")
        .text(
          `-${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          50 + colWidths.date + colWidths.section + colWidths.description + colWidths.income,
          currentY,
          { width: colWidths.expense, align: "right" },
        )
      doc.fillColor("#000000")
    }

    currentY += 20
  }


  // Finalize PDF
  doc.end()
})
