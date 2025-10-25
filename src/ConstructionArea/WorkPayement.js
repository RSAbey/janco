"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@mui/material"
import "react-date-range/dist/styles.css"
import "react-date-range/dist/theme/default.css"
import PaymentSchedule from "./ScheduleForms/PaymentSchedule"
import CustomerRegForm from "./ScheduleForms/CustomerRegForm"
import SiteRegForm from "./ScheduleForms/SiteRegForm"
import WorkScheduleForm from "./ScheduleForms/WorkScheduleForm"
import siteService from "../services/siteService"
import customerService from "../services/customerService"
import workScheduleService from "../services/workScheduleService"
import paymentScheduleService from "../services/paymentScheduleService"

const WorkPaymentSchedule = ({ isOpen, onClose, onSiteCreated }) => {
  const [step, setStep] = useState(1)
  const [activeSection, setActiveSection] = useState("Pre-Project Process")

  const [formData, setFormData] = useState({
    customer: {
      customerName: "",
      nicNumber: "",
      phoneNumber: "",
      address: "",
      email: "",
    },
    site: {
      siteName: "",
      supervisor: "",
      location: "",
      startDate: new Date(),
      endDate: new Date(),
      estimatedCost: "",
      docFileNo: "",
    },
    workSchedule: {
      steps: {
        "Pre-Project Process": [],
        "Project Process": [],
        "Project Handover Process": [],
      },
    },
    payment: {
      paymentSteps: [],
    },
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const updateFormData = useCallback((section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }))
  }, [])

  const validateCurrentStep = () => {
    switch (step) {
      case 1: // Customer form
        const { customerName, nicNumber, phoneNumber, address, email } = formData.customer
        return customerName && nicNumber && phoneNumber && address && email
      case 2: // Site form
        const { siteName, supervisor, location, estimatedCost, docFileNo } = formData.site
        return siteName && supervisor && location && estimatedCost && docFileNo
      case 3: // Work schedule form
        return true // Work schedule is optional
      case 4: // Payment form
        return true // Payment schedule is optional
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")

    try {
      // Check authentication
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required. Please log in again.")
      }

      // Step 1: Create customer
      const customerData = {
        name: formData.customer.customerName,
        nic: formData.customer.nicNumber,
        phone: formData.customer.phoneNumber,
        contactInfo: {
          primaryContact: {
            name: formData.customer.customerName,
            email: formData.customer.email,
            phone: formData.customer.phoneNumber,
            mobile: formData.customer.phoneNumber,
          },
        },
        address: {
          street: formData.customer.address,
          city: "Not specified",
          state: "Not specified",
          zipCode: "",
        },
        type: "individual",
        status: "active",
      }

      console.log("[v0] Creating customer with data:", customerData)
      const customerResponse = await customerService.createCustomer(customerData)
      console.log("[v0] Customer response:", customerResponse)

      const customerId =
        customerResponse.customer?._id || customerResponse.customer?.id || customerResponse._id || customerResponse.id
      if (!customerId) {
        console.error("[v0] Customer response structure:", customerResponse)
        throw new Error("Failed to get customer ID from created customer")
      }
      console.log("[v0] Extracted customer ID:", customerId)

      // Step 2: Create site/project
      const siteData = {
        name: formData.site.siteName,
        supervisor: formData.site.supervisor,
        location: formData.site.location,
        startDate: new Date(formData.site.startDate).toISOString(),
        endDate: new Date(formData.site.endDate).toISOString(),
        estimatedCost: Number.parseFloat(formData.site.estimatedCost) / 100,
        documentFileNo: formData.site.docFileNo,
        customerId: customerId, // Use the extracted customer ID
      }

      console.log("[v0] Creating site with data:", siteData)
      console.log("[v0] Customer ID being sent:", siteData.customerId)
      const site = await siteService.createSite(siteData)
      console.log("[v0] Site created:", site)

      if (site && site.customerId) {
        console.log("[v0] Site created successfully with customer ID:", site.customerId)
      } else {
        console.warn("[v0] Site created but no customer ID found in response:", site)
      }

      const projectId = site.project?._id || site.project?.id || site._id || site.id
      console.log("[v0] Extracted project ID:", projectId)

      if (!projectId) {
        throw new Error("Failed to get project ID from created site")
      }

      let workSchedules = []
      // Only create work schedules if there are steps
      const hasWorkSteps = Object.values(formData.workSchedule.steps).some((arr) => arr.length > 0)

      if (hasWorkSteps) {
        console.log("[v0] Creating work schedule data:", formData.workSchedule.steps)
        workSchedules = await workScheduleService.createBulkWorkSchedules(
          projectId, // Use extracted project ID
          formData.workSchedule.steps,
        )
        console.log("[v0] Work schedules created:", workSchedules)
      }

      // Only create payment schedules if there are payment steps and work schedules
      if (formData.payment.paymentSteps.length > 0 && workSchedules.length > 0) {
        console.log("[v0] Creating payment schedule data:", formData.payment.paymentSteps)
        const paymentSchedules = await paymentScheduleService.createBulkPaymentSchedules(
          projectId, // Use extracted project ID
          formData.payment.paymentSteps,
          workSchedules,
        )
        console.log("[v0] Payment schedules created:", paymentSchedules)
      }

      alert("All forms submitted successfully!")

      // Reset form data
      setFormData({
        customer: {
          customerName: "",
          nicNumber: "",
          phoneNumber: "",
          address: "",
          email: "",
        },
        site: {
          siteName: "",
          supervisor: "",
          location: "",
          startDate: new Date(),
          endDate: new Date(),
          estimatedCost: "",
          docFileNo: "",
        },
        workSchedule: {
          steps: {
            "Pre-Project Process": [],
            "Project Process": [],
            "Project Handover Process": [],
          },
        },
        payment: {
          paymentSteps: [],
        },
      })

      // Call the onSiteCreated callback to refresh the table
      if (onSiteCreated) {
        onSiteCreated()
      }

      onClose()
    } catch (error) {
      console.error("[v0] Error submitting forms:", error)
      setError(error.message || "Failed to submit forms. Please check all fields are valid.")
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? "" : section)
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep((prev) => (prev < 4 ? prev + 1 : prev))
      setError("") // Clear any validation errors
    } else {
      setError("Please fill in all required fields before proceeding.")
    }
  }

  const prevStep = () => setStep((prev) => (prev > 1 ? prev - 1 : prev))

  // Inline styles for the loader
  const loaderStyles = {
    loader: {
      width: "175px",
      height: "80px",
      display: "block",
      margin: "auto",
      backgroundImage:
        "radial-gradient(circle 25px at 25px 25px, #E8FFF1 100%, transparent 0), radial-gradient(circle 50px at 50px 50px, #E8FFF1 100%, transparent 0), radial-gradient(circle 25px at 25px 25px, #E8FFF1 100%, transparent 0), linear-gradient(#86EFAC 50px, transparent 0)",
      backgroundSize: "50px 50px, 100px 76px, 50px 50px, 120px 40px",
      backgroundPosition: "0px 30px, 37px 0px, 122px 30px, 25px 40px",
      backgroundRepeat: "no-repeat",
      position: "relative",
      boxSizing: "border-box",
    },
    loaderAfter: {
      content: '""',
      left: "50%",
      bottom: "30px",
      transform: "translate(-50%, 0)",
      position: "absolute",
      border: "15px solid transparent",
      borderBottomColor: "#10B981", // green-500 color
      boxSizing: "border-box",
      animation: "fadePull 1s linear infinite",
    },
    loaderBefore: {
      content: '""',
      left: "50%",
      bottom: "15px",
      transform: "translate(-50%, 0)",
      position: "absolute",
      width: "15px",
      height: "15px",
      background: "#10B981", // green-500 color
      boxSizing: "border-box",
      animation: "fadePull 1s linear infinite",
    },
    keyframes: `
    @keyframes fadePull {
      0% {
        transform: translate(-50%, 15px);
        opacity: 0;
      }
      50% {
        transform: translate(-50%, 0px);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -15px);
        opacity: 0;
      }
    }
  `,
  }

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center overflow-auto">
      {/* Inject keyframes as style tag */}
      <style>{loaderStyles.keyframes}</style>

      {/* Loading Popup Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
            <div style={loaderStyles.loader}>
              <div style={loaderStyles.loaderAfter}></div>
              <div style={loaderStyles.loaderBefore}></div>
            </div>
            <p className="mt-4 text-lg font-semibold text-gray-700">Submitting Forms...</p>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {/* Step Indicator */}
        <div className="flex justify-center items-center mb-6">
          {[1, 2, 3, 4].map((num, index) => (
            <React.Fragment key={num}>
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full text-white text-sm font-bold 
                    ${step >= num ? "bg-green-600" : "bg-gray-400"}`}
              >
                {num}
              </div>

              {/* Add line after the circle*/}
              {index < 3 && (
                <div
                  className={`h-1 w-10 md:w-20 transition-all duration-300 
                    ${step > num ? "bg-green-600" : "bg-gray-300"}`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form sections */}
        {step === 1 && (
          <CustomerRegForm formData={formData.customer} updateFormData={(data) => updateFormData("customer", data)} />
        )}

        {step === 2 && (
          <SiteRegForm
            formData={formData.site}
            updateFormData={(data) => updateFormData("site", data)}
            disableSubmit={true}
          />
        )}

        {step === 3 && (
          <WorkScheduleForm
            formData={formData.workSchedule}
            updateFormData={(data) => updateFormData("workSchedule", data)}
          />
        )}

        {step === 4 && (
          <PaymentSchedule
            formData={formData.payment}
            updateFormData={(data) => updateFormData("payment", data)}
            workScheduleSteps={formData.workSchedule.steps}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          {step === 1 ? (
            <Button onClick={onClose} variant="contained" color="success">
              Cancel
            </Button>
          ) : (
            <Button onClick={prevStep} variant="contained" color="success" disabled={step === 1}>
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={nextStep} variant="contained" color="success" disabled={loading}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>
              Submit All Forms
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default WorkPaymentSchedule
