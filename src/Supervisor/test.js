import React, { useState } from "react";
import { Button } from "@mui/material";
import { green } from "@mui/material/colors";
import { useNavigate } from "react-router-dom";
import { format } from 'date-fns';

const Attendance = () => {
    const navigate = useNavigate();

    const labourers = [
        'N K Ariyasena', 'S Gunapala', 'K G Selvadore', 'N G Premasiri',
        'D K Kalyanasiri', 'S M Indika', 'M L Priyantha', 'A Haseem'
    ];

    // State to track attendance by labourer and shift type
    const [attendance, setAttendance] = useState(
        labourers.map((name) => ({
            name,
            attendanceType: null, // "Day", "Night", "Full", or null
        }))
    );

    const handleAttendanceChange = (index, type) => {
        const updated = [...attendance];
        updated[index].attendanceType = updated[index].attendanceType === type ? null : type;
        setAttendance(updated);
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
                    <Button variant="outlined" style={{ color: green[900], borderColor: green[800] }} onClick={() => navigate('/finance')}>Back</Button>
                </div>
                <div className="flex justify-center"><h1 className="text-lg font-semibold">Labourer Attendances</h1></div>
            </div>

            {/* Labourer Attendance Table */}
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

            {/* Submit Button */}
            <div className="mt-4 flex justify-center">
                <button onClick={handleSubmit} className="bg-blue-600 text-white rounded-md px-4 py-2 shadow-md">
                    Submit
                </button>
            </div>
        </div>
    );
};

export default Attendance;
