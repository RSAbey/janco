"use client"

import { useState, useEffect } from "react"
import { DateRange } from "react-date-range"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import apiClient from "../../config/api"

const SiteRegForm = ({ formData = {}, updateFormData = () => {}, disableSubmit = false }) => {
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedRange, setSelectedRange] = useState([
    {
      startDate: formData.startDate || new Date(),
      endDate: formData.endDate || new Date(),
      key: "selection",
    },
  ])
  const [siteName, setSiteName] = useState(formData.siteName || "")
  const [supervisor, setSupervisor] = useState(formData.supervisor || "")
  const [location, setLocation] = useState(formData.location || "")
  const [hasPickedRange, setHasPickedRange] = useState(false)
  const [estimatedCost, setEstimatedCost] = useState(formData.estimatedCost || "")
  const [docFileNo, setDocFileNo] = useState(formData.docFileNo || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [supervisors, setSupervisors] = useState([])
  const [supervisorsLoading, setSupervisorsLoading] = useState(false)

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        setSupervisorsLoading(true)
        const data = await apiClient.get("/users?role=supervisor")
        setSupervisors(data.users || [])
      } catch (error) {
        console.error("Error fetching supervisors:", error)
      } finally {
        setSupervisorsLoading(false)
      }
    }

    fetchSupervisors()
  }, [])

  useEffect(() => {
    updateFormData({
      siteName,
      supervisor,
      location,
      startDate: selectedRange[0].startDate,
      endDate: selectedRange[0].endDate,
      estimatedCost,
      docFileNo,
    })
  }, [siteName, supervisor, location, selectedRange, estimatedCost, docFileNo, updateFormData])

  const formatCentsAsAmount = (cents) => {
    const num = Number.parseInt(cents || "0", 10)
    return (num / 100).toFixed(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (disableSubmit) {
      // Form submission is handled by parent component
      return
    }

    // Keep original submission logic for backward compatibility
    setLoading(true)
    setError("")

    try {
      const siteData = {
        name: siteName,
        supervisor: supervisor,
        location: location,
        startDate: selectedRange[0].startDate,
        endDate: selectedRange[0].endDate,
        estimatedCost: Number.parseFloat(estimatedCost) / 100, // Convert cents to dollars
        documentFileNo: docFileNo,
      }

      const siteService = await import("../../services/siteService")
      const newSite = await siteService.default.createSite(siteData)

      setSiteName("")
      setSupervisor("")
      setLocation("")
      setSelectedRange([
        {
          startDate: new Date(),
          endDate: new Date(),
          key: "selection",
        },
      ])
      setHasPickedRange(false)
      setEstimatedCost("")
      setDocFileNo("")

      alert("Site registered successfully!")
    } catch (error) {
      setError(error.message || "Failed to register site")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 p-2">Construction Area</h2>
      <div className="bg-green-100 p-4 rounded-lg shadow">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-row justify-between gap-2 mb-2">
              <div className="w-1/2">
                <label className="p-2">Site Name *</label>
                <input
                  type="text"
                  placeholder="Enter Site Name"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg"
                  required
                />
              </div>
              <div className="w-1/2">
                <label className="p-2">Supervisor *</label>
                <select
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg"
                  required
                  disabled={supervisorsLoading}
                >
                  <option value="">{supervisorsLoading ? "Loading supervisors..." : "Select Supervisor"}</option>
                  {supervisors.map((sup) => (
                    <option key={sup._id} value={`${sup.firstName} ${sup.lastName}`}>
                      {sup.firstName} {sup.lastName} ({sup.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-row justify-between gap-2 mb-2">
              <div className="w-1/2">
                <label className="p-2">Location *</label>
                <input
                  type="text"
                  placeholder="Enter Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg"
                  required
                />
              </div>
              <div className="w-1/2">
                <label className="p-2">Document File No *</label>
                <input
                  type="text"
                  placeholder="Enter Document File No"
                  value={docFileNo}
                  onChange={(e) => setDocFileNo(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg"
                  required
                />
              </div>
            </div>

            <div className="flex flex-row justify-between gap-2">
              <div className="w-1/2 relative">
                <label className="p-2">Duration *</label>
                <input
                  type="text"
                  readOnly
                  placeholder="Select Duration"
                  value={
                    hasPickedRange
                      ? `${format(selectedRange[0].startDate, "yyyy/MM/dd")} - ${format(selectedRange[0].endDate, "yyyy/MM/dd")}`
                      : ""
                  }
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg bg-white cursor-pointer"
                  required
                />

                {showCalendar && (
                  <div className="absolute z-50 mt-2">
                    <DateRange
                      editableDateInputs={true}
                      onChange={(item) => {
                        setSelectedRange([item.selection])
                        setHasPickedRange(true)
                      }}
                      moveRangeOnFirstSelection={false}
                      ranges={selectedRange}
                      rangeColors={hasPickedRange ? ["#22c55e"] : ["#d1d5db"]}
                      locale={enUS}
                    />
                  </div>
                )}
              </div>
              <div className="w-1/2">
                <label className="p-2">Estimated Cost *</label>
                <input
                  type="text"
                  value={formatCentsAsAmount(estimatedCost)}
                  onChange={(e) => {
                    const rawDigits = e.target.value.replace(/\D/g, "") // strip non-digits
                    setEstimatedCost(rawDigits)
                  }}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg"
                  required
                />
              </div>
            </div>
          </div>

          {!disableSubmit && (
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? "Registering..." : "Register Site"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default SiteRegForm
