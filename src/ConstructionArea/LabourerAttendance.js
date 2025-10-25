"use client"

import { useState, useEffect } from "react"
import attendanceService from "../services/attendanceService"
import labourService from "../services/labourService"
import projectService from "../services/projectService"
import MarkAttendance from "./MarkAttendance"

const LabourerAttendance = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState("view") // "view" or "mark"
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  
  // Get today's date
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentDate = today.getDate()
  const currentYear = today.getFullYear()

  // Function to get the number of days in a month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // State variables for view tab
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(projectId || "")
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [attendanceData, setAttendanceData] = useState([])
  const [labourers, setLabourers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsData = await projectService.getProjects({ status: "active" })
        setProjects(projectsData)
        if (projectId) {
          setSelectedProject(projectId)
        } else if (projectsData.length > 0) {
          setSelectedProject(projectsData[0]._id)
        }
      } catch (error) {
        setError("Failed to fetch projects")
        console.error("Error fetching projects:", error)
      }
    }

    fetchProjects()
  }, [projectId])

  // Fetch labourers for the selected project
  useEffect(() => {
    if (!selectedProject) return

    const fetchLabourers = async () => {
      try {
        const labourersData = await labourService.getLabourers({ projectId: selectedProject })
        setLabourers(labourersData)
      } catch (error) {
        console.error("Error fetching labourers:", error)
      }
    }

    fetchLabourers()
  }, [selectedProject])

  // Fetch attendance data when project or month changes (for view tab)
  useEffect(() => {
    if (!selectedProject || activeTab !== "view") return

    const fetchAttendance = async () => {
      try {
        setLoading(true)
        setError("")

        // Calculate date range for the selected month
        const startDate = new Date(currentYear, selectedMonth, 1)
        const endDate = new Date(currentYear, selectedMonth + 1, 0)

        const attendanceRecords = await attendanceService.getAttendance({
          projectId: selectedProject,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        })

        // Process attendance data for display
        const processedData = processAttendanceForDisplay(attendanceRecords)
        setAttendanceData(processedData)
      } catch (error) {
        setError("Failed to fetch attendance data")
        console.error("Error fetching attendance data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()
  }, [selectedProject, selectedMonth, currentYear, activeTab])

  // Process attendance records into display format
  const processAttendanceForDisplay = (records) => {
    const labourAttendance = {}

    // Create initial structure for all labourers
    labourers.forEach((labourer) => {
      labourAttendance[labourer._id] = {
        name: labourer.name,
        labourId: labourer.labourId,
        attendance: Array(getDaysInMonth(selectedMonth, currentYear)).fill(null),
      }
    })

    // Fill in attendance data from records
    records.forEach((record) => {
      const labourId = record.labour._id
      const date = new Date(record.date)
      const day = date.getDate()

      if (labourAttendance[labourId]) {
        let status = "Absent"
        
        if (record.status === "present") {
          status = record.shiftType === "night" ? "Night" : record.hoursWorked >= 8 ? "Full" : "Day"
        } else if (record.status === "half-day") {
          status = "Day"
        } else if (record.status === "late") {
          status = "Day"
        }

        labourAttendance[labourId].attendance[day - 1] = status
      }
    })

    return Object.values(labourAttendance)
  }

  const renderViewTab = () => (
    <div className="w-full bg-white p-6 rounded-lg">
      {/* Dropdown for selecting project (only show if projectId not provided) */}
      {!projectId && (
        <div className="mb-4 flex items-center">
          <label className="text-black mr-2">Select Project:</label>
          <select
            className="p-2 border rounded-md"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={loading}
          >
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {/* Month Selection Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {months.map((month, index) => (
          <button
            key={index}
            className={`p-2 px-4 rounded-md text-black ${
              selectedMonth === index ? "bg-green-600 text-white" : "bg-gray-200 hover:bg-gray-300"
            }`}
            onClick={() => setSelectedMonth(index)}
            disabled={loading}
          >
            {month}
          </button>
        ))}
      </div>

      {/* Legend for Shift Colors */}
      <div className="flex gap-4 px-4 items-center mb-4">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-500"></div>
          <span className="text-sm text-black">Day</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-purple-800"></div>
          <span className="text-sm text-black">Night</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-sm text-black">Full</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-sm text-black">Absent</span>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-auto">
        {attendanceData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {loading ? "Loading attendance data..." : "No attendance data found for this project and month."}
          </div>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="p-2">Labour ID</th>
                <th className="p-2">Name</th>
                {/* Days of the selected month */}
                {Array.from({ length: getDaysInMonth(selectedMonth, currentYear) }, (_, i) => (
                  <th
                    key={i}
                    className={`p-2 ${
                      selectedMonth === currentMonth && i + 1 === currentDate ? "bg-yellow-300 text-black" : ""
                    }`}
                  >
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((labourer, index) => (
                <tr key={index} className="border border-gray-300">
                  <td className="p-2 font-semibold">{labourer.labourId}</td>
                  <td className="p-2 font-semibold">{labourer.name}</td>
                  {labourer.attendance.map((status, i) => (
                    <td key={i} className="p-1">
                      <div
                        className={`w-6 h-6 flex items-center justify-center rounded text-white text-xs shadow-inner ${
                          status === "Day"
                            ? "bg-blue-500"
                            : status === "Night"
                              ? "bg-purple-800"
                              : status === "Full"
                                ? "bg-green-500"
                                : status === "Absent"
                                  ? "bg-red-700"
                                  : "bg-gray-300"
                        } ${selectedMonth === currentMonth && i + 1 === currentDate ? "ring-2 ring-yellow-500" : ""}`}
                        title={status || "No data"}
                      >
                        {status ? status[0] : ""}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )

  return (
    <div className="w-full bg-white p-6 rounded-lg">
      {/* Tabs for Viewing vs Marking Attendance */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("view")}
          className={`px-6 py-2 rounded-md ${
            activeTab === "view" 
              ? "bg-green-600 text-white" 
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          View Attendance
        </button>
        <button
          onClick={() => setActiveTab("mark")}
          className={`px-6 py-2 rounded-md ${
            activeTab === "mark" 
              ? "bg-green-600 text-white" 
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Mark Attendance
        </button>
      </div>

      {activeTab === "view" ? renderViewTab() : <MarkAttendance projectId={selectedProject || projectId} />}
    </div>
  )
}

export default LabourerAttendance