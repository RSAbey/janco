import React, { useState, useEffect } from "react";
import { Search, Delete, Edit } from '@mui/icons-material';
import { red } from "@mui/material/colors";
import AddMaterialForm from "./AddMaterial";
import { materialService } from "../services/materialService";
import { useErrorHandler } from "../hooks/useErrorHandler";
import LoadingSpinner from "../components/LoadingSpinner";
import EditMaterialForm from "./EditMaterialForm";
import ConfirmPasswordModal from "../components/ConfirmPasswordModal";

const MaterialDetails = () => {
  const [materials, setMaterials] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  
  // For password state when Editing/Deleting
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingActionMaterial, setPendingActionMaterial] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // States for editing materials
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const materialsPerPage = 8;
  const { handleError } = useErrorHandler();

  // Fetch materials from the database
  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching materials from database...");
      
      const materialsData = await materialService.getMaterials();
      
      // Sort materials based on selection
      let sortedMaterials = [...materialsData];
      if (sortBy === "newest") {
        sortedMaterials.sort((a, b) => new Date(b.receivedDate || b.recDate) - new Date(a.receivedDate || a.recDate));
      } else if (sortBy === "oldest") {
        sortedMaterials.sort((a, b) => new Date(a.receivedDate || a.recDate) - new Date(b.receivedDate || b.recDate));
      } else if (sortBy === "name") {
        sortedMaterials.sort((a, b) => (a.name || a.material).localeCompare(b.name || b.material));
      }
      
      // Filter by search term if provided
      if (searchTerm) {
        sortedMaterials = sortedMaterials.filter(material => 
          (material.name || material.material).toLowerCase().includes(searchTerm.toLowerCase()) ||
          material.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      setMaterials(sortedMaterials);
      // Reset to first page when data changes
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching materials:", error);
      handleError(error, "Failed to fetch materials");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [searchTerm, sortBy]);

  const totalPages = Math.ceil(materials.length / materialsPerPage);

  // Handle adding a new material - UPDATED
  const handleAddMaterial = async (newMaterial) => {
    try {
      // Refresh the material list
      await fetchMaterials();
      setIsModalOpen(false);
    } catch (error) {
      handleError(error, "Failed to add material");
    }
  };

  // Handle editing a material
  const handleEditMaterial = (material) => {
    setPendingActionMaterial(material);
    setIsDeleting(false);
    setIsPasswordModalOpen(true);
  };

  // Handle deleting a material
  const handleDeleteClick = (material) => {
    setPendingActionMaterial(material);
    setIsDeleting(true);
    setIsPasswordModalOpen(true);
  };

  const onPasswordVerified = async () => {
    if (isDeleting) {
      await handleDeleteMaterial();
    } else {
      setEditingMaterial(pendingActionMaterial);
      setIsEditModalOpen(true);
    }
  };

  // Delete material function
  const handleDeleteMaterial = async () => {
    try {
      await materialService.deleteMaterial(pendingActionMaterial._id);
      // Refresh the material list
      await fetchMaterials();
      setPendingActionMaterial(null);
    } catch (error) {
      handleError(error, "Failed to delete material");
    }
  };

  // Save edited material
  const handleSaveEdit = async (updatedMaterialData) => {
    try {
      // Convert the data to match the API expectations
      const apiData = {
        name: updatedMaterialData.name,
        supplier: updatedMaterialData.supplier,
        quantity: parseFloat(updatedMaterialData.quantity),
        unit: updatedMaterialData.unit,
        receivedDate: updatedMaterialData.receivedDate,
        description: updatedMaterialData.description
      };
      
      await materialService.updateMaterial(editingMaterial._id, apiData);
      // Refresh the material list
      await fetchMaterials();
      setIsEditModalOpen(false);
      setEditingMaterial(null);
    } catch (error) {
      console.error("Error updating material:", error);
      handleError(error, "Failed to update material");
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // Helper function to get display values for material
  const getMaterialDisplayName = (material) => {
    return material.name || material.material;
  };

  const getMaterialQuantity = (material) => {
    return material.quantity || material.amount;
  };

  const getMaterialUnit = (material) => {
    return material.unit || material.amountType;
  };

  const getMaterialDate = (material) => {
    return material.receivedDate || material.recDate;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full p-4 bg-white shadow-md rounded-lg">
      {/* Sorting & Title Section */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-black">Material Database</h3>
        
        {/* Searching & Sorting Dropdown */}
        <div className='flex items-center gap-4'>
          <div className='flex gap-2 p-2 border rounded-lg focus:ring-2 focus:ring-green-400 shadow-md'>
            <Search/>
            <input
              placeholder='Search'
              className='focus:outline-none'
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="flex items-center">
            <label className="mr-2 text-gray-700 font-semibold">Sort By:</label>
            <select
              className="p-2 border rounded-md"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-grow overflow-auto mt-4">
        <table className="w-full border-collapse border border-gray-300 text-center">
          <thead>
            <tr className="text-gray-500">
              <th className="border border-gray-300 p-2 w-1/6">Material Name</th>
              <th className="border border-gray-300 p-2 w-1/6">Supplier</th>
              <th className="border border-gray-300 p-2 w-1/6">Quantity</th>
              <th className="border border-gray-300 p-2 w-1/6">Received Date</th>
              <th className="border border-gray-300 p-2 w-1/6">Description</th>
              <th className="border border-gray-300 p-2 w-1/6">Action</th>
            </tr>
          </thead>
          <tbody>
            {materials.length > 0 ? (
              materials
                .slice((currentPage - 1) * materialsPerPage, currentPage * materialsPerPage)
                .map((material, index) => (
                  <tr key={material._id || index} className="border border-gray-300 hover:bg-green-50">
                    <td className="border border-gray-300 p-2">
                      {getMaterialDisplayName(material)}
                    </td>
                    <td className="border border-gray-300 p-2">
                        {material.supplier}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {getMaterialQuantity(material)} {getMaterialUnit(material)}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {new Date(getMaterialDate(material)).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 p-2 text-sm">
                      {material.description || "No description"}
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex justify-center items-center">
                        <Edit
                          className="cursor-pointer mr-3"
                          onClick={() => handleEditMaterial(material)}
                        />
                        <Delete
                          className="cursor-pointer"
                          style={{ color: red[500] }}
                          onClick={() => handleDeleteClick(material)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No materials found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination & Add Button */}
        <div className="flex justify-between items-center mt-4">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            onClick={() => setIsModalOpen(true)}
          >
            + Add Material
          </button>
          
          {totalPages > 1 && (
            <div className="flex space-x-2">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-3 py-1 rounded-lg ${
                    currentPage === index + 1
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add Material Modal */}
        <AddMaterialForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddMaterial={handleAddMaterial}
        />
        
        {/* Edit Material Modal */}
        <EditMaterialForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
          material={editingMaterial}
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

export default MaterialDetails;