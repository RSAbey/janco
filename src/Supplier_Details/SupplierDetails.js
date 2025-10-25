import { Delete, Edit, Search } from "@mui/icons-material";
import { red } from "@mui/material/colors";
import React, { useState, useEffect } from "react";
import AddSupplier from "./AddSupplier";
import EditSupplier from "./EditSupplier";
import { Link } from "react-router-dom";
import { supplierService } from "../services/supplierService";
import { useErrorHandler } from "../hooks/useErrorHandler";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmPasswordModal from "../components/ConfirmPasswordModal";

const SupplierDetails = () => {
  // For password state when Editing
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingEditSupplier, setPendingEditSupplier] = useState(null);

  // For handling state while deletion
  const [isDeleting, setIsDeleting] = useState(false);

  // States for editing materials
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const suppliersPerPage = 8;
  const [totalPages, setTotalPages] = useState(1);
  
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const { handleError } = useErrorHandler();

  // Fetch suppliers from the database
  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching suppliers from database...");
      
      const filters = {};
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      const suppliersData = await supplierService.getSuppliers(filters);
      
      // Sort suppliers based on selection
      let sortedSuppliers = [...suppliersData];
      if (sortBy === "newest") {
        sortedSuppliers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortBy === "oldest") {
        sortedSuppliers.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sortBy === "name") {
        sortedSuppliers.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      setSuppliers(sortedSuppliers);
      setTotalPages(Math.ceil(sortedSuppliers.length / suppliersPerPage));
      
      // Reset to first page when data changes
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      handleError(error, "Failed to fetch suppliers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [searchTerm, sortBy]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle adding a new supplier - UPDATED
  const handleAddSupplier = async (newSupplier) => {
    try {
      // Refresh the supplier list
      await fetchSuppliers();
      setIsModalOpen(false);
    } catch (error) {
      handleError(error, "Failed to add supplier");
    }
  };

  // Supplier editing function
  const handleEditSupplier = (supplier) => {
    setPendingEditSupplier(supplier);
    setIsDeleting(false);
    setIsPasswordModalOpen(true);
  };

  // Update the handleSaveEdit function
  const handleSaveEdit = async (updatedSupplier) => {
    try {
      await supplierService.updateSupplier(editingSupplier._id, updatedSupplier);
      await fetchSuppliers(); // Refresh the supplier list
      setIsEditModalOpen(false);
    } catch (error) {
      handleError(error, "Failed to update supplier");
    }
  };

  const onPasswordVerified = async () => {
    if (isDeleting) {
      await handleDeleteSupplier();
    } else {
      setEditingSupplier(pendingEditSupplier);
      setIsEditModalOpen(true);
    }
  };

  // Function for supplier deletion
  const handleDeleteClick = (supplier) => {
    setPendingEditSupplier(supplier);
    setIsDeleting(true);
    setIsPasswordModalOpen(true);
  };

  const handleDeleteSupplier = async () => {
    try {
      await supplierService.deleteSupplier(pendingEditSupplier._id);
      // Refresh the supplier list
      await fetchSuppliers();
      setPendingEditSupplier(null);
      setIsPasswordModalOpen(false);
      setPasswordInput("");
      setPasswordError("");
    } catch (error) {
      // Show specific error message if it's about associated orders
      if (error.message.includes("associated purchase orders")) {
        handleError(error, error.message);
      } else {
        handleError(error, "Failed to delete supplier");
      }
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 bg-white h-full rounded-lg shadow-md">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-bold">All Suppliers</h3>
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
          <div className="flex items-center ">
            <label className="mr-2 text-gray-700 font-semibold">Sort By:</label>
            <select className="p-2 border rounded-md" value={sortBy} onChange={handleSortChange}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>
      <div>
        <table className="w-full border text-center">
        <thead>
        <tr className="text-gray-500 ">
          <th className="border border-gray-300 p-2">Supplier Company</th>
          <th className="border border-gray-300 p-2">Location</th>
          <th className="border border-gray-300 p-2">Phone Number</th>
          <th className="border border-gray-300 p-2">Bank Name</th>
          <th className="border border-gray-300 p-2">Account Number</th>
          <th className="border border-gray-300 p-2">Branch</th>
          <th className="border border-gray-300 p-2">Payment Terms</th>
          <th className="border border-gray-300 p-2">Supply Status</th>
          <th className="border border-gray-300 p-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {suppliers.length > 0 ? (
          suppliers
            .slice(
              (currentPage - 1) * suppliersPerPage,
              currentPage * suppliersPerPage
            )
            .map((supplier, index) => {
              return (
                <tr
                  key={supplier._id || index}
                  className="border border-gray-300 hover:bg-green-200"
                >
                  <td className="border border-gray-300 p-2">
                    <Link
                      to={
                        supplier._id
                          ? `/suppliers/invoice/${supplier._id}`
                          : "#"
                      }
                    >
                      {supplier.name}
                    </Link>
                  </td>
                  <td className="border border-gray-300 p-2">
                    {supplier.address?.city || "N/A"}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {supplier.contactInfo?.primaryContact?.phone || "N/A"}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {supplier.bankDetails?.bankName || "N/A"}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {supplier.bankDetails?.accountNumber || "N/A"}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {supplier.bankDetails?.branch || "N/A"}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {supplier.financialInfo?.paymentTerms || "N/A"}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {supplier.status === "active" ? "Active" : "Inactive"}
                  </td>
                  <td className="items-center">
                    <Edit
                      className="cursor-pointer mr-2"
                      onClick={() => handleEditSupplier(supplier)}
                    />
                    <Delete
                      className="cursor-pointer ml-2"
                      style={{ color: red[500] }}
                      onClick={() => handleDeleteClick(supplier)}
                    />
                  </td>
                </tr>
              );
            })
        ) : (
          <tr>
            <td colSpan="9" className="p-4 text-center text-gray-500">
              No suppliers found
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
            + Add Supplier
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
        {/* Supplier Registration Popup by this */}
        <AddSupplier
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onRegister={handleAddSupplier}
        />
        <EditSupplier
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
          supplier={editingSupplier}
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

export default SupplierDetails;