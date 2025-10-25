import React, { useState, useEffect } from "react";
import "react-datepicker/dist/react-datepicker.css";

const materialAmountTypes = {
  "Cement": "Packs",
  "Sand": "Cubes",
  "Concrete Stones": "Cubes",
  "Concrete Wire": "Pieces",
};

const EditMaterialForm = ({ isOpen, onClose, onSave, material }) => {
  const [formData, setFormData] = useState({
    name: "",
    supplier: "",
    quantity: "",
    unit: "",
    receivedDate: "",
    description: ""
  });

  useEffect(() => {
    if (material) {
      // Format the date for the input field (YYYY-MM-DD)
      const receivedDate = material.recDate 
        ? new Date(material.recDate).toISOString().split('T')[0]
        : "";
      
      setFormData({
        name: material.material || "",
        supplier: material.supplier || "",
        quantity: material.amount || "",
        unit: material.amountType || materialAmountTypes[material.material] || "",
        receivedDate: receivedDate,
        description: material.description || ""
      });
    }
  }, [material, isOpen]);

  const handleMaterialChange = (e) => {
    const selectedMaterial = e.target.value;
    setFormData({
      ...formData,
      name: selectedMaterial,
      unit: materialAmountTypes[selectedMaterial] || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare data in the format expected by the API
      const submissionData = {
        name: formData.name,
        supplier: formData.supplier,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit.toLowerCase(),
        receivedDate: formData.receivedDate,
        description: formData.description
      };
      
      await onSave(submissionData);
      onClose();
    } catch (error) {
      console.error("Error saving material:", error);
    }
  };

  if (!isOpen || !material) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl text-green-700 mb-4">Edit Material</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
            <select
              name="name"
              value={formData.name}
              onChange={handleMaterialChange}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <select
              name="supplier"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
              required
            >
              <option value="">Select Supplier</option>
              <option value="Sandaruwan Hardware & Suppliers">Sandaruwan Hardware & Suppliers</option>
              <option value="Mckinney">Mckinney</option>
              <option value="Ronald Richard">Ronald Richard</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
              required
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
              required
            >
              <option value="">Select Unit</option>
              <option value="Packs">Packs</option>
              <option value="Cubes">Cubes</option>
              <option value="Pieces">Pieces</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
            <input
              type="date"
              name="receivedDate"
              value={formData.receivedDate}
              onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
              rows="2"
            />
          </div>
          
          <div className="flex justify-between mt-4">
            <button 
              type="button" 
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 shadow-md"
              onClick={onClose}
            >
              Close
            </button>
            <button 
              type="submit" 
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 shadow-md"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMaterialForm;