import React, { useState, useEffect } from "react";
import { Button } from "@mui/material";
import { green } from "@mui/material/colors";
import { useNavigate } from "react-router-dom";

const Attendance = () => {
    const navigate = useNavigate();

    const labourers = [
        'N K Ariyasena', 'S Gunapala', 'K G Selvadore', 'N G Premasiri',
        'D K Kalyanasiri', 'S M Indika', 'M L Priyantha', 'A Haseem'
    ];
    const dates = ['07', '08', '09', 'Today, 10 Feb', '11', '12', '13'];
    const today = new Date();
    const [currentMonday, setCurrentMonday] = useState(getMonday(today));

    const weekDates = getWeekDates(currentMonday);
    // State to track attendance by labourer and shift type
    const [attendance, setAttendance] = useState(
        labourers.map((name) => ({
            name,
            attendanceType: null, // "Day", "Night", "Full", or null
        }))
    );

    function getMonday(date) {
        const d = new Date(date);
        const day = d.getDay(); // Sunday = 0
        const diff = (day === 0 ? -6 : 1) - day; // Adjust to Monday
        d.setDate(d.getDate() + diff);
        return d;
    }

    function formatDate(date, today) {
        const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

        const day = String(date.getDate()).padStart(2, '0');
        const month = date.toLocaleString('default', { month: 'short' });

        return isToday ? `Today, ${day} ${month}` : day;
    }

    function getWeekDates(monday) {
        const week = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            week.push(day);
        }
        return week;
    }

    const goToPreviousWeek = () => {
        const prev = new Date(currentMonday);
        prev.setDate(prev.getDate() - 7);
        setCurrentMonday(prev);
    };

    const goToNextWeek = () => {
        const next = new Date(currentMonday);
        next.setDate(next.getDate() + 7);
        setCurrentMonday(next);
    };
    const toggleAttendance = (index) => {
        const updated = [...attendance];
        updated[index] = !updated[index];
        setAttendance(updated);
    };

    const handleAttendanceChange = (index, type) => {
        const updated = [...attendance];
        updated[index].attendanceType = updated[index].attendanceType === type ? null : type;
        setAttendance(updated);
    };

    const selectAll = () => setAttendance(Array(labourers.length).fill(true));
    // Clear All Function
    const clearAll = () => {
        const cleared = attendance.map(lab => ({
            ...lab,
            attendanceType: null,
        }));
        setAttendance(cleared);
    };

    const handleSubmit = () => {
        // Send to backend as needed
        console.log("Submitting Attendance:", attendance);
    };
    return (
        <div className="min-h-screen bg-gray-50 p-4">
            {/* Header */}
            <div className="mb-4">
                <div className='flex justify-start items-center'>
                    <Button variant="outlined" style={{ color: green[900], borderColor: green[800] }} onClick={() => { navigate('/finance') }}>Back</Button>
                </div>
                <div className="flex justify-center"><h1 className="text-lg font-semibold">Labourer Attendances</h1></div>
            </div>

            {/* Week Navigation */}
            <div className=" flex flex-row">
                <div className="w-3/4">
                    <div className="flex justify-between mb-2 text-sm font-medium text-gray-700 px-2">
                        <button onClick={goToPreviousWeek} className="text-blue-600">← Previous Week</button>
                        <button onClick={goToNextWeek} className="text-blue-600">Next Week →</button>
                    </div>

                    {/* Date Selector */}
                    <div className="flex justify-between items-center bg-white rounded-md shadow px-2 py-3 mb-4 overflow-x-auto">
                        {weekDates.map((date, idx) => (
                            <button
                                key={idx}
                                className={`text-sm px-3 py-1 rounded-md whitespace-nowrap ${formatDate(date, today).includes('Today') ? 'bg-gray-200 font-semibold' : ''
                                    }`}
                            >
                                {formatDate(date, today)}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white rounded-md shadow p-4">
                        <div className="grid grid-cols-4 font-semibold border-b pb-2 mb-2">
                            <div>Labourer</div>
                            <div className="text-center">Day</div>
                            <div className="text-center">Night</div>
                            <div className="text-center">Full</div>
                        </div>

                        {attendance.map((labourer, i) => (
                            <div key={i} className="grid grid-cols-4 items-center py-2 border-b text-sm">
                                <div>{i + 1}. {labourer.name}</div>
                                <div className="flex justify-center">
                                    <input
                                        type="checkbox"
                                        checked={labourer.attendanceType === "Day"}
                                        onChange={() => handleAttendanceChange(i, "Day")}
                                    />
                                </div>
                                <div className="flex justify-center">
                                    <input
                                        type="checkbox"
                                        checked={labourer.attendanceType === "Night"}
                                        onChange={() => handleAttendanceChange(i, "Night")}
                                    />
                                </div>
                                <div className="flex justify-center">
                                    <input
                                        type="checkbox"
                                        checked={labourer.attendanceType === "Full"}
                                        onChange={() => handleAttendanceChange(i, "Full")}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="w-1/4 flex flex-col gap-4 items-center justify-center">
                    {/* Buttons */}
                    <div className="flex flex-col mb-4 gap-3">
                        <button onClick={selectAll} className="bg-green-600 text-white text-xs md:text-sm rounded-md px-2 py-1">
                            Select All
                        </button>
                        <button onClick={clearAll} className="bg-red-500 text-white text-xs md:text-sm  rounded-md px-2 py-1">
                            Clear All
                        </button>
                    </div>

                    {/* Submit */}
                    <div className="text-center">
                        <button onClick={handleSubmit} className="bg-blue-600 text-white text-xs md:text-sm  rounded-md shadow-md px-2 py-1">
                            Submit
                        </button>
                    </div>
                </div>
            </div>



        </div>

    );
};

export default Attendance;

