import React, { useState } from "react";
import salaryService from "../services/salaryService";
import { useErrorHandler } from "../hooks/useErrorHandler";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";

const AddSalary = ({ isOpen, onClose, onRegister }) => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    id: "", // This is the Employer ID (kept as "id")
    position: "supervisor",
    salary: "",
    email: "",
    status: "not",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (validationErrors[e.target.name]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: "" });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.id) errors.id = "Employer ID is required";
    if (!formData.salary || formData.salary <= 0) errors.salary = "Valid salary is required";
    if (!formData.email) errors.email = "Email is required";
    if (!formData.email.includes('@')) errors.email = "Please enter a valid email";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const submissionData = {
        id: formData.id, // Employer ID
        position: formData.position,
        salary: parseFloat(formData.salary),
        email: formData.email,
        status: formData.status,
        month: parseInt(formData.month),
        year: parseInt(formData.year),
      };

      console.log("Submitting salary data:", submissionData);
      
      const response = await salaryService.createSalary(submissionData);
      onRegister(response.salary);
      
      // Reset form
      setFormData({
        id: "",
        position: "supervisor",
        salary: "",
        email: "",
        status: "not",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
      
      setValidationErrors({});
      onClose();
    } catch (error) {
      console.error("Salary submission error:", error);
      handleError(error, "Failed to create salary record");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center animate-fade-in">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold text-green-700 mb-4">
          Employee Salary Registration
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employer ID - Only one ID input */}
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

          {/* Position */}
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

          {/* Month and Year (hidden but required for backend) */}
          <div className="hidden">
            <input type="hidden" name="month" value={formData.month} />
            <input type="hidden" name="year" value={formData.year} />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <LoadingSpinner size="sm" />}
              {isLoading ? "Creating..." : "Add Salary"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSalary;