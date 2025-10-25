import React from 'react'
import { Button } from "@mui/material";
import { green } from "@mui/material/colors";
import { useNavigate } from "react-router-dom";

const AddLaborForm = () => {
    const navigate = useNavigate();
    return (
        <div className="h-full bg-white p-4 md:p-10 shadow-md rounded-md">
            <div className='flex justify-start items-center'>
                <Button variant="outlined" style={{ color: green[900], borderColor: green[800] }} onClick={() => { navigate('/finance') }}>Back</Button>
            </div>
            
            <div className='flex justify-center items-center'>
                <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">
                    Labourer Registration
                </h2>
            </div>
            <form className="space-y-4 max-w-xl mx-auto">
                <div>
                    <label className="block mb-1 text-sm font-medium">Labourer ID</label>
                    <input
                        type="text"
                        name="id"
                        placeholder="Enter Labourer ID"
                        // value={formData.id}
                        // onChange={handleChange}
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium">Name</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
                        placeholder="Enter Name"
                    />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium">Contact Number</label>
                    <input
                        type="tel"
                        name="contact"
                        placeholder="Contact No"
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium">Status</label>
                    <select
                        name="status"
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
                    >
                        <option value="Skilled">Skilled</option>
                        <option value="Non">Non</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium">Salary</label>
                    <input
                        type="number"
                        name="salary"
                        placeholder="Salary Amount"
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
                        required
                    />
                </div>
                <div className='flex justify-center'>
                    <button
                        type="submit"
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                    >
                        Register Labourer
                    </button>
                </div>
            </form>
        </div>
    )
}

export default AddLaborForm
