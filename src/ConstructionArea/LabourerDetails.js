import { Delete, Edit } from "@mui/icons-material";
import { red } from "@mui/material/colors";
import React, { useState, useEffect } from "react";
import AddLabourer from "./AddLabor";
import EditLaborForm from "./EditForms/EditLaborForm";
import labourService from "../services/labourService";
import ConfirmPasswordModal from "../components/ConfirmPasswordModal";

const LabourerDetails = ({ projectId }) => {
  //For password state when Editing
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingEditLabor, setPendingEditLabor] = useState(null);

  //For handling state while deletion
  const [isDeleting, setIsDeleting] = useState(false);

  //States for editing materials
  const [editingLabor, setEditingLabor] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [sortLabour, setSortLabour] = useState("Newest");
  const [currentPage, setCurrentPage] = useState(1);
  const labourersPerPage = 8;

  const [labourers, setLabourers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  //Fetch details from database
  const totalPages = Math.ceil(labourers.length / labourersPerPage);

  //For labourer adding
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch labourers from API
  const fetchLabourers = async () => {
    try {
      setLoading(true);
      setError("");
      
      const labourersData = await labourService.getLabourers({ projectId });
      setLabourers(labourersData);
    } catch (err) {
      setError(err.message || "Failed to fetch labourers");
      console.error("Error fetching labourers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchLabourers();
    }
  }, [projectId]);

  // Update handleRegister to use API
  const handleRegister = async (newLabourer) => {
    try {
      await labourService.createLabourer({
        ...newLabourer,
        project: projectId
      });
      fetchLabourers(); // Refresh the list
    } catch (err) {
      setError(err.message || "Failed to register labourer");
    }
  };

  const handleSort = (order) => {
    setSortLabour(order);

    let sortedLaboures = [...labourers];

    if (order === "Newest") {
      sortedLaboures.sort((a, b) => new Date(b.id) - new Date(a.id));
    } else if (order === "Oldest") {
      sortedLaboures.sort((a, b) => new Date(a.id) - new Date(b.id));
    } else if (order === "Name") {
      sortedLaboures.sort((a, b) => a.name.localeCompare(b.name));
    }

    setLabourers(sortedLaboures);
  };

  //Labor details editing function
  const handleEditLabor = (labourer) => {
    setPendingEditLabor(labourer);
    setIsPasswordModalOpen(true);
  };

  const onPasswordVerified = async () => {
    if (isDeleting) {
      await handleDeleteLabor();
    } else {
      setEditingLabor(pendingEditLabor);
      setIsEditModalOpen(true);
    }
  };

    // Update handleSaveEdit to use API
  const handleSaveEdit = async (updatedLabor) => {
    try {
      await labourService.updateLabourer(editingLabor._id, updatedLabor);
      fetchLabourers(); // Refresh the list
      setIsEditModalOpen(false);
    } catch (err) {
      setError(err.message || "Failed to update labourer");
    }
  };

  //Function for labor deteliting
  const handleDeleteClick = (labourer) => {
    setPendingEditLabor(labourer); // reuse the same pending variable
    setIsDeleting(true);
    setIsPasswordModalOpen(true);
  };

  // Update handleDeleteLabor to use API
  const handleDeleteLabor = async () => {
    try {
      await labourService.deleteLabourer(pendingEditLabor._id);
      fetchLabourers(); // Refresh the list
      setPendingEditLabor(null);
      setIsPasswordModalOpen(false);
    } catch (err) {
      setError(err.message || "Failed to delete labourer");
    }
  };

  return (
    <div className="flex flex-col h-max w-full p-4 bg-white rounded-lg">
      {/* Sorting & Title Section */}
      <div className="flex justify-between items-center ">
        <h3 className="text-lg font-bold text-black">All Labourers</h3>

        {/* Sorting Dropdown */}
        <div className="flex items-center">
          <label className="mr-2 text-gray-700 font-semibold">Sort By:</label>
          <select
            className="p-2 border rounded-md"
            value={sortLabour}
            onChange={(e) => handleSort(e.target.value)}
          >
            <option value="Newest">Newest</option>
            <option value="Oldest">Oldest</option>
            <option value="Name">Name</option>
          </select>
        </div>
      </div>
      <div className="flex-grow overflow-auto mt-4">
        <div>
          <table className="w-full border-collapse border border-gray-300 text-center">
            <thead>
              <tr className="text-gray-500">
                <th className="border border-gray-300 p-2">Labourer ID</th>
                <th className="border border-gray-300 p-2">Name</th>
                <th className="border border-gray-300 p-2">Phone Number</th>
                <th className="border border-gray-300 p-2">
                  Skilled / Non Skilled
                </th>
                <th className="border border-gray-300 p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {labourers
                .slice(
                  (currentPage - 1) * labourersPerPage,
                  currentPage * labourersPerPage
                )
                .map((labourer, index) => (
                  <tr key={index} className="border border-gray-300">
                    <td className="border border-gray-300 p-2">
                      {labourer.labourId || labourer.id} {/* Use labourId from API */}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {labourer.name}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {labourer.contact || labourer.phone} {/* Use contact from API */}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {labourer.skillLevel || labourer.skill} {/* Use skillLevel from API */}
                    </td>
                    <td>
                      <Edit 
                        className="cursor-pointer mr-2" 
                        onClick={() => handleEditLabor(labourer)}
                      />
                      <Delete 
                        className="cursor-pointer ml-2" 
                        style={{ color: red[500] }} 
                        onClick={() => handleDeleteClick(labourer)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center mt-4">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-lg"
              onClick={() => setIsModalOpen(true)}
            >
              + Add Labourer
            </button>
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
          </div>
          {/* Labourer Registration Popup by this */}
          <AddLabourer
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onRegister={handleRegister}
            projectId={projectId} // This must be passed correctly
          />
          <EditLaborForm
            isOpen={isEditModalOpen}
            onClose={()=>setIsEditModalOpen(false)}
            onSave={handleSaveEdit}
            labourer={editingLabor}  
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

export default LabourerDetails;
