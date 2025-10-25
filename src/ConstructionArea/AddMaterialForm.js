import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AddMaterialForm = ({ isOpen, onClose, onRegister }) => {
  const [formData, setFormData] = useState({
    material: "",
    supplier: "Sandaruwan Hardware & Suppliers",
    amount: "",
    amountType: "",
    recDate: "",
    updatedOn: ""
  });

  // Mapping materials to their respective amount types
  const materialAmountTypeMap = {
    Cement: "Packs",
    Sand: "Cubes",
    "Concrete Stones": "Cubes",
    "Concrete Wire": "Pieces"
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };

    // Auto-set amountType when material changes
    if (name === "material") {
      updatedFormData.amountType = materialAmountTypeMap[value] || "";
    }
    
    setFormData(updatedFormData);
  };

  // Handle date change (convert Date object to string)
  const handleDateChange = (date) => {
    setFormData({ ...formData, recDate: date.toISOString().split("T")[0] });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const currentDate = new Date().toISOString().split("T")[0];
    onRegister(formData);
    setFormData({ 
      material: "", 
      supplier: "Sandaruwan Hardware & Suppliers", 
      amount: "", 
      amountType: "", 
      recDate: "", 
      updatedOn: currentDate,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl text-green-700 mb-4">Add Materials</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Material dropdown */}
          <select
            name="material"
            value={formData.material}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            required
          >
            <option value="">Select Material</option>
            <option value="Cement">Cement</option>
            <option value="Sand">Sand</option>
            <option value="Concrete Stones">Concrete Stones</option>
            <option value="Concrete Wire">Concrete Wire</option>
          </select> 

          {/* Supplier dropdown */}
          <select
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            required
          >
            <option value="Sandaruwan Hardware & Suppliers">Sandaruwan Hardware & Suppliers</option>
            <option value="Mckinney">Mckinney</option>
            <option value="Ronald Richard">Ronald Richard</option>
          </select> 

          {/* Amount and Amount Type */}
          <div className="flex gap-2">
            <input
              type="number"
              name="amount"
              placeholder="Amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
              required
            />
            <select
              name="amountType"
              value={formData.amountType}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
              required
            >
              <option value="">Select Type</option>
              <option value="Packs">Packs</option>
              <option value="Cubes">Cubes</option>
              <option value="Pieces">Pieces</option>
            </select> 
          </div> 

          {/* Date Picker */}
          <DatePicker
            selected={formData.recDate ? new Date(formData.recDate) : null}
            onChange={handleDateChange}
            placeholderText="Received Date"
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            dateFormat="yyyy-MM-dd"
            required
          />

          {/* Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 shadow-md"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMaterialForm;



