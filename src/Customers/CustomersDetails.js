"use client"

import { Delete, Edit, Search } from "@mui/icons-material"
import { red } from "@mui/material/colors"
import { useState, useEffect } from "react"
import AddSubContractor from "./AddSubContractor"
import EditSubContractor from "./EditSubContractor"
import { Link } from "react-router-dom"
import subcontractorService from "../services/subcontractorService"
import { useErrorHandler } from "../hooks/useErrorHandler"
import LoadingSpinner from "../components/LoadingSpinner"
import ConfirmPasswordModal from "../components/ConfirmPasswordModal"

const CustomersDetails = () => {
  const [subcontractors, setSubcontractors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [pendingEditCustomer, setPendingEditCustomer] = useState(null)
  const [isSubContractorModalOpen, setIsSubContractorModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortCustomer, setSortCustomer] = useState("Newest")
  const [currentPage, setCurrentPage] = useState(1)
  const customersPerPage = 8

  const { handleError } = useErrorHandler()

  useEffect(() => {
    fetchSubcontractors()
  }, [])

  const fetchSubcontractors = async () => {
    try {
      setIsLoading(true)
      console.log("[v0] Fetching subcontractors...")
      const response = await subcontractorService.getAllSubcontractors()
      console.log("[v0] API Response:", response)

      if (response && response.subcontractors) {
        setSubcontractors(response.subcontractors)
        console.log("[v0] Subcontractors loaded:", response.subcontractors.length)
      } else if (Array.isArray(response)) {
        // Handle case where response is directly an array
        setSubcontractors(response)
        console.log("[v0] Subcontractors loaded as array:", response.length)
      } else {
        console.log("[v0] Unexpected response structure:", response)
        setSubcontractors([])
      }
    } catch (error) {
      console.log("[v0] Fetch error:", error)
      handleError(error, "Failed to fetch subcontractors")
      setSubcontractors([]) // Set empty array on error to prevent crashes
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSubcontractors = subcontractors.filter(
    (subcontractor) =>
      subcontractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcontractor.nic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcontractor.contractType.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredSubcontractors.length / customersPerPage)

  const handleAddSubContractor = async (newSubcontractor) => {
    await fetchSubcontractors() // Refresh the list
    setIsSubContractorModalOpen(false)
  }

  const handleUpdateSubContractor = async (updatedSubcontractor) => {
    await fetchSubcontractors() // Refresh the list
    setIsEditModalOpen(false)
    setEditingCustomer(null)
  }

  const handleEditCustomer = (subcontractor) => {
    setPendingEditCustomer(subcontractor)
    setIsDeleting(false)
    setIsPasswordModalOpen(true)
  }

  const onPasswordVerified = async () => {
    if (isDeleting) {
      await handleDeleteCustomer()
    } else {
      setEditingCustomer(pendingEditCustomer)
      setIsEditModalOpen(true)
    }
  }

  const handleDeleteClick = (subcontractor) => {
    setPendingEditCustomer(subcontractor)
    setIsDeleting(true)
    setIsPasswordModalOpen(true)
  }

  const handleDeleteCustomer = async () => {
    try {
      await subcontractorService.deleteSubcontractor(pendingEditCustomer._id)
      await fetchSubcontractors() // Refresh the list
      setPendingEditCustomer(null)
    } catch (error) {
      handleError(error, "Failed to delete subcontractor")
    }
  }

  const handleSort = (order) => {
    setSortCustomer(order)

    const sortedSubcontractors = [...filteredSubcontractors]

    if (order === "Newest") {
      sortedSubcontractors.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (order === "Oldest") {
      sortedSubcontractors.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    } else if (order === "Name") {
      sortedSubcontractors.sort((a, b) => a.name.localeCompare(b.name))
    }

    setSubcontractors(sortedSubcontractors)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col p-4 bg-white h-full rounded-lg shadow-md">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-bold">Sub-Contractor Details</h3>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 p-2 border rounded-lg focus:ring-2 focus:ring-green-400 shadow-md">
            <Search />
            <input
              placeholder="Search"
              className="focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center ">
            <label className="mr-2 text-gray-700 font-semibold">Sort By:</label>
            <select className="p-2 border rounded-md" value={sortCustomer} onChange={(e) => handleSort(e.target.value)}>
              <option value="Newest">Newest</option>
              <option value="Oldest">Oldest</option>
              <option value="Name">Name</option>
            </select>
          </div>
        </div>
      </div>
      <div>
        <table className="w-full border text-center">
          <thead>
            <tr className="text-gray-500">
              <th className="border border-gray-300 p-2">Contract ID</th>
              <th className="border border-gray-300 p-2">Name</th>
              <th className="border border-gray-300 p-2">NIC No</th>
              <th className="border border-gray-300 p-2">Phone Number</th>
              <th className="border border-gray-300 p-2">Address</th>
              <th className="border border-gray-300 p-2">Type of Contract</th>
              <th className="border border-gray-300 p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubcontractors
              .slice((currentPage - 1) * customersPerPage, currentPage * customersPerPage)
              .map((subcontractor, index) => (
                <tr key={subcontractor._id} className="border border-gray-300 hover:bg-green-200">
                  <td className="border border-gray-300 p-2">{subcontractor.contractId}</td>
                  <td className="border border-gray-300 p-2">
                    <Link to={`/customers/details/${subcontractor._id}`}>{subcontractor.name}</Link>
                  </td>
                  <td className="border border-gray-300 p-2">{subcontractor.nic}</td>
                  <td className="border border-gray-300 p-2">{subcontractor.phone}</td>
                  <td className="border border-gray-300 p-2">{subcontractor.address}</td>
                  <td className="border border-gray-300 p-2">{subcontractor.contractType}</td>
                  <td className="items-center">
                    <Edit className="cursor-pointer mr-2" onClick={() => handleEditCustomer(subcontractor)} />
                    <Delete
                      className="cursor-pointer ml-2"
                      style={{ color: red[500] }}
                      onClick={() => handleDeleteClick(subcontractor)}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {filteredSubcontractors.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? "No subcontractors found matching your search." : "No subcontractors registered yet."}
          </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            onClick={() => setIsSubContractorModalOpen(true)}
          >
            + Add Sub-Contractor
          </button>

          <AddSubContractor
            isOpen={isSubContractorModalOpen}
            onClose={() => setIsSubContractorModalOpen(false)}
            onRegister={handleAddSubContractor}
          />

          <EditSubContractor
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false)
              setEditingCustomer(null)
            }}
            subcontractor={editingCustomer}
            onUpdate={handleUpdateSubContractor}
          />

          {totalPages > 1 && (
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
          )}
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

export default CustomersDetails