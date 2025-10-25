import React, { useState, useEffect } from "react";
import { Delete, Edit } from "@mui/icons-material";
import { red } from "@mui/material/colors";
import AddMaterialForm from "./AddMaterialForm";
import EditMaterialForm from "./EditForms/EditMaterialForm";
import siteMaterialService from "../services/siteMaterialService";
import ConfirmPasswordModal from "../components/ConfirmPasswordModal";

const MaterialStock = ({ projectId }) => {
  console.log("[v0] MaterialStock received projectId:", projectId);

  // Authentication state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingEditMaterial, setPendingEditMaterial] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // UI state
  const [sortOrder, setSortOrder] = useState("Newest");
  const [currentPage, setCurrentPage] = useState(1);
  const materialsPerPage = 8;
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Data state
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch materials from backend
  const fetchProjectMaterials = async () => {
    if (!projectId) {
      console.log("[v0] No projectId provided, skipping materials fetch");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("[v0] Fetching materials for project:", projectId);

      const response = await siteMaterialService.getProjectMaterials(projectId);
      console.log("[v0] Materials response:", response);

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
        console.log("[v0] Formatted materials:", formattedMaterials);
      }
    } catch (err) {
      console.error("[v0] Error fetching project materials:", err);
      setError("Failed to load materials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectMaterials();
  }, [projectId]);

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
      await fetchProjectMaterials(); // Refresh the list
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
    }

    setMaterials(sortedMaterials);
  };

  const handleEditMaterial = (material) => {
    setPendingEditMaterial(material);
    setIsDeleting(false);
    setIsPasswordModalOpen(true);
  };

  const onPasswordVerified = async () => {
    if (isDeleting) {
      await handleDeleteMaterial();
    } else {
      setEditingMaterial(pendingEditMaterial);
      setIsEditModalOpen(true);
    }
  };

  // Function for material deletion
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

  // Saving edited material record
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

  const totalPages = Math.ceil(materials.length / materialsPerPage);

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full p-4 bg-white shadow-md rounded-lg">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading materials...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full w-full p-4 bg-white shadow-md rounded-lg">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
          <button onClick={fetchProjectMaterials} className="ml-4 bg-green-500 text-white px-4 py-2 rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex flex-col h-full w-full p-4 bg-white shadow-md rounded-lg">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No project selected</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full p-4 bg-white shadow-md rounded-lg">
      <div className="text-sm text-gray-600 mb-2">Project ID: {projectId}</div>

      {/* Sorting & Title Section */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-black">Material Stock</h3>

        {/* Sorting Dropdown */}
        <div className="flex items-center">
          <label className="mr-2 text-gray-700 font-semibold">Sort By:</label>
          <select
            className="p-2 border rounded-md"
            value={sortOrder}
            onChange={(e) => handleSort(e.target.value)}
          >
            <option value="Newest">Newest</option>
            <option value="Oldest">Oldest</option>
            <option value="Name">Name</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-grow overflow-auto mt-4">
        <div>
          {materials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No materials found for this site. Add your first material to get started.
            </div>
          ) : (
            <table className="w-full border-collapse border border-gray-300 text-center">
              <thead>
                <tr className="text-gray-500">
                  <th className="border border-gray-300 p-2 font-normal">Material Name</th>
                  <th className="border border-gray-300 p-2 font-normal">Supplier</th>
                  <th className="border border-gray-300 p-2 font-normal">Quantity</th>
                  <th className="border border-gray-300 p-2 font-normal">Received Date</th>
                  <th className="border border-gray-300 p-2 font-normal">Action</th>
                </tr>
              </thead>
              <tbody>
                {materials
                  .slice((currentPage - 1) * materialsPerPage, currentPage * materialsPerPage)
                  .map((material, index) => (
                    <tr key={material.id || index} className="border border-gray-300">
                      <td className="border border-gray-300 p-2">{material.material}</td>
                      <td className="border border-gray-300 p-2">{material.supplier}</td>
                      <td className="border border-gray-300 p-2">
                        {material.amount} {material.amountType}
                      </td>
                      <td className="border border-gray-300 p-2">{material.recDate}</td>
                      <td className="border border-gray-300 p-2">
                        <Edit
                          className="cursor-pointer mr-2"
                          onClick={() => handleEditMaterial(material)}
                        />
                        <Delete
                          className="cursor-pointer ml-2"
                          style={{ color: red[500] }}
                          onClick={() => handleDeleteClick(material)}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* Pagination & Add Button */}
          <div className="flex justify-between items-center mt-4">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              onClick={() => setIsModalOpen(true)}
            >
              + Add Material
            </button>

            {materials.length > 0 && (
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

          {/* Add Material Modal */}
          <AddMaterialForm
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onRegister={handleAddMaterial}
          />

          <EditMaterialForm
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveEdit}
            material={editingMaterial}
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

export default MaterialStock;