import React, { useState } from "react";

const AddInvoceMaterials = ({ isOpen, onClose, onRegister }) => {
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unitPrice: 0, // Stored in decimal format (e.g. 1.23)
  });

  const [unitPriceInput, setUnitPriceInput] = useState(""); // Raw input, like "123" for Rs 1.23

  // Format the input as currency
  const formatSmartCurrency = (value) => {
    const number = parseInt(value || "0", 10);
    return (number / 100).toFixed(2);
  };

  // Handle all input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "unitPrice") {
      const numericOnly = value.replace(/\D/g, ""); // Remove non-digits
      const formatted = formatSmartCurrency(numericOnly);

      setUnitPriceInput(numericOnly);
      setFormData((prev) => ({
        ...prev,
        unitPrice: parseFloat(formatted),
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // On form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(formData);
    setFormData({ name: "", quantity: "", unitPrice: 0 });
    setUnitPriceInput("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl text-green-700 mb-4">Add Materials</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name Dropdown */}
          <select
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
          >
            <option disabled value="">
              Product Name
            </option>
            <option value="Cement">Cement</option>
            <option value="Sand">Sand</option>
            <option value="Concrete Stones">Concrete Stones</option>
          </select>

          {/* Quantity Input */}
          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            required
          />

          {/* Smart Currency Unit Price Input */}
          <input
            type="text"
            name="unitPrice"
            placeholder="Unit Price"
            value={formatSmartCurrency(unitPriceInput)}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            inputMode="numeric"
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

export default AddInvoceMaterials;
