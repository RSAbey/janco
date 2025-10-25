import React from 'react'
import { Button } from "@mui/material";
import { green } from "@mui/material/colors";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AddMaterial = () => {
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
                    <label className="block mb-1 text-sm font-medium">Select Material</label>
                    <select
                        name="material"
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
                        required
                    >
                        <option value="">Select Material</option>
                        <option value="Cement">Cement</option>
                        <option value="Sand">Sand</option>
                        <option value="Concrete Stones">Concrete Stones</option>
                        <option value="Concrete Wire">Concrete Wire</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium">Select Supplier</label>
                    <select
                        name="supplier"
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
                        required
                    >
                        <option value="Sandaruwan Hardware & Suppliers">Sandaruwan Hardware & Suppliers</option>
                        <option value="Mckinney">Mckinney</option>
                        <option value="Ronald Richard">Ronald Richard</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <input
                        type="number"
                        name="amount"
                        placeholder="Amount"
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
                        required
                    />
                    <select
                        name="amountType"
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
                        required
                    >
                        <option value="">Select Type</option>
                        <option value="Packs">Packs</option>
                        <option value="Cubes">Cubes</option>
                        <option value="Pieces">Pieces</option>
                    </select>
                </div>
                <div className=''>
                <DatePicker
                    placeholderText="Received Date"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
                    dateFormat="yyyy-MM-dd"
                    required
                />
                </div>
                <div className='flex justify-center'>
                    <button
                        type="submit"
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                    >
                        Add Materials
                    </button>
                </div>
            </form>
        </div>
    )
}

export default AddMaterial
