"use client"

import { useState, useEffect } from "react"
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
        console.log("[v0] Loaded attendance records for", Object.keys(recordsMap).length, "labourers")
      } catch (error) {
        console.error("Error fetching attendance:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()
  }, [projectId, selectedDate, labourers])

  const handleStatusChange = (labourId, status) => {
    console.log("[v0] Status change for labour", labourId, "to", status)
    setAttendanceRecords((prev) => ({
      ...prev,
      [labourId]: {
        ...prev[labourId],
        status,
        // Reset clock times if status is absent
        ...(status === "absent" && { clockIn: "", clockOut: "" }),
      },
    }))
  }

  const handleTimeChange = (labourId, field, value) => {
    console.log("[v0] Time change for labour", labourId, field, "to", value)
    setAttendanceRecords((prev) => ({
      ...prev,
      [labourId]: {
        ...prev[labourId],
        [field]: value,
        // Auto-set status to present if time is entered
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

      console.log("[v0] Current attendance records state:", attendanceRecords)
      console.log("[v0] Processing", labourers.length, "labourers")

      const attendanceData = labourers
        .map((labourer) => {
          const record = attendanceRecords[labourer._id]

          console.log("[v0] Processing labourer", labourer.name, "with record:", record)

          if (!record) {
            console.log("[v0] No record found for labourer", labourer.name)
            return null
          }

          // Include record if it has status other than default absent, or has time/notes
          const hasData = record.status !== "absent" || record.clockIn || record.clockOut || record.notes

          if (!hasData) {
            console.log("[v0] No meaningful data for labourer", labourer.name, "- skipping")
            return null
          }

          let clockInDateTime = null
          let clockOutDateTime = null

          if (record.clockIn) {
            clockInDateTime = new Date(`${selectedDate}T${record.clockIn}`).toISOString()
          }

          if (record.clockOut) {
            clockOutDateTime = new Date(`${selectedDate}T${record.clockOut}`).toISOString()
          }

          const attendanceRecord = {
            labour: labourer._id,
            project: projectId,
            date: new Date(selectedDate).toISOString(),
            status: record.status || "absent",
            clockIn: clockInDateTime,
            clockOut: clockOutDateTime,
            notes: record.notes || "",
            shiftType: "day",
          }

          console.log("[v0] Created attendance record for", labourer.name, ":", attendanceRecord)
          return attendanceRecord
        })
        .filter((record) => record !== null)

      console.log("[v0] Final attendance data to submit:", attendanceData)
      console.log("[v0] Submitting attendance data for", attendanceData.length, "labourers")

      if (attendanceData.length === 0) {
        setError("No attendance data to save. Please mark at least one labourer as present or add time/notes.")
        return
      }

      const result = await attendanceService.bulkCreateAttendance(attendanceData)
      console.log("[v0] Bulk create result:", result)

      // Handle partial success
      if (result.errors && result.errors.length > 0) {
        setSuccess(`Saved ${result.attendance.length} records. ${result.errors.length} failed.`)
        console.log("[v0] Some records failed:", result.errors)
      } else {
        setSuccess(
          `Successfully marked attendance for ${result.attendance ? result.attendance.length : attendanceData.length} labourers!`,
        )
      }

      setTimeout(() => setSuccess(""), 5000)

      const records = await attendanceService.getAttendance({
        projectId,
        startDate: selectedDate,
        endDate: selectedDate,
      })

      const recordsMap = {}

      // Initialize with defaults
      labourers.forEach((labourer) => {
        recordsMap[labourer._id] = {
          status: "absent",
          clockIn: "",
          clockOut: "",
          notes: "",
        }
      })

      // Override with fetched data
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
      console.log("[v0] Refreshed attendance records after submission")
    } catch (error) {
      setError(error.message || "Failed to mark attendance")
      console.error("Error marking attendance:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading && labourers.length === 0) {
    return (
      <div className="w-full bg-white p-6 rounded-lg">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Mark Attendance</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">📅</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 border rounded-md"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving || !projectId}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? "Saving..." : "Save Attendance"}
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <span>✓</span>
            )}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>
      )}

      {!projectId && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Please select a project first.
        </div>
      )}

      <div className="overflow-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-green-600 text-white">
              <th className="p-3 text-left">Labour ID</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Clock In</th>
              <th className="p-3 text-left">Clock Out</th>
              <th className="p-3 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {labourers.map((labourer) => {
              const record = attendanceRecords[labourer._id] || {
                status: "absent",
                clockIn: "",
                clockOut: "",
                notes: "",
              }

              return (
                <tr key={labourer._id} className="border border-gray-300 even:bg-gray-50">
                  <td className="p-3 font-semibold">{labourer.labourId}</td>
                  <td className="p-3">{labourer.name}</td>

                  <td className="p-3">
                    <select
                      value={record.status || "absent"}
                      onChange={(e) => handleStatusChange(labourer._id, e.target.value)}
                      className="p-2 border rounded-md w-full"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="half-day">Half Day</option>
                      <option value="late">Late</option>
                    </select>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">⏰</span>
                      <input
                        type="time"
                        value={record.clockIn || ""}
                        onChange={(e) => handleTimeChange(labourer._id, "clockIn", e.target.value)}
                        disabled={record.status === "absent"}
                        className="p-2 border rounded-md w-full"
                      />
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">⏰</span>
                      <input
                        type="time"
                        value={record.clockOut || ""}
                        onChange={(e) => handleTimeChange(labourer._id, "clockOut", e.target.value)}
                        disabled={record.status === "absent"}
                        className="p-2 border rounded-md w-full"
                      />
                    </div>
                  </td>

                  <td className="p-3">
                    <input
                      type="text"
                      value={record.notes || ""}
                      onChange={(e) => handleNotesChange(labourer._id, e.target.value)}
                      placeholder="Notes..."
                      className="p-2 border rounded-md w-full"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {labourers.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">No labourers found for this project.</div>
      )}
    </div>
  )
}

export default MarkAttendance
