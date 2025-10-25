import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter,
  FaSort,
  FaArrowLeft,
  FaEye,
  FaSortUp,
  FaSortDown
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { labourService } from "../services/labourService";
import AddLabourer from "./AddLabor";
import EditLabourForm from "./EditForms/EditLaborForm";
import { useNavigate } from "react-router-dom";

const ModernLabourerDetails = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get projectId from navigation state
  const projectId = location.state?.projectId;
  
  const [labourers, setLabourers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSkill, setFilterSkill] = useState("all");
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLabourer, setEditingLabourer] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  // Fetch labourers
  const fetchLabourers = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const labourersData = await labourService.getLabourers({ projectId });
      setLabourers(labourersData);
    } catch (err) {
      setError(err.message || "Failed to fetch labourers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabourers();
  }, [projectId]);

  // Add this useEffect to refresh data when component gains focus
    useEffect(() => {
        const handleFocus = () => {
        fetchLabourers();
        };
    
        window.addEventListener('focus', handleFocus);
        
        return () => {
        window.removeEventListener('focus', handleFocus);
        };
    }, []);


  // Handle sorting
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort labourers
  const filteredAndSortedLabourers = React.useMemo(() => {
    let filtered = labourers.filter(labourer => {
      const matchesSearch = labourer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           labourer.contact?.includes(searchTerm) ||
                           labourer.labourId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSkill = filterSkill === "all" || labourer.skillLevel === filterSkill;
      
      return matchesSearch && matchesSkill;
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'baseSalary') {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [labourers, searchTerm, filterSkill, sortConfig]);

  // Handle actions with password verification
  const handleActionWithPassword = (labourer, action) => {
    setPendingAction({ labourer, action });
    setIsPasswordModalOpen(true);
  };

  const verifyPassword = () => {
    const correctPassword = "admin123";
    if (passwordInput === correctPassword) {
      if (pendingAction.action === "edit") {
        setEditingLabourer(pendingAction.labourer);
        setIsEditModalOpen(true);
      } else if (pendingAction.action === "delete") {
        handleDeleteLabourer(pendingAction.labourer._id);
      }
      setIsPasswordModalOpen(false);
      setPasswordInput("");
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };

  // Handle delete
  const handleDeleteLabourer = async (id) => {
    try {
      await labourService.deleteLabourer(id);
      fetchLabourers();
    } catch (err) {
      setError(err.message || "Failed to delete labourer");
    }
  };

  // Handle register new labourer
  // In ModernLabourerDetails.js - update the handleRegister function
const handleRegister = async (newLabourer) => {
    try {
      // If it's an optimistic update (temporary data), add it to the list immediately
      if (newLabourer.isOptimistic) {
        setLabourers(prev => [newLabourer, ...prev]);
      } else {
        // If it's the real data from backend, replace the optimistic entry
        setLabourers(prev => prev.map(lab => 
          lab._id === newLabourer._id || lab.isOptimistic ? newLabourer : lab
        ));
      }
      
      // Close modal only if it's not an optimistic update
      if (!newLabourer.isOptimistic) {
        setIsAddModalOpen(false);
      }
    } catch (err) {
      setError("Failed to update labourer list");
      console.error("Update error:", err);
    }
  };

  // Handle save edit
  const handleSaveEdit = async (updatedLabourer) => {
    try {
      await labourService.updateLabourer(editingLabourer._id, updatedLabourer);
      fetchLabourers();
      setIsEditModalOpen(false);
      setEditingLabourer(null);
    } catch (err) {
      setError(err.message || "Failed to update labourer");
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <FaSort className="ml-1 opacity-50" size={12} />;
    
    return sortConfig.direction === 'ascending' 
      ? <FaSortUp className="ml-1 text-green-600" size={14} />
      : <FaSortDown className="ml-1 text-green-600" size={14} />;
  };

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600 mb-2">No Project Selected</div>
          <p className="text-gray-500 mb-6">Please select a project to view labourer details.</p>
          <button
            onClick={() => navigate("/supervisordash")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with Back Button */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/supervisordash")}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Labourer Management</h1>
              <p className="text-gray-600">Manage labourers for your construction site</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <FaPlus size={16} />
            Add Labourer
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search labourers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Skill Filter */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <select
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Skills</option>
              <option value="Skilled">Skilled</option>
              <option value="Non">Non-Skilled</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-end text-gray-600">
            <span className="text-sm">
              {filteredAndSortedLabourers.length} labourer{filteredAndSortedLabourers.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('labourId')}
                >
                  <div className="flex items-center">
                    Labourer ID
                    <SortIcon columnKey="labourId" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name
                    <SortIcon columnKey="name" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('contact')}
                >
                  <div className="flex items-center">
                    Contact
                    <SortIcon columnKey="contact" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('skillLevel')}
                >
                  <div className="flex items-center">
                    Skill Level
                    <SortIcon columnKey="skillLevel" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('baseSalary')}
                >
                  <div className="flex items-center">
                    Salary (LKR)
                    <SortIcon columnKey="baseSalary" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded"></div></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-red-600 mb-4">{error}</div>
                    <button
                      onClick={fetchLabourers}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg"
                    >
                      Try Again
                    </button>
                  </td>
                </tr>
              ) : filteredAndSortedLabourers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500 mb-4">No labourers found</div>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                    >
                      Add First Labourer
                    </button>
                  </td>
                </tr>
              ) : (
                filteredAndSortedLabourers.map((labourer) => (
                  <tr key={labourer._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {labourer.labourId || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{labourer.name || "Unknown"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{labourer.contact || "No contact"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        labourer.skillLevel === "Skilled" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {labourer.skillLevel || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        LKR {labourer.baseSalary?.toLocaleString() || "0"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleActionWithPassword(labourer, "edit")}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleActionWithPassword(labourer, "delete")}
                          className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                          title="Delete"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddLabourer
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onRegister={handleRegister}
        projectId={projectId}
      />

      <EditLabourForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingLabourer(null);
        }}
        onSave={handleSaveEdit}
        labourer={editingLabourer}
      />

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Enter Password</h3>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter admin password"
              className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-green-500"
            />
            {passwordError && (
              <p className="text-red-600 text-sm mb-3">{passwordError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordInput("");
                  setPasswordError("");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={verifyPassword}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernLabourerDetails;