import React, { useState, useEffect } from "react";
import { Delete, Edit, ArrowBack, Add, FilterList, Inventory } from "@mui/icons-material";
import AddMaterialForm from "./AddMaterialForm";
import EditMaterialForm from "./EditForms/EditMaterialForm";
import siteMaterialService from "../services/siteMaterialService";
import { useLocation, useNavigate } from "react-router-dom";

const MaterialStockSupervisor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const projectId = location.state?.projectId;

  // Authentication state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingEditMaterial, setPendingEditMaterial] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // UI state
  const [sortOrder, setSortOrder] = useState("Newest");
  const [currentPage, setCurrentPage] = useState(1);
  const materialsPerPage = 10;
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Data state
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectName, setProjectName] = useState("");

  // Fetch materials from backend
  const fetchProjectMaterials = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await siteMaterialService.getProjectMaterials(projectId);

      if (response && response.data) {
        const formattedMaterials = response.data.materials.map((material) => ({
          id: material._id,
          material: material.material,
          supplier: material.supplier,
          amount: material.amount.toString(),
          amountType: material.amountType,
          recDate: new Date(material.receivedDate).toISOString().split("T")[0],
        }));

        setMaterials(formattedMaterials);
        
        if (response.data.projectName) {
          setProjectName(response.data.projectName);
        }
      }
    } catch (err) {
      console.error("Error fetching project materials:", err);
      setError("Failed to load materials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectMaterials();
  }, [projectId]);

  // Filter materials based on search term
  const filteredMaterials = materials.filter(material =>
    material.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.amountType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function for adding a new material
  const handleAddMaterial = async (newMaterial) => {
    try {
      const materialData = {
        projectId: projectId,
        material: newMaterial.material,
        supplier: newMaterial.supplier,
        amount: Number.parseFloat(newMaterial.amount),
        amountType: newMaterial.amountType,
        receivedDate: newMaterial.recDate,
        status: "received",
      };

      await siteMaterialService.createMaterial(materialData);
      await fetchProjectMaterials();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error adding material:", err);
      setError("Failed to add material. Please try again.");
    }
  };

  const handleSort = (order) => {
    setSortOrder(order);
    let sortedMaterials = [...materials];

    if (order === "Newest") {
      sortedMaterials.sort((a, b) => new Date(b.recDate) - new Date(a.recDate));
    } else if (order === "Oldest") {
      sortedMaterials.sort((a, b) => new Date(a.recDate) - new Date(b.recDate));
    } else if (order === "Name") {
      sortedMaterials.sort((a, b) => a.material.localeCompare(b.material));
    } else if (order === "Quantity") {
      sortedMaterials.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
    }

    setMaterials(sortedMaterials);
  };

  const handleEditMaterial = (material) => {
    setPendingEditMaterial(material);
    setIsDeleting(false);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSubmit = () => {
    const correctPassword = "admin123";

    if (passwordInput === correctPassword) {
      if (isDeleting) {
        handleDeleteMaterial();
      } else {
        setEditingMaterial(pendingEditMaterial);
        setIsEditModalOpen(true);
      }

      setIsPasswordModalOpen(false);
      setPasswordInput("");
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };

  const handleDeleteClick = (material) => {
    setPendingEditMaterial(material);
    setIsDeleting(true);
    setIsPasswordModalOpen(true);
  };

  const handleDeleteMaterial = async () => {
    try {
      await siteMaterialService.deleteMaterial(pendingEditMaterial.id);
      await fetchProjectMaterials();
      setPendingEditMaterial(null);
      setIsPasswordModalOpen(false);
      setPasswordInput("");
      setPasswordError("");
      setIsDeleting(false);
    } catch (err) {
      console.error("Error deleting material:", err);
      setError("Failed to delete material. Please try again.");
    }
  };

  const handleSaveEdit = async (updatedMaterial) => {
    try {
      const materialData = {
        material: updatedMaterial.material,
        supplier: updatedMaterial.supplier,
        amount: Number.parseFloat(updatedMaterial.amount),
        amountType: updatedMaterial.amountType,
        receivedDate: updatedMaterial.recDate,
      };

      await siteMaterialService.updateMaterial(editingMaterial.id, materialData);
      await fetchProjectMaterials();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Error updating material:", err);
      setError("Failed to update material. Please try again.");
    }
  };

  const totalPages = Math.ceil(filteredMaterials.length / materialsPerPage);

  // Statistics
  const stats = {
    totalMaterials: filteredMaterials.length,
    totalQuantity: filteredMaterials.reduce((sum, material) => sum + parseFloat(material.amount), 0),
    uniqueSuppliers: new Set(filteredMaterials.map(m => m.supplier)).size,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center py-8 text-red-600 text-sm">
          {error}
          <button onClick={fetchProjectMaterials} className="ml-2 text-green-600 hover:text-green-800">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center py-8 text-gray-500 text-sm">
          No project selected
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-8">
      {/* Compact Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/supervisordash")}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go Back"
            >
              <ArrowBack size={16} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Material Stock</h1>
              <p className="text-gray-600 text-sm">
                {projectName && `Project: ${projectName} | `}ID: {projectId}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick Stats */}
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">📦 {stats.totalMaterials}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">⚖️ {stats.totalQuantity}</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">🏢 {stats.uniqueSuppliers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        {/* Control Bar */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 border border-gray-300 rounded text-sm w-40 focus:ring-1 focus:ring-green-500"
                />
                <Inventory className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" fontSize="small" />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1 rounded ${showFilters ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                title="Toggle Filters"
              >
                <FilterList fontSize="small" />
              </button>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
            >
              <Add fontSize="small" />
              <span>Add Material</span>
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium">Sort:</span>
                {["Newest", "Oldest", "Name", "Quantity"].map((order) => (
                  <button
                    key={order}
                    onClick={() => handleSort(order)}
                    className={`px-2 py-1 rounded ${
                      sortOrder === order 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {order}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Materials Table */}
        <div className="overflow-auto">
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {searchTerm ? "No materials match your search" : "No materials found. Add your first material to get started."}
            </div>
          ) : (
            <div className="min-w-max">
              {/* Table Header */}
              <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700">
                <div>Material</div>
                <div>Supplier</div>
                <div className="text-right">Quantity</div>
                <div className="text-center">Received</div>
                <div className="text-center">Actions</div>
              </div>

              {/* Table Rows */}
              <div className="max-h-96 overflow-y-auto">
                {filteredMaterials
                  .slice((currentPage - 1) * materialsPerPage, currentPage * materialsPerPage)
                  .map((material, index) => (
                    <div
                      key={material.id || index}
                      className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-1 px-3 py-2 border-b border-gray-100 hover:bg-blue-50 text-sm"
                    >
                      {/* Material Name */}
                      <div className="font-medium truncate" title={material.material}>
                        {material.material}
                      </div>
                      
                      {/* Supplier */}
                      <div className="truncate text-gray-600" title={material.supplier}>
                        {material.supplier}
                      </div>
                      
                      {/* Quantity */}
                      <div className="text-right">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                          {material.amount} {material.amountType}
                        </span>
                      </div>
                      
                      {/* Received Date */}
                      <div className="text-center text-xs text-gray-500">
                        {material.recDate}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex justify-center gap-2">
                        <Edit 
                          className="cursor-pointer text-blue-500 hover:text-blue-700" 
                          fontSize="small"
                          onClick={() => handleEditMaterial(material)} 
                        />
                        <Delete
                          className="cursor-pointer text-red-500 hover:text-red-700"
                          fontSize="small"
                          onClick={() => handleDeleteClick(material)}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {filteredMaterials.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>
                  Showing {((currentPage - 1) * materialsPerPage) + 1} to {Math.min(currentPage * materialsPerPage, filteredMaterials.length)} of {filteredMaterials.length} materials
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  >
                    ◀
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`px-2 py-1 rounded text-xs ${
                        currentPage === index + 1 
                          ? "bg-green-600 text-white" 
                          : "hover:bg-gray-200"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  >
                    ▶
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Material Modal */}
      <AddMaterialForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRegister={handleAddMaterial}
      />

      {/* Edit Material Modal */}
      <EditMaterialForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
        material={editingMaterial}
      />

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">
              {isDeleting ? "Enter Password to Delete" : "Enter Password to Edit"}
            </h3>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password"
              className="w-full p-2 border rounded text-sm mb-2 focus:ring-1 focus:ring-green-500"
            />
            {passwordError && <p className="text-xs text-red-600 mb-2">{passwordError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordInput("");
                  setPasswordError("");
                }}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handlePasswordSubmit} 
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialStockSupervisor;