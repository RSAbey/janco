import { Delete, Edit } from "@mui/icons-material";
import { red } from "@mui/material/colors";
import React, { useState, useEffect } from "react";
import AddSalary from "./AddSalary";
import EditEmpSalary from "./EditForms/EditEmpSalary";
import salaryService from "../services/salaryService";
import { useErrorHandler } from "../hooks/useErrorHandler";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmPasswordModal from "../components/ConfirmPasswordModal";

const EmployerSalary = () => {
  const [salaries, setSalaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingEditSalary, setPendingEditSalary] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sortSalary, setSortSalary] = useState("Newest");
  const [currentPage, setCurrentPage] = useState(1);
  const salariesPerPage = 8;

  const { handleError } = useErrorHandler();

  // Fetch salaries function
  const fetchSalaries = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching salaries...");
      const response = await salaryService.getAllSalaries();
      
      if (response && response.salaries) {
        setSalaries(response.salaries);
        console.log("Salaries loaded:", response.salaries.length);
      } else if (Array.isArray(response)) {
        setSalaries(response);
      } else {
        console.log("Unexpected response structure:", response);
        setSalaries([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      handleError(error, "Failed to fetch salaries");
      setSalaries([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch salaries on component mount
  useEffect(() => {
    fetchSalaries();
  }, []);

  // Handle register - refresh the list after adding new salary
  const handleRegister = async (newSalary) => {
    await fetchSalaries(); // Refresh the list after successful addition
  };

  const handleSort = (order) => {
    setSortSalary(order);
    let sortedSalaries = [...salaries];

    if (order === "Newest") {
      sortedSalaries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (order === "Oldest") {
      sortedSalaries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (order === "Name") {
      sortedSalaries.sort((a, b) => 
        (a.id || '').localeCompare(b.id || '')
      );
    }

    setSalaries(sortedSalaries);
  };

  const handleEditSalary = (salary) => {
    setPendingEditSalary(salary);
    setIsDeleting(false);
    setIsPasswordModalOpen(true);
  };

  const onPasswordVerified = async () => {
    if (isDeleting) {
      await handleDeleteSalary();
    } else {
      setEditingSalary(pendingEditSalary);
      setIsEditModalOpen(true);
    }
  };

  const handleDeleteClick = (salary) => {
    setPendingEditSalary(salary);
    setIsDeleting(true);
    setIsPasswordModalOpen(true);
  };

  const handleDeleteSalary = async () => {
    try {
      await salaryService.deleteSalary(pendingEditSalary._id);
      await fetchSalaries(); // Refresh the list after deletion
      setPendingEditSalary(null);
    } catch (error) {
      handleError(error, "Failed to delete salary");
    }
  };

  const handleSaveEdit = async (updatedSalary) => {
    try {
      await salaryService.updateSalary(editingSalary._id, updatedSalary);
      await fetchSalaries(); // Refresh the list after update
      setIsEditModalOpen(false);
    } catch (error) {
      handleError(error, "Failed to update salary");
    }
  };

  const totalPages = Math.ceil(salaries.length / salariesPerPage);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-max w-full p-4 bg-white rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-black">Salary Management</h3>
        <div className="flex items-center">
          <label className="mr-2 text-gray-700 font-semibold">Sort By:</label>
          <select
            className="p-2 border rounded-md"
            value={sortSalary}
            onChange={(e) => handleSort(e.target.value)}
          >
            <option value="Newest">Newest</option>
            <option value="Oldest">Oldest</option>
            <option value="Name">Name</option>
          </select>
        </div>
      </div>
      
      <div className="flex-grow overflow-auto mt-4">
        <table className="w-full border-collapse border border-gray-300 text-center">
          <thead>
            <tr className="text-gray-500">
              <th className="border border-gray-300 p-2">EmpID</th>
              <th className="border border-gray-300 p-2">Position</th>
              <th className="border border-gray-300 p-2">Salary</th>
              <th className="border border-gray-300 p-2">Email</th>
              <th className="border border-gray-300 p-2">Status</th>
              <th className="border border-gray-300 p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {salaries.length > 0 ? (
              salaries
                .slice((currentPage - 1) * salariesPerPage, currentPage * salariesPerPage)
                .map((salary, index) => (
                  <tr key={salary._id || index} className="border border-gray-300 hover:bg-green-200">
                    <td className="border border-gray-300 p-2">{salary.id}</td>
                    <td className="border border-gray-300 p-2 capitalize">{salary.position}</td>
                    <td className="border border-gray-300 p-2">
                      Rs. {salary.salary?.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-2">{salary.email}</td>
                    <td className="border border-gray-300 p-2">
                      <span className={`px-2 py-1 rounded ${
                        salary.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {salary.status === 'paid' ? 'Paid' : 'Not Paid'}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Edit 
                        className="cursor-pointer mr-2" 
                        onClick={() => handleEditSalary(salary)}
                      />
                      <Delete 
                        className="cursor-pointer ml-2" 
                        style={{ color: red[500] }} 
                        onClick={() => handleDeleteClick(salary)}
                      />
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="6" className="border border-gray-300 p-4 text-center text-gray-500">
                  No salary records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-between items-center mt-4">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            onClick={() => setIsModalOpen(true)}
          >
            + Add Salary
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

        <AddSalary
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onRegister={handleRegister} // This will refresh the list after adding
        />

        <EditEmpSalary
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
          emp={editingSalary}  
        />
               
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

export default EmployerSalary;