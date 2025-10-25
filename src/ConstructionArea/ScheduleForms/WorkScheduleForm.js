// WorkScheduleForm.js - Fixed version
"use client"

import { useState, useEffect } from "react"
import { enUS } from "date-fns/locale"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Delete, Edit } from "@mui/icons-material"
import { red } from "@mui/material/colors"
import { ExpandMore, ExpandLess } from "@mui/icons-material"
import { DateRange } from "react-date-range"

const WorkScheduleForm = ({ formData = {}, updateFormData = () => {} }) => {
  const [activeSection, setActiveSection] = useState("Pre-Project Process")
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedRange, setSelectedRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ])

  const [steps, setSteps] = useState(
    formData.steps || {
      "Pre-Project Process": [],
      "Project Process": [],
      "Project Handover Process": [],
    },
  )

  useEffect(() => {
    updateFormData({ steps })
  }, [steps, updateFormData])

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? "" : section)
  }

  // States for adding new work schedule
  const [newStep, setNewStep] = useState({
    title: "",
    timeFrame: "",
    workDescription: "",
    startDate: null,
    endDate: null,
  })

  // Function for adding new step in work schedule
  const addStep = () => {
    if (!newStep.title || !newStep.timeFrame || !newStep.startDate || !newStep.endDate) {
      alert("Please fill all required fields: Title, Time Frame, and Date Range")
      return
    }

    const stepNumber = steps[activeSection].length + 1
    const updatedSteps = {
      ...steps,
      [activeSection]: [
        ...steps[activeSection], 
        { 
          step: `Step ${stepNumber}`, 
          title: newStep.title,
          timeFrame: newStep.timeFrame,
          workDescription: newStep.workDescription,
          startDate: newStep.startDate.toISOString(), // Convert to ISO string for backend
          endDate: newStep.endDate.toISOString(), // Convert to ISO string for backend
        }
      ],
    }

    setSteps(updatedSteps)
    setNewStep({ 
      title: "", 
      timeFrame: "", 
      workDescription: "", 
      startDate: null, 
      endDate: null 
    })
    setSelectedRange([{ startDate: new Date(), endDate: new Date(), key: "selection" }])
  }

  const handleDragEnd = (result, section) => {
    if (!result.destination) return

    const reordered = Array.from(steps[section])
    const [removed] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, removed)

    setSteps({ ...steps, [section]: reordered })
  }

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Work Schedule</h2>
      <div className="bg-green-100 p-4 rounded-lg shadow">
        {Object.keys(steps).map((section) => (
          <div key={section} className="mt-4">
            <div
              className="flex justify-between bg-gray-300 p-2 cursor-pointer rounded-md"
              onClick={() => toggleSection(section)}
            >
              <span>{section}</span>
              {activeSection === section ? <ExpandLess /> : <ExpandMore />}
            </div>
            {activeSection === section && (
              <div className="bg-green-100 p-4 rounded-md">
                <DragDropContext onDragEnd={(result) => handleDragEnd(result, section)}>
                  <Droppable droppableId={section}>
                    {(provided) => (
                      <table
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="w-full border-collapse border border-gray-300 text-center text-sm"
                      >
                        <thead>
                          <tr>
                            <th className="border p-2">Step</th>
                            <th className="border p-2">Title</th>
                            <th className="border p-2">Time Frame</th>
                            <th className="border p-2">Start Date</th>
                            <th className="border p-2">End Date</th>
                            <th className="border p-2">Description</th>
                            <th className="border p-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {steps[section].map((step, index) => (
                            <Draggable key={`${section}-${index}`} draggableId={`${section}-${index}`} index={index}>
                              {(provided) => (
                                <tr
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="bg-green-500"
                                >
                                  <td className="border p-2">{step.step}</td>
                                  <td className="border p-2">{step.title}</td>
                                  <td className="border p-2">{step.timeFrame}</td>
                                  <td className="border p-2">{formatDateForDisplay(step.startDate)}</td>
                                  <td className="border p-2">{formatDateForDisplay(step.endDate)}</td>
                                  <td className="border p-2">{step.workDescription || "-"}</td>
                                  <td className="border p-2 flex justify-center items-center">
                                    <Edit className="cursor-pointer" />
                                    <Delete className="cursor-pointer ml-2" style={{ color: red[500] }} />
                                  </td>
                                </tr>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </tbody>
                      </table>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}
          </div>
        ))}
        
        <div className="mt-4">
          <h3 className="font-medium mb-2">Add New Step to {activeSection}</h3>
          
          <div className="flex gap-4 mb-2">
            <input
              type="text"
              placeholder="Title *"
              className="border p-2 rounded-md w-1/2 text-sm"
              value={newStep.title}
              onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
            />

            <input
              type="text"
              readOnly
              value={
                newStep.startDate && newStep.endDate
                  ? `${formatDateForDisplay(newStep.startDate)} - ${formatDateForDisplay(newStep.endDate)} (${newStep.timeFrame})`
                  : "Select Duration *"
              }
              className="border p-2 rounded-md cursor-pointer bg-white w-1/2 text-sm"
              onClick={() => setShowCalendar(!showCalendar)}
            />
          </div>

          {showCalendar && (
            <div className="relative z-50 mb-2">
              <DateRange
                editableDateInputs={true}
                onChange={(item) => {
                  const { startDate, endDate } = item.selection
                  if (startDate && endDate) {
                    const diffTime = Math.abs(endDate - startDate)
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

                    setNewStep({
                      ...newStep,
                      startDate: startDate,
                      endDate: endDate,
                      timeFrame: `${diffDays} Day${diffDays > 1 ? 's' : ''}`,
                    })

                    setSelectedRange([item.selection])
                  }
                }}
                moveRangeOnFirstSelection={false}
                ranges={selectedRange}
                locale={enUS}
                rangeColors={["#22c55e"]}
              />
              <button 
                className="mt-2 bg-gray-200 px-3 py-1 rounded text-sm"
                onClick={() => setShowCalendar(false)}
              >
                Close Calendar
              </button>
            </div>
          )}

          <input
            type="text"
            placeholder="Work Description (Optional)"
            value={newStep.workDescription}
            onChange={(e) => setNewStep({ ...newStep, workDescription: e.target.value })}
            className="border p-2 rounded-md w-full text-sm mb-2"
          />

          <div className="flex justify-center">
            <button onClick={addStep} className="bg-green-700 text-white p-2 rounded-md text-sm">
              + Add New Schedule Step
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkScheduleForm