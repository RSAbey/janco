"use client"

import { useState, useEffect } from "react"
import { format, addWeeks, startOfWeek, eachDayOfInterval, addDays, isSameDay } from "date-fns"
import { Delete } from "@mui/icons-material"
import ConfirmPasswordModal from "../components/ConfirmPasswordModal"
import ScheduleEditForm from "./EditForms/ScheduleEditForm"
import workScheduleService from "../services/workScheduleService"
import paymentScheduleService from "../services/paymentScheduleService"

const processColors = {
  "Pre-Project Process": "bg-green-400",
  "Project Process": "bg-secondary-pale",
  "Project Handover Process": "bg-purple-200",
}

const ConstructionScheduler = ({ projectId }) => {
  const [scheduleData, setScheduleData] = useState({
    durationWeeks: 3,
    processes: {
      "Pre-Project Process": [],
      "Project Process": [],
      "Project Handover Process": [],
    },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedProcess, setSelectedProcess] = useState("Pre-Project Process")
  const [selectedTask, setSelectedTask] = useState(null)
  const [disabledTasks, setDisabledTasks] = useState([])
  const [currentWeek, setCurrentWeek] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [askPassword, setAskPassword] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!projectId) {
        setError("No project ID provided")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log("[v0] Fetching schedule data for project:", projectId)

        // Fetch work schedules for this project
        const workSchedules = await workScheduleService.getWorkSchedules({
          projectId: projectId,
        })

        // Fetch payment schedules for this project
        const paymentSchedules = await paymentScheduleService.getPaymentSchedules({
          projectId: projectId,
        })

        console.log("[v0] Fetched work schedules:", workSchedules)
        console.log("[v0] Fetched payment schedules:", paymentSchedules)

        // Transform the data to match the expected format
        const transformedData = {
          durationWeeks: 3,
          processes: {
            "Pre-Project Process": [],
            "Project Process": [],
            "Project Handover Process": [],
          },
        }

        const completedTaskIds = []

        // Process work schedules
        if (workSchedules && workSchedules.length > 0) {
          workSchedules.forEach((schedule, index) => {
            // Find corresponding payment schedule by matching both section and step
            console.log(`[v0] Processing work schedule ${index + 1}:`, {
              id: schedule._id,
              title: schedule.title,
              step: schedule.step,
              section: schedule.section,
            })

            console.log(
              `[v0] Available payment schedules:`,
              paymentSchedules?.map((ps) => ({
                id: ps._id,
                workSchedule: ps.workSchedule,
                step: ps.step,
                section: ps.section,
                amount: ps.paymentAmount,
              })),
            )

            // Find corresponding payment schedule with multiple fallback strategies
            let paymentSchedule = null

            // First try: exact workSchedule ID match
            if (paymentSchedules) {
              paymentSchedule = paymentSchedules.find((ps) => ps.workSchedule === schedule._id)
              console.log(
                `[v0] ID match result:`,
                paymentSchedule ? `Found: $${paymentSchedule.paymentAmount}` : "Not found",
              )

              // Second try: match by step and section
              if (!paymentSchedule) {
                paymentSchedule = paymentSchedules.find(
                  (ps) => ps.step === schedule.step && ps.section === schedule.section,
                )
                console.log(
                  `[v0] Step+Section match result:`,
                  paymentSchedule ? `Found: $${paymentSchedule.paymentAmount}` : "Not found",
                )
              }

              // Third try: match by step only
              if (!paymentSchedule) {
                paymentSchedule = paymentSchedules.find((ps) => ps.step === schedule.step)
                console.log(
                  `[v0] Step-only match result:`,
                  paymentSchedule ? `Found: $${paymentSchedule.paymentAmount}` : "Not found",
                )
              }

              // Fourth try: match by title similarity
              if (!paymentSchedule) {
                paymentSchedule = paymentSchedules.find(
                  (ps) => ps.title && schedule.title && ps.title.toLowerCase().includes(schedule.title.toLowerCase()),
                )
                console.log(
                  `[v0] Title match result:`,
                  paymentSchedule ? `Found: $${paymentSchedule.paymentAmount}` : "Not found",
                )
              }
            }

            const uniqueId = `${schedule._id}-${index}`

            const taskData = {
              id: uniqueId,
              originalId: schedule._id, // Keep original ID for API calls
              title: schedule.title,
              description: schedule.workDescription || "No description",
              duration: schedule.timeFrame,
              startDate: new Date(schedule.startDate),
              endDate: new Date(schedule.endDate),
              amount: paymentSchedule ? `$${paymentSchedule.paymentAmount}` : null,
              step: schedule.step,
              section: schedule.section,
              status: schedule.status, // Include status from backend
            }

            if (schedule.status === "completed") {
              completedTaskIds.push(uniqueId)
            }

            console.log(`[v0] Final task data:`, {
              title: taskData.title,
              amount: taskData.amount,
              step: taskData.step,
              section: taskData.section,
              status: taskData.status,
            })

            // Categorize by section
            if (schedule.section && transformedData.processes[schedule.section]) {
              transformedData.processes[schedule.section].push(taskData)
            } else {
              // Default to Project Process if section not recognized
              transformedData.processes["Project Process"].push(taskData)
            }
          })
        }

        setScheduleData(transformedData)
        setDisabledTasks(completedTaskIds)
        setError(null)
      } catch (err) {
        console.error("[v0] Error fetching schedule data:", err)
        setError(err.message || "Failed to fetch schedule data")
      } finally {
        setLoading(false)
      }
    }

    fetchScheduleData()
  }, [projectId])

  const getProjectStartDate = () => {
    const allTasks = Object.values(scheduleData.processes).flat()
    if (allTasks.length === 0) {
      return new Date() // Default to today if no tasks
    }

    const earliestDate = allTasks.reduce((earliest, task) => {
      return task.startDate < earliest ? task.startDate : earliest
    }, allTasks[0].startDate)

    return startOfWeek(earliestDate, { weekStartsOn: 1 })
  }

  const projectStart = getProjectStartDate()
  const weekStart = addWeeks(projectStart, currentWeek)
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })

  const handleWeekChange = (direction) => {
    setCurrentWeek((prev) => (direction === "next" ? prev + 1 : prev - 1))
  }

  const getAllTasksInRange = () => {
    const tasks = []
    console.log(
      "[v0] Getting tasks in range for week:",
      format(weekStart, "MMM dd yyyy"),
      "to",
      format(addDays(weekStart, 6), "MMM dd yyyy"),
    )

    Object.entries(scheduleData.processes).forEach(([processName, taskList]) => {
      taskList.forEach((task) => {
        // Check if task overlaps with current week
        const taskStartDate = new Date(task.startDate)
        const taskEndDate = new Date(task.endDate)
        const weekEndDate = addDays(weekStart, 6)

        // Task overlaps if it starts before week ends AND ends after week starts
        const overlaps = taskStartDate <= weekEndDate && taskEndDate >= weekStart

        console.log(`[v0] Task ${task.title}:`, {
          startDate: format(taskStartDate, "EEE MMM dd yyyy"),
          endDate: format(taskEndDate, "EEE MMM dd yyyy"),
          weekStart: format(weekStart, "EEE MMM dd yyyy"),
          weekEnd: format(weekEndDate, "EEE MMM dd yyyy"),
          overlaps: overlaps,
        })

        if (overlaps) {
          console.log(`[v0] Adding task ${task.title} to calendar`)
          tasks.push({ ...task, process: processName })
        }
      })
    })

    console.log(
      "[v0] getAllTasksInRange returning:",
      tasks.length,
      "tasks:",
      tasks.map((t) => ({ id: t.id, title: t.title, process: t.process })),
    )
    return tasks
  }

  const deleteTask = async (taskId, processName) => {
    try {
      const originalId = taskId.includes("-") ? taskId.split("-")[0] : taskId
      await workScheduleService.deleteWorkSchedule(originalId)

      // Update local state
      setScheduleData((prevData) => {
        const updatedTasks = prevData.processes[processName].filter((task) => task.id !== taskId)
        return {
          ...prevData,
          processes: {
            ...prevData.processes,
            [processName]: updatedTasks,
          },
        }
      })

      setShowDeleteConfirm(false)
      setTaskToDelete(null)
    } catch (error) {
      console.error("[v0] Error deleting task:", error)
      alert("Failed to delete task: " + error.message)
    }
  }

  const requestDeleteTask = (task) => {
    setTaskToDelete(task)
    setAskPassword(true)
  }

  const handleTaskCompletion = async (taskId, isCompleted) => {
    try {
      const originalId = taskId.includes("-") ? taskId.split("-")[0] : taskId

      // Update task status in backend
      await workScheduleService.updateWorkSchedule(originalId, {
        status: isCompleted ? "completed" : "pending",
      })

      // Update local state
      setDisabledTasks((prev) => (isCompleted ? [...prev, taskId] : prev.filter((id) => id !== taskId)))

      setScheduleData((prevData) => {
        const updatedProcesses = { ...prevData.processes }
        Object.keys(updatedProcesses).forEach((processName) => {
          updatedProcesses[processName] = updatedProcesses[processName].map((task) =>
            task.id === taskId ? { ...task, status: isCompleted ? "completed" : "pending" } : task,
          )
        })
        return {
          ...prevData,
          processes: updatedProcesses,
        }
      })

      console.log("[v0] Task completion status updated:", { taskId, isCompleted })
    } catch (error) {
      console.error("[v0] Error updating task completion:", error)
      alert("Failed to update task status: " + error.message)
      // Revert the checkbox state on error
      setDisabledTasks((prev) => (isCompleted ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading schedule data...</div>
      </div>
    )
  }

  const onPasswordVerified = async () => {
    if (!taskToDelete) return
    await deleteTask(taskToDelete.taskId, taskToDelete.processName)
    setAskPassword(false)
    setTaskToDelete(null)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  // Check if there's any data to display
  const hasData = Object.values(scheduleData.processes).some((tasks) => tasks.length > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-lg mb-2">No schedule data found</div>
          <div className="text-gray-600">Create work schedules and payment schedules to see them here.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-full">
      {/* Sidebar Process & Tasks */}
      <div className="w-1/4  h-full mt-2 border-gray-300 p-2 overflow-y-auto bg-gray-100">
        {Object.entries(scheduleData.processes).map(
          ([processName, tasks]) =>
            tasks.length > 0 && (
              <div key={processName} className="mb-2">
                <div
                  className="w-full bg-green-700 text-white font-semibold px-4 py-2 rounded cursor-pointer"
                  onClick={() => setSelectedProcess(processName)}
                >
                  {processName} ({tasks.length})
                </div>
                {selectedProcess === processName && (
                  <div className="bg-green-100 mt-1 rounded divide-y divide-green-200">
                    {tasks.map((task) => {
                      const isDisabled = disabledTasks.includes(task.id)
                      return (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                            isDisabled
                              ? "bg-gray-300 text-gray-600 cursor-not-allowed opacity-60"
                              : selectedTask?.id === task.id
                                ? "bg-green-300"
                                : ""
                          }`}
                          onClick={() => {
                            if (!isDisabled) setSelectedTask(task)
                          }}
                        >
                          <label className="flex items-center space-x-2 w-full">
                            <input
                              type="checkbox"
                              checked={isDisabled}
                              onChange={(e) => {
                                handleTaskCompletion(task.id, e.target.checked)
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="truncate">
                              {task.step} - {task.title}
                            </span>
                          </label>
                          <Delete
                            onClick={(e) => {
                              e.stopPropagation()
                              setTaskToDelete({ taskId: task.id, processName, title: task.title })
                              setShowDeleteConfirm(true)
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ),
        )}
        <div className="px-2">
          <button
            className="bg-green-800 text-white mt-4 px-4 py-2 rounded w-full"
            onClick={() => setIsModalOpen(true)}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="w-3/4 h-full bg-gray-100 m-2">
        {/* Week Navigation */}
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-300 bg-gray-100">
          <button onClick={() => handleWeekChange("prev")} className="text-xl">
            ❮
          </button>
          <h2 className="text-md font-semibold">
            {format(weekStart, "MMMM d")} - {format(addDays(weekStart, 6), "MMMM d, yyyy")}
          </h2>
          <button onClick={() => handleWeekChange("next")} className="text-xl">
            ❯
          </button>
        </div>

        {/* Scrollable Calendar Grid */}
        <div className="overflow-auto h-[700px]">
          <div className="flex w-[1500px]">
            {/* Vertical Dates Column */}
            <div className="flex flex-col w-24 flex-shrink-0 bg-white border-r sticky left-0 z-10">
              {days.map((day) => (
                <div
                  key={day}
                  className="h-28 border-b border-gray-300 text-sm flex items-center justify-center bg-gray-100 font-semibold"
                >
                  {format(day, "EEE dd")}
                </div>
              ))}
            </div>

            {/* Task Blocks per Process */}
            <div className="relative flex-1 min-w-[1300px]">
              <div className="absolute top-0 left-0 w-full h-full z-0">
                {days.map((_, index) => (
                  <div key={index} className="border-b border-gray-300" style={{ height: "7rem" }} />
                ))}
              </div>

              {getAllTasksInRange().map((task, taskIndex) => {
                const startIdx = days.findIndex((d) => isSameDay(d, task.startDate))
                const endIdx = days.findIndex((d) => isSameDay(d, task.endDate))

                // If task is outside current week, position it at the appropriate edge
                const rowStart = startIdx !== -1 ? startIdx : 0
                let rowSpan = 1
                if (endIdx !== -1 && endIdx >= startIdx) {
                  rowSpan = endIdx - startIdx + 1
                }

                // Group tasks by their row position to calculate proper column positioning
                const allTasks = getAllTasksInRange()
                const tasksOnSameRow = allTasks.filter((t) => {
                  const tStartIdx = days.findIndex((d) => isSameDay(d, t.startDate))
                  return (tStartIdx !== -1 ? tStartIdx : 0) === rowStart
                })
                const taskPositionInRow = tasksOnSameRow.findIndex((t) => t.id === task.id)

                const tasksPerRow = 4 // Maximum tasks per row
                const taskWidth = 280
                const taskSpacing = 10
                const offsetLeft = taskPositionInRow * (taskWidth + taskSpacing)

                console.log(
                  `[v0] Rendering Task ${taskIndex + 1}/${allTasks.length}: ${task.title}`,
                  `| ID: ${task.id}`,
                  `| Process: ${task.process}`,
                  `| rowStart: ${rowStart}`,
                  `| rowSpan: ${rowSpan}`,
                  `| taskPositionInRow: ${taskPositionInRow}`,
                  `| offsetLeft: ${offsetLeft}px`,
                  `| tasksOnSameRow: ${tasksOnSameRow.length}`,
                  `| startDate: ${task.startDate}`,
                  `| endDate: ${task.endDate}`,
                )

                return (
                  <div
                    key={`${task.id}-${task.process}-${taskIndex}`}
                    className={`flex flex-col justify-between text-center absolute rounded p-3 shadow-md text-sm text-black opacity-85 ${
                      processColors[task.process]
                    } ${disabledTasks.includes(task.id) ? "opacity-50 grayscale" : ""}`}
                    style={{
                      top: `${rowStart * 7}rem`,
                      height: `${rowSpan * 7}rem`,
                      left: `${offsetLeft}px`,
                      width: `${taskWidth}px`,
                      zIndex: 10 + taskIndex, // Ensure proper stacking order
                    }}
                  >
                    <div className="font-semibold">{task.process}</div>
                    <div className="font-semibold">
                      Step {task.step} - {task.title}
                    </div>
                    <div className="text-xs">{task.description}</div>
                    {task.amount && (
                      <div className="bg-red-700 rounded-md shadow-md p-2 text-white text-sm font-semibold mt-1">
                        Amount: {task.amount}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 sm:mx-0 animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Deletion</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-medium text-red-600">{taskToDelete?.title}</span>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setTaskToDelete(null)
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteTask(taskToDelete.taskId, taskToDelete.processName)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <ScheduleEditForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} projectId={projectId} />

      {/* Confirm password modal */}
      <ConfirmPasswordModal
        isOpen={askPassword}
        onClose={() => setAskPassword(false)}
        onSuccess={onPasswordVerified}
        title="Confirm Delete"
      />
    </div>
    )
}
export default ConstructionScheduler
