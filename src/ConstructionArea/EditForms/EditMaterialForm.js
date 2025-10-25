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
    material: "",
    supplier: "",
    amount: "",
    amountType: "",
    recDate: "",
  });

  useEffect(() => {
    if (material) {
      setFormData({
        material: material.material,
        supplier: material.supplier,
        amount: material.amount,
        amountType: material.amountType || materialAmountTypes[material.material] || "",
        recDate: material.recDate,
      });
    }
  }, [material, isOpen]);

  const handleMaterialChange = (e) => {
    const selectedMaterial = e.target.value;
    setFormData({
      ...formData,
      material: selectedMaterial,
      amountType: materialAmountTypes[selectedMaterial] || "",
    });
  };

  if (!isOpen || !material) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl text-green-700 mb-4">Edit Material</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); onClose(); }}>
          <div>
            <label>Material Name</label>
            <select
              name="material"
              value={formData.material}
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
            <label>Supplier</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            />
          </div>
          <div>
            <label>Amount</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
              required
            />
          </div>
          <div>
            <label>Amount Type</label>
            <select
              name="amountType"
              value={formData.amountType}
              onChange={(e) => setFormData({ ...formData, amountType: e.target.value })}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
              required
            >
              <option value="Packs">Packs</option>
              <option value="Cubes">Cubes</option>
              <option value="Pieces">Pieces</option>
            </select>
          </div>
          <div>
          <label>Received Date</label>
          <input
            type="date"
            value={formData.recDate}
            placeholder="Received Date"
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            required            
            onChange={(e) =>
              setFormData({ ...formData, recDate: e.target.value })
            }
          />
        </div>
          <div className="flex justify-between mt-4">
            <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 shadow-md" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 shadow-md">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMaterialForm;