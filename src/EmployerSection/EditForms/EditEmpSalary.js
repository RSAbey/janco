import React, { useState, useEffect } from "react";

const EditEmpSalary = ({ isOpen, onClose, onSave, emp }) => {
  const [formData, setFormData] = useState({
    id: "",
    position: "supervisor",
    salary: "",
    email: "",
    status: "not"
  });
  
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (emp) {
      setFormData({
        id: emp.id || "",
        position: emp.position || "supervisor",
        salary: emp.salary || "",
        email: emp.email || "",
        status: emp.status || "not",
      });
    }
  }, [emp, isOpen]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.id) errors.id = "Employer ID is required";
    if (!formData.salary || formData.salary <= 0) errors.salary = "Valid salary is required";
    if (!formData.email) errors.email = "Email is required";
    if (!formData.email.includes('@')) errors.email = "Please enter a valid email";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (validationErrors[e.target.name]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: "" });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    onSave(formData);
    onClose();
  };

  if (!isOpen || !emp) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center animate-fade-in">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold text-green-700 mb-4">
          Edit Employee Salary
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employer ID */}
          <input
            type="text"
            name="id"
            placeholder="Employer ID"
            value={formData.id}
            onChange={handleChange}
            className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${
              validationErrors.id ? "border-red-500" : ""
            }`}
            required
          />
          {validationErrors.id && (
            <p className="text-red-500 text-sm">{validationErrors.id}</p>
          )}

          {/* Position Dropdown */}
          <select
            name="position"
            value={formData.position}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="supervisor">Supervisor</option>
            <option value="employee">Employee</option>
          </select>

          {/* Salary */}
          <input
            type="number"
            name="salary"
            placeholder="Salary"
            value={formData.salary}
            onChange={handleChange}
            className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${
              validationErrors.salary ? "border-red-500" : ""
            }`}
            step="0.01"
            min="0"
            required
          />
          {validationErrors.salary && (
            <p className="text-red-500 text-sm">{validationErrors.salary}</p>
          )}

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${
              validationErrors.email ? "border-red-500" : ""
            }`}
            required
          />
          {validationErrors.email && (
            <p className="text-red-500 text-sm">{validationErrors.email}</p>
          )}

          {/* Status */}
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="not">Not Paid</option>
            <option value="paid">Paid</option>
          </select>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmpSalary;