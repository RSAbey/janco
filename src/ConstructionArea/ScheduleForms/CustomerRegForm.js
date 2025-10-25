"use client"

import { useState, useEffect } from "react"

const CustomerRegForm = ({ formData = {}, updateFormData = () => {} }) => {
  //STEP O1 (CUSTOMER  REGISTRATION)
  const [customerName, setCustomerName] = useState(formData.customerName || "")
  const [nicNumber, setNicNumber] = useState(formData.nicNumber || "")
  const [phoneNumber, setPhoneNumber] = useState(formData.phoneNumber || "")
  const [address, setAddress] = useState(formData.address || "")
  const [email, setEmail] = useState(formData.email || "")

  useEffect(() => {
    updateFormData({
      customerName,
      nicNumber,
      phoneNumber,
      address,
      email,
    })
  }, [customerName, nicNumber, phoneNumber, address, email, updateFormData])

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 p-2">Customer Registration</h2>
      <div className="bg-green-100 p-4 rounded-lg shadow">
        <div className="flex flex-col gap-4">
          <div className="flex flex-row justify-between gap-2 mb-2">
            <div className="w-1/2">
              <label className="p-2">Customer Name *</label>
              <input
                type="text"
                placeholder="Enter Here"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg"
                required
              />
            </div>
            <div className="w-1/2">
              <label className="p-2">NIC Number *</label>
              <input
                type="text"
                placeholder="Enter Here"
                value={nicNumber}
                onChange={(e) => setNicNumber(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg"
                required
              />
            </div>
          </div>
          <div>
            <label className="p-2">Email *</label>
            <input
              type="email"
              placeholder="Enter Here"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg"
              required
            />
          </div>
          <div className="flex flex-row justify-between gap-2">
            <div className="w-1/2">
              <label className="p-2">Mobile Number *</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter Here"
                value={phoneNumber}
                onChange={(e) => {
                  const onlyNums = e.target.value.replace(/\D/g, "")
                  setPhoneNumber(onlyNums)
                }}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg"
                required
              />
            </div>
            <div className="w-1/2">
              <label className="p-2">Address *</label>
              <input
                type="text"
                placeholder="Enter Here"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg"
                required
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerRegForm
