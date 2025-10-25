// components/DownloadReportForm.js

import React, { useState } from "react";
import apiClient from "../services/apiClient";

const DownloadReportForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    reportTypes: [],
    duration: "",
    startDate: "",
    endDate: "",
    documentType: "PDF",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      reportTypes: checked
        ? [...prev.reportTypes, value]
        : prev.reportTypes.filter((type) => type !== value),
    }));
  };

  const handleDurationChange = (e) => {
    const duration = e.target.value;
    setFormData((prev) => ({ ...prev, duration }));

    // Calculate date range based on duration
    const today = new Date();
    let startDate = new Date();

    switch (duration) {
      case "Last 7 Days":
        startDate.setDate(today.getDate() - 7);
        break;
      case "Last 30 Days":
        startDate.setDate(today.getDate() - 30);
        break;
      case "This Year":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case "Custom":
        return; // Don't auto-set dates for custom
      default:
        return;
    }

    setFormData((prev) => ({
      ...prev,
      startDate: startDate.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.reportTypes.length === 0) {
      setError("Please select at least one report type");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError("Please select a duration or provide custom dates");
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError("Start date must be before end date");
      return;
    }

    try {
      setIsLoading(true);

      // Get token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please log in again.");
        return;
      }

      // Make API call to generate report
      const response = await apiClient.post(
        "/reports/expenses",
        {
          reportTypes: formData.reportTypes,
          startDate: formData.startDate,
          endDate: formData.endDate,
        },
        {
          responseType: "blob", // Important for PDF download
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `expense-report-${new Date().getTime()}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Close the form after successful download
      onClose();
    } catch (err) {
      console.error("Error generating report:", err);
      setError(
        err.response?.data?.message ||
          "Failed to generate report. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
          disabled={isLoading}
        >
          &times;
        </button>

        <h2 className="text-xl font-bold text-center mb-6">
          Download Finance Report
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Report Type *
            </label>
            <div className="flex gap-6 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value="income"
                  checked={formData.reportTypes.includes("income")}
                  onChange={handleCheckboxChange}
                  disabled={isLoading}
                />
                Income
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value="expense"
                  checked={formData.reportTypes.includes("expense")}
                  onChange={handleCheckboxChange}
                  disabled={isLoading}
                />
                Expense
              </label>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Duration *
            </label>
            <select
              className="w-full border border-gray-300 rounded-xl p-3"
              value={formData.duration}
              onChange={handleDurationChange}
              disabled={isLoading}
            >
              <option value="">-Select duration-</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Year">This Year</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {formData.duration === "Custom" && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-xl p-3"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  disabled={isLoading}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-xl p-3"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Show selected date range */}
          {formData.startDate && formData.endDate && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              Report will include data from{" "}
              <strong>{new Date(formData.startDate).toLocaleDateString()}</strong>{" "}
              to <strong>{new Date(formData.endDate).toLocaleDateString()}</strong>
            </div>
          )}

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Document Type
            </label>
            <select
              className="w-full border border-gray-300 rounded-xl p-3"
              value={formData.documentType}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  documentType: e.target.value,
                }))
              }
              disabled={isLoading}
            >
              <option value="PDF">PDF</option>
            </select>
          </div>

          {/* Download Button */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Generating Report..." : "Download"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DownloadReportForm;
