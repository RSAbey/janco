import { Delete, Edit, Search } from "@mui/icons-material";
import { red } from "@mui/material/colors";
import React, { useState, useEffect } from "react";
import AddEmployer from "./AddEmployer";
import EditEmployerForm from "./EditForms/EditEmployerForm";
import employeeService from "../services/employeeService";
import { useErrorHandler } from "../hooks/useErrorHandler";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmPasswordModal from "../components/ConfirmPasswordModal";

const EmployerDetails = () => {
  // For password state when Editing
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingEditEmployee, setPendingEditEmployee] = useState(null);

  // For handling state while deletion
  const [isDeleting, setIsDeleting] = useState(false);

  // States for editing employees
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const employeesPerPage = 8;
  const { handleError } = useErrorHandler();

  // Fetch employees from the database
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching employees from database...");
      
      const response = await employeeService.getAllEmployees();
      const employeesData = response.users || response;
      
      // Sort employees based on selection
      let sortedEmployees = [...employeesData];
      if (sortBy === "newest") {
        sortedEmployees.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortBy === "oldest") {
        sortedEmployees.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sortBy === "name") {
        sortedEmployees.sort((a, b) => {
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
      }
      
      // Filter by search term if provided
      if (searchTerm) {
        sortedEmployees = sortedEmployees.filter(employee => 
          `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (employee.employeeId && employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (employee.phoneNumber && employee.phoneNumber.includes(searchTerm))
        );
      }
      
      setEmployees(sortedEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      handleError(error, "Failed to fetch employees");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm, sortBy]);

  const totalPages = Math.ceil(employees.length / employeesPerPage);

  // For employee adding
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle adding a new employee
  const handleRegister = async (newEmployee) => {
    try {
      await employeeService.createEmployee(newEmployee);
      // Refresh the employee list
      await fetchEmployees();
      setIsModalOpen(false);
    } catch (error) {
      handleError(error, "Failed to add employee");
    }
  };

  const handleSort = (order) => {
    setSortBy(order);
  };

  // Employee details editing function
  const handleEditEmployee = (employee) => {
    setPendingEditEmployee(employee);
    setIsDeleting(false);
    setIsPasswordModalOpen(true);
  };

  // Function for employee deletion
  const handleDeleteClick = (employee) => {
    setPendingEditEmployee(employee);
    setIsDeleting(true);
    setIsPasswordModalOpen(true);
  };

  const handleDeleteEmployee = async () => {
    try {
      console.log("Starting delete process for ID:", pendingEditEmployee._id);
      console.log("Pending employee:", pendingEditEmployee);
      
      const response = await employeeService.deleteEmployee(pendingEditEmployee._id);
      console.log("Delete API response:", response);
      
      // Refresh the employee list
      await fetchEmployees();
      setPendingEditEmployee(null);
      console.log("Delete completed successfully");
    } catch (error) {
      console.error("Delete error details:", error);
      console.error("Error response:", error.response);
      handleError(error, "Failed to delete employee");
    }
  };

  const onPasswordVerified = async () => {
    if (isDeleting) {
      await handleDeleteEmployee();
    } else {
      setEditingEmployee(pendingEditEmployee);
      setIsEditModalOpen(true);
    }
  }

  // Saving edited employee details
  const handleSaveEdit = async (updatedEmployeeData) => {
    try {
      // Convert the data to match the API expectations
      const apiData = {
        firstName: updatedEmployeeData.firstName,
        lastName: updatedEmployeeData.lastName,
        phoneNumber: updatedEmployeeData.phoneNumber,
        email: updatedEmployeeData.email,
        role: updatedEmployeeData.role,
        employeeId: updatedEmployeeData.employeeId,
        salary: parseFloat(updatedEmployeeData.salary) || 0,
        department: updatedEmployeeData.department
      };
      
      await employeeService.updateEmployee(editingEmployee._id, apiData);
      // Refresh the employee list
      await fetchEmployees();
      setIsEditModalOpen(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error("Error updating employee:", error);
      handleError(error, "Failed to update employee");
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-max w-full p-4 bg-white rounded-lg">
      {/* Sorting & Title Section */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-black">All Employees</h3>

        {/* Search and Sorting */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2 p-2 border rounded-lg focus:ring-2 focus:ring-green-400 shadow-md">
            <Search />
            <input
              placeholder="Search"
              className="focus:outline-none"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="flex items-center">
            <label className="mr-2 text-gray-700 font-semibold">Sort By:</label>
            <select
              className="p-2 border rounded-md"
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex-grow overflow-auto">
        <div>
          <table className="w-full border-collapse border border-gray-300 text-center">
            <thead>
              <tr className="text-gray-500">
                <th className="border border-gray-300 p-2">EmpID(File No)</th>
                <th className="border border-gray-300 p-2">Name</th>
                <th className="border border-gray-300 p-2">Phone Number</th>
                <th className="border border-gray-300 p-2">Email</th>
                <th className="border border-gray-300 p-2">Position</th>
                <th className="border border-gray-300 p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length > 0 ? (
                employees
                  .slice(
                    (currentPage - 1) * employeesPerPage,
                    currentPage * employeesPerPage
                  )
                  .map((employee, index) => (
                    <tr key={employee._id || index} className="border border-gray-300">
                      <td className="border border-gray-300 p-2">
                        {employee.employeeId || "N/A"}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {employee.firstName} {employee.lastName}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {employee.phoneNumber || "N/A"}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {employee.email}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {employee.role || "N/A"}
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Edit 
                          className="cursor-pointer mr-2" 
                          onClick={() => handleEditEmployee(employee)}
                        />
                        <Delete 
                          className="cursor-pointer ml-2" 
                          style={{ color: red[500] }} 
                          onClick={() => handleDeleteClick(employee)}
                        />
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="flex justify-between items-center mt-4">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-lg"
              onClick={() => setIsModalOpen(true)}
            >
              + Add Employee
            </button>
            
            {totalPages > 1 && (
              <div className="flex space-x-2">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === index + 1
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Employee Registration Popup */}
          <AddEmployer
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onRegister={handleRegister}
          />
          
          <EditEmployerForm
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveEdit}
            employee={editingEmployee}  
          />    
        </div>
      </div>
      {/* Confirm password modal */}
      <ConfirmPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={onPasswordVerified}
        title={isDeleting ? "Confirm Delete" : "Confirm Edit"}
      />
    </div>
  );
};

export default EmployerDetails;