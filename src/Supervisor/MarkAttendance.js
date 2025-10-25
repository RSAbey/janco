"use client"

import { useState, useEffect } from "react"
import { FaSave, FaCalendarAlt, FaUser, FaIdCard, FaClock, FaStickyNote, FaCheck, FaTimes, FaExclamationTriangle } from "react-icons/fa"
import attendanceService from "../services/attendanceService"
import labourService from "../services/labourService"

const MarkAttendance = ({ projectId }) => {
  const [labourers, setLabourers] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [attendanceRecords, setAttendanceRecords] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // Filter labourers based on search term
  const filteredLabourers = labourers.filter(labourer =>
    labourer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    labourer.labourId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Fetch labourers for the project
  useEffect(() => {
    const fetchLabourers = async () => {
      if (!projectId) return

      try {
        setLoading(true)
        const labourersData = await labourService.getLabourers({ projectId })
        setLabourers(labourersData)

        const initialRecords = {}
        labourersData.forEach((labourer) => {
          initialRecords[labourer._id] = {
            status: "absent",
            clockIn: "",
            clockOut: "",
            notes: "",
          }
        })
        setAttendanceRecords(initialRecords)
      } catch (error) {
        setError("Failed to fetch labourers")
        console.error("Error fetching labourers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLabourers()
  }, [projectId])

  // Fetch existing attendance for the selected date
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!projectId || !selectedDate || labourers.length === 0) return

      try {
        setLoading(true)
        const records = await attendanceService.getAttendance({
          projectId,
          startDate: selectedDate,
          endDate: selectedDate,
        })

        const recordsMap = {}

        // First, set default values for all labourers
        labourers.forEach((labourer) => {
          recordsMap[labourer._id] = {
            status: "absent",
            clockIn: "",
            clockOut: "",
            notes: "",
          }
        })

        // Then, override with existing attendance data
        records.forEach((record) => {
          if (record.labour && record.labour._id) {
            recordsMap[record.labour._id] = {
              status: record.status || "absent",
              clockIn: record.clockIn ? new Date(record.clockIn).toTimeString().split(" ")[0] : "",
              clockOut: record.clockOut ? new Date(record.clockOut).toTimeString().split(" ")[0] : "",
              notes: record.notes || "",
            }
          }
        })

        setAttendanceRecords(recordsMap)
      } catch (error) {
        console.error("Error fetching attendance:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()
  }, [projectId, selectedDate, labourers])

  const handleStatusChange = (labourId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [labourId]: {
        ...prev[labourId],
        status,
        ...(status === "absent" && { clockIn: "", clockOut: "" }),
      },
    }))
  }

  const handleTimeChange = (labourId, field, value) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [labourId]: {
        ...prev[labourId],
        [field]: value,
        ...(value && { status: "present" }),
      },
    }))
  }

  const handleNotesChange = (labourId, notes) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [labourId]: {
        ...prev[labourId],
        notes,
      },
    }))
  }

  const handleSubmit = async () => {
    if (!projectId || !selectedDate) return

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const attendanceData = labourers
        .map((labourer) => {
          const record = attendanceRecords[labourer._id]

          if (!record) return null

          const hasData = record.status !== "absent" || record.clockIn || record.clockOut || record.notes
          if (!hasData) return null

          let clockInDateTime = null
          let clockOutDateTime = null

          if (record.clockIn) {
            clockInDateTime = new Date(`${selectedDate}T${record.clockIn}`).toISOString()
          }

          if (record.clockOut) {
            clockOutDateTime = new Date(`${selectedDate}T${record.clockOut}`).toISOString()
          }

          return {
            labour: labourer._id,
            project: projectId,
            date: new Date(selectedDate).toISOString(),
            status: record.status || "absent",
            clockIn: clockInDateTime,
            clockOut: clockOutDateTime,
            notes: record.notes || "",
            shiftType: "day",
          }
        })
        .filter((record) => record !== null)

      if (attendanceData.length === 0) {
        setError("No attendance data to save. Please mark at least one labourer as present or add time/notes.")
        return
      }

      const result = await attendanceService.bulkCreateAttendance(attendanceData)

      if (result.errors && result.errors.length > 0) {
        setSuccess(`Saved ${result.attendance.length} records. ${result.errors.length} failed.`)
      } else {
        setSuccess(`Successfully marked attendance for ${result.attendance ? result.attendance.length : attendanceData.length} labourers!`)
      }

      setTimeout(() => setSuccess(""), 5000)

      // Refresh data
      const records = await attendanceService.getAttendance({
        projectId,
        startDate: selectedDate,
        endDate: selectedDate,
      })

      const recordsMap = {}
      labourers.forEach((labourer) => {
        recordsMap[labourer._id] = {
          status: "absent",
          clockIn: "",
          clockOut: "",
          notes: "",
        }
      })

      records.forEach((record) => {
        if (record.labour && record.labour._id) {
          recordsMap[record.labour._id] = {
            status: record.status || "absent",
            clockIn: record.clockIn ? new Date(record.clockIn).toTimeString().split(" ")[0] : "",
            clockOut: record.clockOut ? new Date(record.clockOut).toTimeString().split(" ")[0] : "",
            notes: record.notes || "",
          }
        }
      })

      setAttendanceRecords(recordsMap)
    } catch (error) {
      setError(error.message || "Failed to mark attendance")
      console.error("Error marking attendance:", error)
    } finally {
      setSaving(false)
    }
  }

  // Quick stats
  const stats = {
    total: labourers.length,
    present: Object.values(attendanceRecords).filter(record => record.status === "present").length,
    absent: Object.values(attendanceRecords).filter(record => record.status === "absent").length,
    halfDay: Object.values(attendanceRecords).filter(record => record.status === "half-day").length,
    late: Object.values(attendanceRecords).filter(record => record.status === "late").length,
  }

  if (loading && labourers.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200">
      {/* Compact Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded border">
              <FaCalendarAlt className="text-gray-400" size={14} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm border-none focus:outline-none"
              />
            </div>

            {/* Quick Stats */}
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">👥 {stats.total}</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">✅ {stats.present}</span>
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded">❌ {stats.absent}</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">⏰ {stats.late}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">½ {stats.halfDay}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search labourers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 border border-gray-300 rounded text-sm w-40 focus:ring-1 focus:ring-green-500"
              />
              <FaUser className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={12} />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSubmit}
              disabled={saving || !projectId}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaSave size={12} />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <FaTimes className="flex-shrink-0" size={12} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            <FaCheck className="flex-shrink-0" size={12} />
            <span>{success}</span>
          </div>
        )}

        {!projectId && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
            <FaExclamationTriangle className="flex-shrink-0" size={12} />
            <span>Please select a project first</span>
          </div>
        )}
      </div>

      {/* Attendance Table */}
      <div className="overflow-auto">
        {filteredLabourers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No labourers found{searchTerm ? " matching search" : ""}
          </div>
        ) : (
          <div className="min-w-max">
            {/* Table Header */}
            <div className="grid grid-cols-[80px_1fr_100px_100px_100px_1fr] gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700">
              <div className="flex items-center gap-1">
                <FaIdCard size={10} />
                <span>ID</span>
              </div>
              <div className="flex items-center gap-1">
                <FaUser size={10} />
                <span>Name</span>
              </div>
              <div>Status</div>
              <div className="flex items-center gap-1">
                <FaClock size={10} />
                <span>In</span>
              </div>
              <div className="flex items-center gap-1">
                <FaClock size={10} />
                <span>Out</span>
              </div>
              <div className="flex items-center gap-1">
                <FaStickyNote size={10} />
                <span>Notes</span>
              </div>
            </div>

            {/* Table Rows */}
            <div className="max-h-96 overflow-y-auto">
              {filteredLabourers.map((labourer) => {
                const record = attendanceRecords[labourer._id] || {
                  status: "absent",
                  clockIn: "",
                  clockOut: "",
                  notes: "",
                }

                return (
                  <div
                    key={labourer._id}
                    className="grid grid-cols-[80px_1fr_100px_100px_100px_1fr] gap-1 px-3 py-2 border-b border-gray-100 hover:bg-blue-50 text-sm"
                  >
                    {/* Labour ID */}
                    <div className="font-mono text-xs text-gray-600 truncate" title={labourer.labourId}>
                      {labourer.labourId}
                    </div>

                    {/* Name */}
                    <div className="truncate" title={labourer.name}>
                      {labourer.name}
                    </div>

                    {/* Status */}
                    <div>
                      <select
                        value={record.status || "absent"}
                        onChange={(e) => handleStatusChange(labourer._id, e.target.value)}
                        className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-green-500"
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="half-day">Half Day</option>
                        <option value="late">Late</option>
                      </select>
                    </div>

                    {/* Clock In */}
                    <div>
                      <input
                        type="time"
                        value={record.clockIn || ""}
                        onChange={(e) => handleTimeChange(labourer._id, "clockIn", e.target.value)}
                        disabled={record.status === "absent"}
                        className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-green-500 disabled:bg-gray-100"
                      />
                    </div>

                    {/* Clock Out */}
                    <div>
                      <input
                        type="time"
                        value={record.clockOut || ""}
                        onChange={(e) => handleTimeChange(labourer._id, "clockOut", e.target.value)}
                        disabled={record.status === "absent"}
                        className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-green-500 disabled:bg-gray-100"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <input
                        type="text"
                        value={record.notes || ""}
                        onChange={(e) => handleNotesChange(labourer._id, e.target.value)}
                        placeholder="Add notes..."
                        className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Summary */}
      {filteredLabourers.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>Showing {filteredLabourers.length} of {labourers.length} labourers</span>
            <span>Ready to save attendance data</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default MarkAttendance