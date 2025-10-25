const User = require("../models/User")
const generateToken = require("../utils/generateToken")
const asyncHandler = require("../utils/asyncHandler")

// Helper function to create and send token response
const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  const token = generateToken(user._id)

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
  }

  if (process.env.NODE_ENV === "production") {
    options.secure = true
  }

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      message,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
      },
    })
}

module.exports = {
  sendTokenResponse,
}
