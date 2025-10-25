import React, { useState} from 'react'
import { Button } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import { enUS } from 'date-fns/locale';
import "react-date-range/dist/styles.css"; // main style
import "react-date-range/dist/theme/default.css"; // theme css
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const ScheduleEditForm = ({ isOpen, onClose, onRegister }) => {
    const [step, setStep] = useState(1);
    const [activeSection, setActiveSection] = useState("Pre-Project Process");
    const [selectedSection, setSelectedSection] = useState("Pre-Project Process");
    const [estimatedCost, setEstimatedCost] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedRange, setSelectedRange] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: "selection"
        }
    ]);

    const [hasPickedRange, setHasPickedRange] = useState(false);


    //For adding new steps in work schedule
    const [newStepData, setNewStepData] = useState({
        title: "",
        timeFrame: "",
        startDate: "",
        endDate: "",
    });
    //For adding new steps in payment schedule
    const [newPaymentData, setPaymentData] = useState({
        title: "",
        timeFrame: "",
        payment: "",
    });
    const [sections, setSections] = useState({
        "Pre-Project Process": [],
        "Project Process": [],
        "Project Handover Process": [],
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

    const [paymentSteps, setPaymentSteps] = useState([
    ]);

    //States for adding new work schedule
    const [newStep, setNewStep] = useState({
        title: "",
        timeFrame: "",
        payment: "",
    });

    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? "" : section);
    };

    //Function for adding newstep in work schedule
    const addStep = () => {
        if (!newStep.title || !newStep.timeFrame || !newStep.startDate) return;
        setSteps({
            ...steps,
            [activeSection]: [
                ...steps[activeSection],
                { step: `Step ${steps[activeSection].length + 1}`, ...newStep },
            ],
        });
        setNewStep({ title: "", timeFrame: "", startDate: "", endDate: "", });
    };

    const [newPaymentStep, setNewPaymentStep] = useState({
        selectedStep: "", // Store the selected step
        payment: "",
    });

    // Function to add new payment step
    const addPaymentStep = () => {
        if (!newPaymentStep.selectedStep || !newPaymentStep.payment) return;

        // Find the selected step details
        const selectedStepDetails = Object.values(steps)
            .flat()
            .find((step) => step.step === newPaymentStep.selectedStep);

        if (selectedStepDetails) {
            setPaymentSteps([
                ...paymentSteps,
                {
                    ...selectedStepDetails, // Add the selected step details
                    payment: newPaymentStep.payment, // Add the entered payment
                },
            ]);

            // Clear the form
            setNewPaymentStep({ selectedStep: "", payment: "" });
        }
    };

    const handleAddStep = () => {
        if (!newStepData.title || !newStepData.timeFrame || !newStepData.startDate)
            return;
        setSections((prev) => ({
            ...prev,
            [selectedSection]: [...prev[selectedSection], { ...newStepData }],
        }));
        setNewStepData({ title: "", timeFrame: "", startDate: "", endDate: "", });
    };

    const nextStep = () => setStep((prev) => (prev < 4 ? prev + 1 : prev));
    const prevStep = () => setStep((prev) => (prev > 1 ? prev - 1 : prev));

    const formatNumber = (value) => {
        // Remove any non-numeric characters 
        let numericValue = value.replace(/[^0-9.]/g, "");

        if (numericValue) {
            // Parse the value into a float 
            let floatValue = parseFloat(numericValue).toFixed(2);
            // Format the number with commas for thousands
            return floatValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        return "";
    };
    //Dragging functions for work schedule 
    const handleInputChange = (e) => {
        const value = e.target.value;
        setEstimatedCost(value);
    };

    const handleBlur = () => {
        // Format the value 
        setEstimatedCost(formatNumber(estimatedCost));
    };

    const handleDragEnd = (result, section) => {
        if (!result.destination) return;

        const reordered = Array.from(steps[section]);
        const [removed] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, removed);

        setSteps({ ...steps, [section]: reordered });
    };

    //Dragging functions for Payment schedule 
    const handleDragPayments = (result) => {
        if (!result.destination) return; // Ensure there is a valid destination

        // Create a copy of the payment steps array
        const reordered = Array.from(paymentSteps);

        // Remove the item from its previous position
        const [removed] = reordered.splice(result.source.index, 1);

        // Insert it into the new position
        reordered.splice(result.destination.index, 0, removed);

        // Update state with the new order
        setPaymentSteps(reordered);
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-10 bg-black bg-opacity-50 flex justify-center items-center overflow-auto animate-fade-in">
                    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl">
                        {/* Step Indicator */}
                        <div className="flex justify-center items-center mb-6">
                            {[1, 2].map((num, index) => (
                                <React.Fragment key={num}>
                                    <div
                                        className={`w-8 h-8 flex items-center justify-center rounded-full text-white text-sm font-bold 
                            ${step >= num ? "bg-green-600" : "bg-gray-400"}`}
                                    >
                                        {num}
                                    </div>
        
                                    {/* Add line after the circle*/}
                                    {index < 1 && (
                                        <div
                                            className={`h-1 w-10 md:w-20 transition-all duration-300 
                            ${step > num ? "bg-green-600" : "bg-gray-300"}`}
                                        ></div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>      
                        {/* Work Schedule Section */}
                        {step === 1 && (
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
                                                {activeSection === section ? (
                                                    <ExpandLess />
                                                ) : (
                                                    <ExpandMore />
                                                )}
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
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {steps[section].map((step, index) => (
                                                                            <Draggable
                                                                                key={`${section}-${index}`}
                                                                                draggableId={`${section}-${index}`}
                                                                                index={index}
                                                                            >
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
                                                                                        <td className="border p-2">{step.startDate}</td>
                                                                                        <td className="border p-2">{step.endDate}</td>
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
                                    <div className="mt-4 flex  gap-4">
                                        <input
                                            type="text"
                                            placeholder="Title"
                                            className="border p-2 rounded-md w-1/3 text-sm"
                                            value={newStep.title}
                                            onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
                                        />
        
                                        <input
                                            type="text"
                                            readOnly
                                            value={
                                                newStep.startDate && newStep.endDate
                                                    ? `${newStep.startDate} - ${newStep.endDate} (${newStep.timeFrame})`
                                                    : "Select Duration"
                                            }
                                            className="border p-2 rounded-md cursor-pointer bg-white w-3/4 text-sm"
                                            onClick={() => setShowCalendar(!showCalendar)}
                                        />
        
                                        {showCalendar && (
                                            <div className="z-50">
                                                <DateRange
                                                    className="absolute"
                                                    editableDateInputs={true}
                                                    onChange={(item) => {
                                                        const { startDate, endDate } = item.selection;
                                                        if (startDate && endDate && startDate.getTime() !== endDate.getTime()) {
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
                                    </div>
        
                                    <input
                                        type="text"
                                        placeholder="Enter Description"
                                        className="border p-2 rounded-md w-full mt-2 text-sm"
                                    />
        
                                    <div className="flex justify-center">
                                        <button
                                            onClick={addStep}
                                            className="mt-2 bg-green-700 text-white p-2 rounded-md text-sm"
                                        >
                                            + Add New Schedule
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Payment Schedule Section */}
                        {step === 2 && (
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
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {paymentSteps.map((paymentStep, index) => (
                                                                <Draggable
                                                                    key={paymentStep.step} 
                                                                    draggableId={paymentStep.step.toString()} 
                                                                    index={index}
                                                                >
                                                                    {(provided) => (
                                                                        <tr
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps} 
                                                                            {...provided.dragHandleProps}
                                                                            className="bg-green-500 p-2 rounded-md mt-2"
                                                                        >
                                                                            <td className="border border-gray-300 p-2">
                                                                                {paymentStep.step}
                                                                            </td>
                                                                            <td className="border border-gray-300 p-2">
                                                                                {paymentStep.title}
                                                                            </td>
                                                                            <td className="border border-gray-300 p-2">
                                                                                {paymentStep.timeFrame}
                                                                            </td>
                                                                            <td className="border border-gray-300 p-2">
                                                                                {paymentStep.startDate}
                                                                            </td>
                                                                            <td className="border border-gray-300 p-2">
                                                                                {paymentStep.endDate}
                                                                            </td>
                                                                            <td className="border border-gray-300 p-2">
                                                                            {parseFloat(paymentStep.payment).toFixed(2)}
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
                                            <option value="">Select Step</option>
                                            {Object.values(steps)
                                                .flat()
                                                .map((step, index) => (
                                                    <option key={index} value={step.step}>
                                                        {step.title}
                                                    </option>
                                                ))}
                                        </select>
        
                                        <input
                                            type="text"
                                            placeholder="Payment"
                                            className="border p-2 rounded-md w-1/2 text-sm"
                                            value={newPaymentStep.payment}
                                            onBlur={handleBlur}
                                            onChange={(e) =>
                                                setNewPaymentStep({
                                                    ...newPaymentStep,
                                                    payment: e.target.value,
                                                },
                                                {handleInputChange})
                                            }
                                        />
                                    </div>
        
                                    <div className="flex justify-center text-sm">
                                        <button
                                            onClick={addPaymentStep}
                                            className="mt-2 bg-green-700 text-white p-2 rounded-md"
                                        >
                                            + Add New Payment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-6">
                            {step == 1 ? (
                                <Button onClick={onClose} variant="contained" color="success">
                                    Cancel
                                </Button>
                            ) : (
                                <Button
                                    onClick={prevStep}
                                    variant="contained"
                                    color="success"
                                    disabled={step === 3}
                                >
                                    Back
                                </Button>
                            )}
                            {step === 1 ? (
                                <Button onClick={nextStep} variant="contained" color="success">
                                    Next
                                </Button>
                            ) : (
                                <Button onClick={onClose} variant="contained" color="primary">
                                    Finish
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
    )
}

export default ScheduleEditForm
