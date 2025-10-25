"use client"

import { useState, useEffect } from "react"
import "react-date-range/dist/styles.css"
import "react-date-range/dist/theme/default.css"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

const PaymentSchedule = ({ formData = {}, updateFormData = () => {}, workScheduleSteps = {} }) => {
  const [paymentSteps, setPaymentSteps] = useState(formData.paymentSteps || [])

  // Update parent only when paymentSteps changes
  useEffect(() => {
    updateFormData({ paymentSteps })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentSteps])

  ////Payment settings states and functions//////
  const [newPaymentStep, setNewPaymentStep] = useState({
    selectedStep: "",
    paymentCents: "", // store only digits as string
  })

  const steps = workScheduleSteps

  const formatCentsAsAmount = (cents) => {
    const num = Number.parseInt(cents || "0", 10)
    return (num / 100).toFixed(2)
  }

  // Function to add new payment step
  const addPaymentStep = () => {
    if (!newPaymentStep.selectedStep || !newPaymentStep.paymentCents) return

    const selectedStepDetails = Object.values(steps)
      .flat()
      .find((step) => {
        // Create unique identifier for comparison
        const stepIdentifier = `${step.step}-${step.title}`
        return stepIdentifier === newPaymentStep.selectedStep
      })

    if (selectedStepDetails) {
      const formattedPayment = Number.parseFloat(formatCentsAsAmount(newPaymentStep.paymentCents))

      const newPaymentStepData = {
        ...selectedStepDetails,
        payment: formattedPayment, // Store float value like 1000.00
        paymentId: `${selectedStepDetails.step}-${Date.now()}`, // Unique identifier for this payment
      }

      setPaymentSteps([...paymentSteps, newPaymentStepData])

      // Clear the form
      setNewPaymentStep({ selectedStep: "", paymentCents: "" })
    }
  }

  const formatNumber = (value) => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/[^0-9.]/g, "")

    if (numericValue) {
      // Parse the value into a float
      const floatValue = Number.parseFloat(numericValue).toFixed(2)
      // Format the number with commas for thousands
      return floatValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }
    return ""
  }

  //Dragging functions for Payment schedule
  const handleDragPayments = (result) => {
    if (!result.destination) return // Ensure there is a valid destination

    // Create a copy of the payment steps array
    const reordered = Array.from(paymentSteps)

    // Remove the item from its previous position
    const [removed] = reordered.splice(result.source.index, 1)

    // Insert it into the new position
    reordered.splice(result.destination.index, 0, removed)

    // Update state with the new order
    setPaymentSteps(reordered)
  }

  // Function to remove payment step
  const removePaymentStep = (index) => {
    const updatedPaymentSteps = paymentSteps.filter((_, i) => i !== index)
    setPaymentSteps(updatedPaymentSteps)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Payment Schedule</h2>
      <div className="bg-green-100 p-4 rounded-lg shadow">
        {/* Displaying Payment Steps Table */}
        <div className="mt-4">
          <DragDropContext onDragEnd={handleDragPayments}>
            <Droppable droppableId="paymentSteps">
              {(provided) => (
                <table
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="w-full border-collapse border border-gray-300 text-center text-sm"
                >
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-2">Step</th>
                      <th className="border border-gray-300 p-2">Title</th>
                      <th className="border border-gray-300 p-2">Time Frame</th>
                      <th className="border border-gray-300 p-2">Start Date</th>
                      <th className="border border-gray-300 p-2">End Date</th>
                      <th className="border border-gray-300 p-2">Payment</th>
                      <th className="border border-gray-300 p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentSteps.map((paymentStep, index) => (
                      <Draggable
                        key={paymentStep.paymentId || `${paymentStep.step}-${index}`}
                        draggableId={paymentStep.paymentId || `${paymentStep.step}-${index}`}
                        index={index}
                      >
                        {(provided) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-green-500 p-2 rounded-md mt-2"
                          >
                            <td className="border border-gray-300 p-2">{paymentStep.step}</td>
                            <td className="border border-gray-300 p-2">{paymentStep.title}</td>
                            <td className="border border-gray-300 p-2">{paymentStep.timeFrame}</td>
                            <td className="border border-gray-300 p-2">{paymentStep.startDate}</td>
                            <td className="border border-gray-300 p-2">{paymentStep.endDate}</td>
                            <td className="border border-gray-300 p-2">
                              {Number.parseFloat(paymentStep.payment).toFixed(2)}
                            </td>
                            <td className="border border-gray-300 p-2">
                              <button
                                onClick={() => removePaymentStep(index)}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    ))}
                  </tbody>
                </table>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        <div className="mt-4 flex gap-4">
          <select
            value={newPaymentStep.selectedStep}
            onChange={(e) =>
              setNewPaymentStep({
                ...newPaymentStep,
                selectedStep: e.target.value,
              })
            }
            className="border p-2 rounded-md w-1/2 text-sm"
          >
            <option value="">Select Work Schedule</option>
            {Object.values(steps)
              .flat()
              .map((step, index) => {
                const stepIdentifier = `${step.step}-${step.title}`
                return (
                  <option key={`${step.step}-${index}`} value={stepIdentifier}>
                    {step.step} - {step.title}
                  </option>
                )
              })}
          </select>
          <input
            type="text"
            placeholder="Payment Amount"
            className="border p-2 rounded-md w-1/2 text-sm"
            value={formatCentsAsAmount(newPaymentStep.paymentCents)}
            onChange={(e) => {
              const rawDigits = e.target.value.replace(/\D/g, "") // Only numbers
              setNewPaymentStep({
                ...newPaymentStep,
                paymentCents: rawDigits,
              })
            }}
          />
        </div>

        <div className="flex justify-center text-sm">
          <button onClick={addPaymentStep} className="mt-2 bg-green-700 text-white p-2 rounded-md">
            + Add New Payment
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentSchedule
