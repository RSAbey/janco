"use client"

import { Delete, Edit } from "@mui/icons-material"
import { red } from "@mui/material/colors"
import { useState, useEffect } from "react"
import AddSalary from "./AddForms/AddSalary"
import EditSalaryForm from "./EditForms/EditSalaryForm"
import labourService from "../services/labourService" // Import the service
import ConfirmPasswordModal from "../components/ConfirmPasswordModal";

const LabourerSalary = ({ projectId }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const labourersPerPage = 8
  const [salaries, setSalaries] = useState([])
  const [labourList, setLabourList] = useState([]) // Define labourList
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // For password state when Editing
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [status, setStatus] = useState("")
  const [pendingEditSalary, setPendingEditSalary] = useState(null)

  // For handling state while deletion
  const [isDeleting, setIsDeleting] = useState(false)

  // States for editing salaries
  const [editingSalary, setEditingSalary] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // For salary adding
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Helper function to format numbers to 100,000,000.00 standard
  const formatPrice = (value) => {
    if (value === "N/A" || value === null || value === undefined) return "N/A"
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return "N/A"
    
    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Fetch salaries from API
  const fetchSalaries = async () => {
    try {
      setLoading(true)
      setError("")
      const salariesData = await labourService.getAllSalaries({ projectId })
      setSalaries(salariesData)
    } catch (err) {
      setError(err.message || "Failed to fetch salaries")
      console.error("Error fetching salaries:", err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch labourers for the dropdown
  const fetchLabourers = async () => {
    try {
      const labourersData = await labourService.getLabourers({ projectId })
      setLabourList(labourersData)
    } catch (err) {
      console.error("Error fetching labourers:", err)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchSalaries()
      fetchLabourers()
    }
  }, [projectId])

  // Handle adding a new Salary
  const handleRegister = async (newSalary) => {
    try {
      await labourService.createSalary(newSalary)
      fetchSalaries() // Refresh the list
    } catch (err) {
      setError(err.message || "Failed to add salary")
    }
  }

  // Salary details editing function
  const handleEditSalary = (salary) => {
    setPendingEditSalary(salary)
    setIsDeleting(false)
    setIsPasswordModalOpen(true)
  }

  const onPasswordVerified = async () => {
    if (isDeleting) {
      await handleDeleteSalary();
    } else {
      setEditingSalary(pendingEditSalary);
      setIsEditModalOpen(true);
    }
  };

  // Saving edited salary details
  const handleSaveEdit = async (updatedSalary) => {
    try {
      // Update the salary record with new amount, status, and description
      await labourService.updateSalaryStatus(editingSalary._id, {
        amount: Number.parseFloat(updatedSalary.amount),
        status: updatedSalary.status,
        description: updatedSalary.description,
      })
      fetchSalaries() // Refresh the list
      setIsEditModalOpen(false)
      setEditingSalary(null)
    } catch (err) {
      setError(err.message || "Failed to update salary")
    }
  }

  // Function for salary deletion
  const handleDeleteClick = (salary) => {
    setPendingEditSalary(salary)
    setIsDeleting(true)
    setIsPasswordModalOpen(true)
  }

  const handleDeleteSalary = async () => {
    try {
      await labourService.deleteSalary(pendingEditSalary._id)
      fetchSalaries() // Refresh the list
      setPendingEditSalary(null)
      setIsPasswordModalOpen(false)
      setPasswordInput("")
      setPasswordError("")
    } catch (err) {
      setError(err.message || "Failed to delete salary")
    }
  }

  const totalPages = Math.ceil(salaries.length / labourersPerPage)

  if (loading) {
    return (
      <div className="flex flex-col h-max w-full p-4 bg-white rounded-lg overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading salaries...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-max w-full p-4 bg-white rounded-lg overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
          <button onClick={fetchSalaries} className="ml-4 bg-green-500 text-white px-4 py-2 rounded-lg">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-max w-full p-4 bg-white rounded-lg overflow-hidden">
      <div className="flex-grow overflow-auto mt-1">
        <div>
          <h3 className="text-lg font-bold text-black mb-1">Labourers Salary Details</h3>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

          <table className="w-full border-collapse border border-gray-300 text-center">
            <thead>
              <tr className="text-gray-500">
                <th className="border border-gray-300 p-2">Labourer ID</th>
                <th className="border border-gray-300 p-2">Name</th>
                <th className="border border-gray-300 p-2">Phone Number</th>
                <th className="border border-gray-300 p-2">Skilled / Non Skilled</th>
                <th className="border border-gray-300 p-2">Salary (Rs)</th>
                <th className="border border-gray-300 p-2">Payment Status</th>
                <th className="border border-gray-300 p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {salaries
                .slice((currentPage - 1) * labourersPerPage, currentPage * labourersPerPage)
                .map((salary, index) => (
                  <tr key={index} className="border border-gray-300">
                    <td className="border border-gray-300 p-2">{salary.labour?.labourId || "N/A"}</td>
                    <td className="border border-gray-300 p-2">{salary.labour?.name || "N/A"}</td>
                    <td className="border border-gray-300 p-2">{salary.labour?.contact || "N/A"}</td>
                    <td className="border border-gray-300 p-2">{salary.labour?.skillLevel || "N/A"}</td>
                    <td className="border border-gray-300 p-2">{salary.amount ? formatPrice(salary.amount) : "0.00"}</td>
                    <td className="border border-gray-300 p-2">
                      <span
                        className={`inline-block w-32 text-sm items-center px-2 py-1 rounded-md ${
                          salary.status === "paid"
                            ? "bg-green-300 text-green-800"
                            : salary.status === "pending"
                              ? "bg-yellow-300 text-yellow-800"
                              : "bg-red-300 text-red-800"
                        }`}
                      >
                        {salary.status?.charAt(0).toUpperCase() + salary.status?.slice(1) || "Unknown"}
                      </span>
                    </td>
                    <td>
                      <Edit className="cursor-pointer mr-2" onClick={() => handleEditSalary(salary)} />
                      <Delete
                        className="cursor-pointer ml-2"
                        style={{ color: red[500] }}
                        onClick={() => handleDeleteClick(salary)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center mt-4">
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg" onClick={() => setIsModalOpen(true)}>
              + Add Salary
            </button>
            <div className="flex space-x-2">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-3 py-1 rounded-lg ${
                    currentPage === index + 1 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Salary Registration Popup */}
          <AddSalary
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onRegister={handleRegister}
            labourList={labourList}
            projectId={projectId}
          />

          <EditSalaryForm
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveEdit}
            salary={editingSalary}
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
  )
}

export default LabourerSalary