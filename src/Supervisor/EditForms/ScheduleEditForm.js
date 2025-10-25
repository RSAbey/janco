import React, { useState } from 'react'
import { Button } from "@mui/material";
import { ExpandMore, ExpandLess, Add, CalendarToday } from "@mui/icons-material";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import { enUS } from 'date-fns/locale';
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const ScheduleEditForm = ({ isOpen, onClose, onRegister }) => {
    const [step, setStep] = useState(1);
    const [activeSection, setActiveSection] = useState("Pre-Project Process");
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedRange, setSelectedRange] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: "selection"
        }
    ]);

    // For adding new steps in work schedule
    const [newStep, setNewStep] = useState({
        title: "",
        timeFrame: "",
        startDate: "",
        endDate: "",
    });

    // For adding new steps in payment schedule
    const [newPaymentStep, setNewPaymentStep] = useState({
        selectedStep: "",
        payment: "",
    });

    const [steps, setSteps] = useState({
        "Pre-Project Process": [
            {
                step: "Step 01",
                title: "Arrange Meeting with Client",
                timeFrame: "01 Days",
                startDate: "2024-12-14",
                endDate: "2024-12-16",
            },
            {
                step: "Step 02",
                title: "Arrange Documents for Project",
                timeFrame: "03 Days",
                startDate: "2024-12-16",
                endDate: "2024-12-18",
            },
        ],
        "Project Process": [],
        "Project Handover Process": [],
    });

    const [paymentSteps, setPaymentSteps] = useState([]);

    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? "" : section);
    };

    // Function for adding new step in work schedule
    const addStep = () => {
        if (!newStep.title || !newStep.timeFrame || !newStep.startDate) return;
        setSteps({
            ...steps,
            [activeSection]: [
                ...steps[activeSection],
                { step: `Step ${steps[activeSection].length + 1}`, ...newStep },
            ],
        });
        setNewStep({ title: "", timeFrame: "", startDate: "", endDate: "" });
    };

    // Function to add new payment step
    const addPaymentStep = () => {
        if (!newPaymentStep.selectedStep || !newPaymentStep.payment) return;

        const selectedStepDetails = Object.values(steps)
            .flat()
            .find((step) => step.step === newPaymentStep.selectedStep);

        if (selectedStepDetails) {
            setPaymentSteps([
                ...paymentSteps,
                {
                    ...selectedStepDetails,
                    payment: newPaymentStep.payment,
                },
            ]);
            setNewPaymentStep({ selectedStep: "", payment: "" });
        }
    };

    const nextStep = () => setStep((prev) => (prev < 2 ? prev + 1 : prev));
    const prevStep = () => setStep((prev) => (prev > 1 ? prev - 1 : prev));

    const formatNumber = (value) => {
        let numericValue = value.replace(/[^0-9.]/g, "");
        if (numericValue) {
            let floatValue = parseFloat(numericValue).toFixed(2);
            return floatValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        return "";
    };

    // Dragging functions for work schedule 
    const handleDragEnd = (result, section) => {
        if (!result.destination) return;
        const reordered = Array.from(steps[section]);
        const [removed] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, removed);
        setSteps({ ...steps, [section]: reordered });
    };

    // Dragging functions for Payment schedule 
    const handleDragPayments = (result) => {
        if (!result.destination) return;
        const reordered = Array.from(paymentSteps);
        const [removed] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, removed);
        setPaymentSteps(reordered);
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setNewPaymentStep({
            ...newPaymentStep,
            payment: value,
        });
    };

    const handleBlur = () => {
        setNewPaymentStep({
            ...newPaymentStep,
            payment: formatNumber(newPaymentStep.payment),
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">
                            {step === 1 ? "Work Schedule" : "Payment Schedule"}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 p-1 rounded"
                        >
                            ✕
                        </button>
                    </div>
                    
                    {/* Step Indicator */}
                    <div className="flex justify-center items-center mt-2">
                        {[1, 2].map((num, index) => (
                            <React.Fragment key={num}>
                                <div
                                    className={`w-6 h-6 flex items-center justify-center rounded-full text-white text-xs font-bold 
                                        ${step >= num ? "bg-green-600" : "bg-gray-400"}`}
                                >
                                    {num}
                                </div>
                                {index < 1 && (
                                    <div
                                        className={`h-1 w-8 transition-all duration-300 
                                            ${step > num ? "bg-green-600" : "bg-gray-300"}`}
                                    ></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {/* Work Schedule Section */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="bg-green-50 rounded-lg border border-green-200">
                                {Object.keys(steps).map((section) => (
                                    <div key={section} className="mb-3 last:mb-0">
                                        <div
                                            className="flex justify-between items-center p-3 cursor-pointer bg-green-100 hover:bg-green-200 rounded-t-lg"
                                            onClick={() => toggleSection(section)}
                                        >
                                            <span className="font-medium text-sm">{section}</span>
                                            {activeSection === section ? <ExpandLess /> : <ExpandMore />}
                                        </div>
                                        {activeSection === section && (
                                            <div className="p-3">
                                                <DragDropContext onDragEnd={(result) => handleDragEnd(result, section)}>
                                                    <Droppable droppableId={section}>
                                                        {(provided) => (
                                                            <div
                                                                {...provided.droppableProps}
                                                                ref={provided.innerRef}
                                                                className="space-y-2"
                                                            >
                                                                {steps[section].map((stepItem, index) => (
                                                                    <Draggable
                                                                        key={`${section}-${index}`}
                                                                        draggableId={`${section}-${index}`}
                                                                        index={index}
                                                                    >
                                                                        {(provided) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                {...provided.dragHandleProps}
                                                                                className="bg-white p-3 rounded border border-green-300 text-xs"
                                                                            >
                                                                                <div className="grid grid-cols-4 gap-2 items-center">
                                                                                    <div className="font-semibold text-green-700">{stepItem.step}</div>
                                                                                    <div className="col-span-2 truncate">{stepItem.title}</div>
                                                                                    <div className="text-right">
                                                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                                                                            {stepItem.timeFrame}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-gray-600 text-xs mt-1">
                                                                                    {stepItem.startDate} - {stepItem.endDate}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                ))}
                                                                {provided.placeholder}
                                                            </div>
                                                        )}
                                                    </Droppable>
                                                </DragDropContext>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Add New Step Form */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                    <input
                                        type="text"
                                        placeholder="Title"
                                        className="border border-gray-300 p-2 rounded text-sm focus:ring-1 focus:ring-green-500"
                                        value={newStep.title}
                                        onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
                                    />
                                    
                                    <div className="relative">
                                        <input
                                            type="text"
                                            readOnly
                                            value={
                                                newStep.startDate && newStep.endDate
                                                    ? `${format(new Date(newStep.startDate), 'MMM dd')} - ${format(new Date(newStep.endDate), 'MMM dd')}`
                                                    : "Select Duration"
                                            }
                                            className="border border-gray-300 p-2 rounded text-sm w-full cursor-pointer bg-white focus:ring-1 focus:ring-green-500"
                                            onClick={() => setShowCalendar(!showCalendar)}
                                        />
                                        <CalendarToday className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" fontSize="small" />
                                    </div>

                                    <input
                                        type="text"
                                        placeholder="Description"
                                        className="border border-gray-300 p-2 rounded text-sm focus:ring-1 focus:ring-green-500"
                                    />
                                </div>

                                {showCalendar && (
                                    <div className="absolute z-10 bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                        <DateRange
                                            editableDateInputs={true}
                                            onChange={(item) => {
                                                const { startDate, endDate } = item.selection;
                                                if (startDate && endDate) {
                                                    const diffTime = Math.abs(endDate - startDate);
                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                                                    setNewStep({
                                                        ...newStep,
                                                        startDate: startDate.toISOString().split("T")[0],
                                                        endDate: endDate.toISOString().split("T")[0],
                                                        timeFrame: `${diffDays} Days`,
                                                    });
                                                    setShowCalendar(false);
                                                }
                                                setSelectedRange([item.selection]);
                                            }}
                                            moveRangeOnFirstSelection={false}
                                            ranges={selectedRange}
                                            locale={enUS}
                                            rangeColors={["#22c55e"]}
                                        />
                                    </div>
                                )}

                                <button
                                    onClick={addStep}
                                    className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-1 w-full justify-center"
                                >
                                    <Add fontSize="small" />
                                    Add New Schedule
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Payment Schedule Section */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 rounded-lg border border-blue-200">
                                <DragDropContext onDragEnd={handleDragPayments}>
                                    <Droppable droppableId="paymentSteps">
                                        {(provided) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className="space-y-2 p-3"
                                            >
                                                {paymentSteps.map((paymentStep, index) => (
                                                    <Draggable
                                                        key={paymentStep.step}
                                                        draggableId={paymentStep.step.toString()}
                                                        index={index}
                                                    >
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className="bg-white p-3 rounded border border-blue-300 text-xs"
                                                            >
                                                                <div className="grid grid-cols-3 gap-2 items-center">
                                                                    <div>
                                                                        <div className="font-semibold text-blue-700">{paymentStep.step}</div>
                                                                        <div className="text-gray-600 truncate">{paymentStep.title}</div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                                            {paymentStep.timeFrame}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                                                                            ${parseFloat(paymentStep.payment).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            </div>

                            {/* Add New Payment Form */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <select
                                        value={newPaymentStep.selectedStep}
                                        onChange={(e) => setNewPaymentStep({ ...newPaymentStep, selectedStep: e.target.value })}
                                        className="border border-gray-300 p-2 rounded text-sm focus:ring-1 focus:ring-green-500"
                                    >
                                        <option value="">Select Step</option>
                                        {Object.values(steps).flat().map((step, index) => (
                                            <option key={index} value={step.step}>
                                                {step.step} - {step.title}
                                            </option>
                                        ))}
                                    </select>

                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                        <input
                                            type="text"
                                            placeholder="Payment Amount"
                                            className="border border-gray-300 p-2 rounded text-sm w-full pl-8 focus:ring-1 focus:ring-green-500"
                                            value={newPaymentStep.payment}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={addPaymentStep}
                                    className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-1 w-full justify-center"
                                >
                                    <Add fontSize="small" />
                                    Add New Payment
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        {step === 1 ? (
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                            >
                                Cancel
                            </button>
                        ) : (
                            <button
                                onClick={prevStep}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                            >
                                Back
                            </button>
                        )}
                        
                        {step === 1 ? (
                            <button
                                onClick={nextStep}
                                className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                                Finish
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ScheduleEditForm;