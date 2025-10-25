import React, { useState } from "react";
import labourService from "../services/labourService";

const AddLabourer = ({ isOpen, onClose, onRegister, projectId }) => {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    skillLevel: "Skilled",
    baseSalary: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // In AddLabour.js - update the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      if (!projectId) {
        throw new Error("Project ID is required. Please select a project first.");
      }
  
      // Simple test data - remove labourId generation for now
      const labourData = {
        name: formData.name.trim(),
        contact: formData.contact.trim(),
        skillLevel: formData.skillLevel,
        baseSalary: Number.parseFloat(formData.baseSalary),
        project: projectId,
        // Don't include labourId - let the backend generate it
      };
  
      console.log("Submitting labour data:", labourData);
  
      const newLabourer = await labourService.createLabourer(labourData);
      
      onRegister(newLabourer);
      setFormData({ name: "", contact: "", skillLevel: "Skilled", baseSalary: "" });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to register labourer");
      console.error("Registration error details:", err);
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center animate-fade-in">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold text-green-700 mb-4">Register Labourer</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!projectId && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            Warning: No project selected. Please select a project first.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              name="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              required
              minLength={2}
              maxLength={100}
              disabled={!projectId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
            <input
              type="tel"
              name="contact"
              placeholder="Enter contact number"
              value={formData.contact}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              required
              minLength={10}
              pattern="[0-9]{10,}"
              title="Please enter a valid contact number (at least 10 digits)"
              disabled={!projectId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill Level *</label>
            <select
              name="skillLevel"
              value={formData.skillLevel}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              disabled={!projectId}
            >
              <option value="Skilled">Skilled</option>
              <option value="Non">Non-Skilled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary (LKR) *</label>
            <input
              type="number"
              name="baseSalary"
              placeholder="Enter base salary"
              value={formData.baseSalary}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              required
              min="0"
              step="0.01"
              disabled={!projectId}
            />
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
              disabled={loading || !projectId}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLabourer;