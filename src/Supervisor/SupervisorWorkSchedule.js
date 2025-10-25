import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format, addWeeks, startOfWeek, eachDayOfInterval, addDays, isSameDay } from "date-fns";
import { Delete, Edit, CalendarToday, ArrowBack, FilterList } from "@mui/icons-material";
import ScheduleEditForm from "./EditForms/ScheduleEditForm";
import workScheduleService from "../services/workScheduleService";
import paymentScheduleService from "../services/paymentScheduleService";

const processColors = {
  "Pre-Project Process": "bg-green-500",
  "Project Process": "bg-blue-500",
  "Project Handover Process": "bg-purple-500",
};

const processIcons = {
  "Pre-Project Process": "📋",
  "Project Process": "🏗️",
  "Project Handover Process": "🎯",
};

const SupervisorWorkSchedule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const projectId = location.state?.projectId;
  
  const [scheduleData, setScheduleData] = useState({
    durationWeeks: 3,
    processes: {
      "Pre-Project Process": [],
      "Project Process": [],
      "Project Handover Process": [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedProcess, setSelectedProcess] = useState("Pre-Project Process");
  const [selectedTask, setSelectedTask] = useState(null);
  const [disabledTasks, setDisabledTasks] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!projectId) {
        setError("No project ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const workSchedules = await workScheduleService.getWorkSchedules({
          projectId: projectId,
        });

        const paymentSchedules = await paymentScheduleService.getPaymentSchedules({
          projectId: projectId,
        });

        const transformedData = {
          durationWeeks: 3,
          processes: {
            "Pre-Project Process": [],
            "Project Process": [],
            "Project Handover Process": [],
          },
        };

        if (workSchedules && workSchedules.length > 0) {
          workSchedules.forEach((schedule, index) => {
            let paymentSchedule = null;
            if (paymentSchedules) {
              paymentSchedule = paymentSchedules.find((ps) => ps.workSchedule === schedule._id) ||
                paymentSchedules.find((ps) => ps.step === schedule.step && ps.section === schedule.section) ||
                paymentSchedules.find((ps) => ps.step === schedule.step);
            }

            const uniqueId = `${schedule._id}-${index}`;

            const taskData = {
              id: uniqueId,
              originalId: schedule._id,
              title: schedule.title,
              description: schedule.workDescription || "No description",
              duration: schedule.timeFrame,
              startDate: new Date(schedule.startDate),
              endDate: new Date(schedule.endDate),
              amount: paymentSchedule ? `$${paymentSchedule.paymentAmount}` : null,
              step: schedule.step,
              section: schedule.section,
            };

            if (schedule.section && transformedData.processes[schedule.section]) {
              transformedData.processes[schedule.section].push(taskData);
            } else {
              transformedData.processes["Project Process"].push(taskData);
            }
          });
        }

        setScheduleData(transformedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching schedule data:", err);
        setError(err.message || "Failed to fetch schedule data");
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleData();
  }, [projectId]);

  // Filter tasks based on search term
  const filteredProcesses = Object.entries(scheduleData.processes).reduce((acc, [processName, tasks]) => {
    const filteredTasks = tasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.step.toString().includes(searchTerm)
    );
    if (filteredTasks.length > 0) {
      acc[processName] = filteredTasks;
    }
    return acc;
  }, {});

  const getProjectStartDate = () => {
    const allTasks = Object.values(scheduleData.processes).flat();
    if (allTasks.length === 0) return new Date();
    const earliestDate = allTasks.reduce((earliest, task) => 
      task.startDate < earliest ? task.startDate : earliest, 
      allTasks[0].startDate
    );
    return startOfWeek(earliestDate, { weekStartsOn: 1 });
  };

  const projectStart = getProjectStartDate();
  const weekStart = addWeeks(projectStart, currentWeek);
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  const handleWeekChange = (direction) => {
    setCurrentWeek((prev) => (direction === "next" ? prev + 1 : prev - 1));
  };

  const getAllTasksInRange = () => {
    const tasks = [];
    Object.entries(scheduleData.processes).forEach(([processName, taskList]) => {
      taskList.forEach((task) => {
        const taskStartDate = new Date(task.startDate);
        const taskEndDate = new Date(task.endDate);
        const weekEndDate = addDays(weekStart, 6);
        const overlaps = taskStartDate <= weekEndDate && taskEndDate >= weekStart;

        if (overlaps && !disabledTasks.includes(task.id)) {
          tasks.push({ ...task, process: processName });
        }
      });
    });
    return tasks;
  };

  const deleteTask = async (taskId, processName) => {
    try {
      const originalId = taskId.includes("-") ? taskId.split("-")[0] : taskId;
      await workScheduleService.deleteWorkSchedule(originalId);

      setScheduleData((prevData) => {
        const updatedTasks = prevData.processes[processName].filter((task) => task.id !== taskId);
        return {
          ...prevData,
          processes: {
            ...prevData.processes,
            [processName]: updatedTasks,
          },
        };
      });

      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task: " + error.message);
    }
  };

  // Statistics
  const stats = {
    totalTasks: Object.values(scheduleData.processes).reduce((sum, tasks) => sum + tasks.length, 0),
    visibleTasks: getAllTasksInRange().length,
    processesWithTasks: Object.values(scheduleData.processes).filter(tasks => tasks.length > 0).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center py-8 text-red-600 text-sm">
          Error: {error}
        </div>
      </div>
    );
  }

  const hasData = Object.values(scheduleData.processes).some((tasks) => tasks.length > 0);

  if (!hasData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center py-8 text-gray-500 text-sm">
          No schedule data found. Create work schedules and payment schedules to see them here.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-8"> {/* Added pb-8 for bottom padding */}
      {/* Compact Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/supervisordash")}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go Back"
            >
              <ArrowBack size={16} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Work Schedule</h1>
              <p className="text-gray-600 text-sm">Manage project timelines and tasks</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick Stats */}
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">📊 {stats.totalTasks} tasks</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">👁️ {stats.visibleTasks} visible</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">🔄 {stats.processesWithTasks} processes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Bottom Margin */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"> {/* Added mb-6 */}
        {/* Control Bar */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Week Navigation */}
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded border">
                <button 
                  onClick={() => handleWeekChange("prev")} 
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Previous Week"
                >
                  ◀
                </button>
                <span className="text-sm font-medium min-w-[120px] text-center">
                  {format(weekStart, "MMM dd")} - {format(addDays(weekStart, 6), "MMM dd, yyyy")}
                </span>
                <button 
                  onClick={() => handleWeekChange("next")} 
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Next Week"
                >
                  ▶
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 border border-gray-300 rounded text-sm w-40 focus:ring-1 focus:ring-green-500"
                />
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1 rounded ${showFilters ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                title="Toggle Filters"
              >
                <FilterList fontSize="small" />
              </button>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
            >
              <Edit fontSize="small" />
              <span>Edit Schedule</span>
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium">Processes:</span>
                {Object.entries(filteredProcesses).map(([processName, tasks]) => (
                  <button
                    key={processName}
                    onClick={() => setSelectedProcess(processName)}
                    className={`px-2 py-1 rounded ${
                      selectedProcess === processName 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {processIcons[processName]} {tasks.length}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(100vh-240px)]"> {/* Reduced height to accommodate bottom margin */}
          {/* Sidebar - Processes & Tasks */}
          <div className="lg:w-1/4 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-3 space-y-2">
              {Object.entries(searchTerm ? filteredProcesses : scheduleData.processes).map(
                ([processName, tasks]) =>
                  tasks.length > 0 && (
                    <div key={processName} className="bg-white rounded border border-gray-200 overflow-hidden">
                      <div
                        className={`flex items-center justify-between p-2 cursor-pointer ${
                          processColors[processName]
                        } text-white font-medium text-sm`}
                        onClick={() => setSelectedProcess(processName)}
                      >
                        <span className="flex items-center gap-2">
                          {processIcons[processName]} {processName}
                        </span>
                        <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                          {tasks.length}
                        </span>
                      </div>
                      
                      {selectedProcess === processName && (
                        <div className="divide-y divide-gray-100">
                          {tasks.map((task) => {
                            const isDisabled = disabledTasks.includes(task.id);
                            return (
                              <div
                                key={task.id}
                                className={`p-2 text-xs transition ${
                                  isDisabled
                                    ? "bg-gray-100 text-gray-500 opacity-60"
                                    : selectedTask?.id === task.id
                                    ? "bg-blue-50 border-l-2 border-blue-500"
                                    : "hover:bg-gray-50"
                                }`}
                                onClick={() => !isDisabled && setSelectedTask(task)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isDisabled}
                                      onChange={(e) => {
                                        setDisabledTasks((prev) =>
                                          e.target.checked ? [...prev, task.id] : prev.filter((id) => id !== task.id),
                                        );
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-3 h-3"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate">
                                        {task.step} - {task.title}
                                      </div>
                                      {task.amount && (
                                        <div className="text-green-600 font-semibold text-xs">
                                          {task.amount}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTaskToDelete({ taskId: task.id, processName, title: task.title });
                                      setShowDeleteConfirm(true);
                                    }}
                                    className="p-1 text-red-600 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete Task"
                                  >
                                    <Delete fontSize="small" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )
              )}
            </div>
          </div>

          {/* Calendar Section */}
          <div className="lg:w-3/4 bg-white overflow-hidden mb-8">
            {/* Calendar Grid */}
            <div className="h-full overflow-auto">
              <div className="flex min-w-max">
                {/* Dates Column */}
                <div className="flex flex-col w-20 flex-shrink-0 bg-gray-50 border-r sticky left-0 z-10">
                  {days.map((day) => (
                    <div
                      key={day}
                      className="h-16 border-b border-gray-200 text-xs flex flex-col items-center justify-center p-1"
                    >
                      <div className="font-semibold">{format(day, "EEE")}</div>
                      <div className="text-gray-600">{format(day, "dd")}</div>
                    </div>
                  ))}
                </div>

                {/* Task Blocks */}
                <div className="relative flex-1 min-w-[1000px]">
                  <div className="absolute top-0 left-0 w-full h-full z-0">
                    {days.map((_, index) => (
                      <div key={index} className="border-b border-gray-200" style={{ height: "4rem" }} />
                    ))}
                  </div>

                  {getAllTasksInRange().map((task, taskIndex) => {
                    const startIdx = days.findIndex((d) => isSameDay(d, task.startDate));
                    const endIdx = days.findIndex((d) => isSameDay(d, task.endDate));
                    const rowStart = startIdx !== -1 ? startIdx : 0;
                    let rowSpan = 1;
                    if (endIdx !== -1 && endIdx >= startIdx) {
                      rowSpan = endIdx - startIdx + 1;
                    }

                    const allTasks = getAllTasksInRange();
                    const tasksOnSameRow = allTasks.filter((t) => {
                      const tStartIdx = days.findIndex((d) => isSameDay(d, t.startDate));
                      return (tStartIdx !== -1 ? tStartIdx : 0) === rowStart;
                    });
                    const taskPositionInRow = tasksOnSameRow.findIndex((t) => t.id === task.id);

                    const tasksPerRow = 4;
                    const taskWidth = 220;
                    const taskSpacing = 8;
                    const offsetLeft = taskPositionInRow * (taskWidth + taskSpacing);

                    return (
                      <div
                        key={`${task.id}-${taskIndex}`}
                        className={`absolute rounded p-2 shadow-sm text-xs border-l-4 ${
                          processColors[task.process]
                        } border-current text-white`}
                        style={{
                          top: `${rowStart * 4}rem`,
                          height: `${rowSpan * 4 - 0.25}rem`,
                          left: `${offsetLeft}px`,
                          width: `${taskWidth}px`,
                          zIndex: 10 + taskIndex,
                        }}
                      >
                        <div className="font-semibold truncate">Step {task.step}: {task.title}</div>
                        <div className="truncate text-xs opacity-90">{task.description}</div>
                        {task.amount && (
                          <div className="bg-black bg-opacity-20 rounded px-1 py-0.5 mt-1 text-xs font-semibold">
                            💰 {task.amount}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-gray-800 mb-2">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-4">
              Delete <span className="font-medium">{taskToDelete?.title}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteTask(taskToDelete.taskId, taskToDelete.processName)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ScheduleEditForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} projectId={projectId} />
    </div>
  );
};

export default SupervisorWorkSchedule;