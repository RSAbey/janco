import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  FaArrowLeft, 
  FaSearch, 
  FaFilter,
  FaCalendarAlt,
  FaEye,
  FaEdit,
  FaSync,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle
} from "react-icons/fa";
import attendanceService from "../services/attendanceService";
import labourService from "../services/labourService";
import projectService from "../services/projectService";
import MarkAttendance from "./MarkAttendance";

const SupervisorLabourerAttendance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const projectId = location.state?.projectId;
  
  const [activeTab, setActiveTab] = useState("view");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  // Get today's date
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();
  const currentYear = today.getFullYear();

  // State variables
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(projectId || "");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [attendanceData, setAttendanceData] = useState([]);
  const [labourers, setLabourers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showLegend, setShowLegend] = useState(false);

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsData = await projectService.getProjects({ status: "active" });
        setProjects(projectsData);
        if (projectId) {
          setSelectedProject(projectId);
        } else if (projectsData.length > 0) {
          setSelectedProject(projectsData[0]._id);
        }
      } catch (error) {
        setError("Failed to fetch projects");
        console.error("Error fetching projects:", error);
      }
    }

    fetchProjects();
  }, [projectId]);

  // Fetch labourers for the selected project
  useEffect(() => {
    if (!selectedProject) return;

    const fetchLabourers = async () => {
      try {
        const labourersData = await labourService.getLabourers({ projectId: selectedProject });
        setLabourers(labourersData);
      } catch (error) {
        console.error("Error fetching labourers:", error);
      }
    }

    fetchLabourers();
  }, [selectedProject]);

  // Fetch attendance data when project or month changes
  useEffect(() => {
    if (!selectedProject || activeTab !== "view") return;

    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError("");

        // Calculate date range for the selected month
        const startDate = new Date(selectedYear, selectedMonth, 1);
        const endDate = new Date(selectedYear, selectedMonth + 1, 0);

        const attendanceRecords = await attendanceService.getAttendance({
          projectId: selectedProject,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        });

        // Process attendance data for display
        const processedData = processAttendanceForDisplay(attendanceRecords);
        setAttendanceData(processedData);
      } catch (error) {
        setError("Failed to fetch attendance data");
        console.error("Error fetching attendance data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAttendance();
  }, [selectedProject, selectedMonth, selectedYear, activeTab]);

  // Process attendance records into display format
  const processAttendanceForDisplay = (records) => {
    const labourAttendance = {};
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    // Create initial structure for all labourers
    labourers.forEach((labourer) => {
      labourAttendance[labourer._id] = {
        name: labourer.name,
        labourId: labourer.labourId,
        attendance: Array(daysInMonth).fill(null),
        totalPresent: 0,
        totalAbsent: 0,
        totalDays: daysInMonth
      };
    });

    // Fill in attendance data from records
    records.forEach((record) => {
      const labourId = record.labour._id;
      const date = new Date(record.date);
      const day = date.getDate();

      if (labourAttendance[labourId]) {
        let status = "Absent";
        
        if (record.status === "present") {
          status = record.shiftType === "night" ? "Night" : record.hoursWorked >= 8 ? "Full" : "Day";
          labourAttendance[labourId].totalPresent++;
        } else if (record.status === "half-day") {
          status = "Day";
          labourAttendance[labourId].totalPresent++;
        } else if (record.status === "late") {
          status = "Day";
          labourAttendance[labourId].totalPresent++;
        } else {
          labourAttendance[labourId].totalAbsent++;
        }

        labourAttendance[labourId].attendance[day - 1] = status;
      }
    });

    return Object.values(labourAttendance);
  };

  // Filter labourers based on search term
  const filteredAttendanceData = attendanceData.filter(labourer =>
    labourer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    labourer.labourId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get days in month for the calendar header
  const getDaysInMonth = () => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  };

  // Navigation functions for month/year
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Compact day cell renderer
  const renderDayCell = (status, dayIndex) => (
    <div
      key={dayIndex}
      className={`w-6 h-6 flex items-center justify-center rounded text-white text-xs font-medium cursor-help ${
        status === "Day"
          ? "bg-blue-500"
          : status === "Night"
          ? "bg-purple-600"
          : status === "Full"
          ? "bg-green-500"
          : status === "Absent"
          ? "bg-red-500"
          : "bg-gray-300 text-gray-400"
      } ${
        selectedMonth === currentMonth &&
        selectedYear === currentYear &&
        dayIndex + 1 === currentDate
          ? "ring-1 ring-yellow-400"
          : ""
      }`}
      title={`${dayIndex + 1} ${months[selectedMonth]}: ${status || "No data"}`}
    >
      {status ? status.charAt(0) : ""}
    </div>
  );

  // Summary statistics
  const summaryStats = {
    totalLabourers: filteredAttendanceData.length,
    totalPresent: filteredAttendanceData.reduce((sum, labourer) => sum + labourer.totalPresent, 0),
    totalAbsent: filteredAttendanceData.reduce((sum, labourer) => sum + labourer.totalAbsent, 0),
    attendanceRate: filteredAttendanceData.length > 0 
      ? ((filteredAttendanceData.reduce((sum, labourer) => sum + labourer.totalPresent, 0) / 
         (filteredAttendanceData.length * getDaysInMonth())) * 100).toFixed(1)
      : 0
  };

  const renderViewTab = () => (
    <div className="w-full bg-white rounded-lg border border-gray-200">
      {/* Compact Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {!projectId && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Project:</label>
                <select
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500"
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

            {/* Month Navigation */}
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded border">
              <button onClick={goToPreviousMonth} className="p-1 hover:bg-gray-100 rounded">
                <FaChevronLeft size={14} />
              </button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {months[selectedMonth]} {selectedYear}
              </span>
              <button onClick={goToNextMonth} className="p-1 hover:bg-gray-100 rounded">
                <FaChevronRight size={14} />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 text-xs">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">👥 {summaryStats.totalLabourers}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">✅ {summaryStats.totalPresent}</span>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded">❌ {summaryStats.totalAbsent}</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">📊 {summaryStats.attendanceRate}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={12} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 border border-gray-300 rounded text-sm w-40 focus:ring-1 focus:ring-green-500"
              />
            </div>

            {/* Legend Toggle */}
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="p-1 text-gray-600 hover:bg-gray-200 rounded"
              title="Toggle Legend"
            >
              <FaInfoCircle size={14} />
            </button>

            <button
              onClick={() => window.location.reload()}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              title="Refresh"
            >
              <FaSync size={14} />
            </button>
          </div>
        </div>

        {/* Compact Legend */}
        {showLegend && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-200 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span>Day</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-600"></div>
              <span>Night</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>Full</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-300"></div>
              <span>No Data</span>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Table */}
      <div className="overflow-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading...</p>
          </div>
        ) : filteredAttendanceData.length === 0 ? (
          <div className="text-center py-8">
            <FaCalendarAlt size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">No attendance records found</p>
          </div>
        ) : (
          <div className="min-w-max">
            {/* Table Header */}
            <div className="grid grid-cols-[minmax(120px,1fr)_80px_60px_60px_auto] gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700">
              <div>Labourer</div>
              <div>ID</div>
              <div title="Present Days">P</div>
              <div title="Absent Days">A</div>
              <div className="flex gap-1">
                {Array.from({ length: getDaysInMonth() }, (_, i) => (
                  <div
                    key={i}
                    className={`w-6 text-center ${
                      selectedMonth === currentMonth && 
                      selectedYear === currentYear && 
                      i + 1 === currentDate 
                        ? "text-red-600 font-bold" 
                        : "text-gray-500"
                    }`}
                    title={`Day ${i + 1}`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Table Rows */}
            <div className="max-h-96 overflow-y-auto">
              {filteredAttendanceData.map((labourer, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[minmax(120px,1fr)_80px_60px_60px_auto] gap-1 px-3 py-2 border-b border-gray-100 hover:bg-blue-50 text-sm"
                >
                  <div className="font-medium truncate" title={labourer.name}>
                    {labourer.name}
                  </div>
                  <div className="text-xs text-gray-600 font-mono">{labourer.labourId}</div>
                  <div className="text-green-600 font-semibold">{labourer.totalPresent}</div>
                  <div className="text-red-600 font-semibold">{labourer.totalAbsent}</div>
                  <div className="flex gap-1">
                    {labourer.attendance.map(renderDayCell)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Compact Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/supervisordash")}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go Back"
            >
              <FaArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Attendance Management</h1>
              <p className="text-gray-600 text-sm">Track and manage labourer attendance</p>
            </div>
          </div>
          
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("view")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "view" 
                  ? "bg-white text-green-600 shadow-sm" 
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <FaEye className="inline mr-1" size={12} />
              View
            </button>
            <button
              onClick={() => setActiveTab("mark")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "mark" 
                  ? "bg-white text-green-600 shadow-sm" 
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <FaEdit className="inline mr-1" size={12} />
              Mark
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-140px)] overflow-hidden">
        {activeTab === "view" ? renderViewTab() : <MarkAttendance projectId={selectedProject || projectId} />}
      </div>
    </div>
  );
};

export default SupervisorLabourerAttendance;