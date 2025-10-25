import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter,
  FaSortUp,
  FaSortDown,
  FaArrowLeft,
  FaMoneyBillWave,
  FaSync
} from "react-icons/fa";
import labourService from "../services/labourService";
import AddSalary from "./AddSalary";
import EditSalaryForm from "./EditForms/EditSalaryForm";

const SupervisorLabourerSalary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const projectId = location.state?.projectId;
  
  const [salaries, setSalaries] = useState([]);
  const [labourList, setLabourList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  // Fetch salaries from API
  const fetchSalaries = async () => {
    try {
      setLoading(true);
      setError("");
      const salariesData = await labourService.getAllSalaries({ projectId });
      setSalaries(salariesData);
    } catch (err) {
      setError(err.message || "Failed to fetch salaries");
      console.error("Error fetching salaries:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch labourers for the dropdown
  const fetchLabourers = async () => {
    try {
      const labourersData = await labourService.getLabourers({ projectId });
      setLabourList(labourersData);
    } catch (err) {
      console.error("Error fetching labourers:", err);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchSalaries();
      fetchLabourers();
    }
  }, [projectId]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort salaries
  const filteredAndSortedSalaries = React.useMemo(() => {
    let filtered = salaries.filter(salary => {
      const matchesSearch = salary.labour?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           salary.labour?.contact?.includes(searchTerm) ||
                           salary.labour?.labourId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || salary.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested properties
        if (sortConfig.key === 'name' || sortConfig.key === 'contact' || sortConfig.key === 'labourId') {
          aValue = a.labour?.[sortConfig.key];
          bValue = b.labour?.[sortConfig.key];
        }

        if (sortConfig.key === 'amount') {
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
  }, [salaries, searchTerm, filterStatus, sortConfig]);

  // Handle actions with password verification
  const handleActionWithPassword = (salary, action) => {
    setPendingAction({ salary, action });
    setIsPasswordModalOpen(true);
  };

  const verifyPassword = () => {
    const correctPassword = "admin123";
    if (passwordInput === correctPassword) {
      if (pendingAction.action === "edit") {
        setEditingSalary(pendingAction.salary);
        setIsEditModalOpen(true);
      } else if (pendingAction.action === "delete") {
        handleDeleteSalary(pendingAction.salary._id);
      }
      setIsPasswordModalOpen(false);
      setPasswordInput("");
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };

  // Handle delete
  const handleDeleteSalary = async (id) => {
    try {
      await labourService.deleteSalary(id);
      fetchSalaries();
    } catch (err) {
      setError(err.message || "Failed to delete salary");
    }
  };

  // Handle register new salary
  const handleRegister = async (newSalary) => {
    try {
      await labourService.createSalary(newSalary);
      fetchSalaries();
      setIsAddModalOpen(false);
    } catch (err) {
      setError(err.message || "Failed to add salary");
    }
  };

  // Handle save edit
  const handleSaveEdit = async (updatedSalary) => {
    try {
      await labourService.updateSalaryStatus(editingSalary._id, updatedSalary.status);
      fetchSalaries();
      setIsEditModalOpen(false);
      setEditingSalary(null);
    } catch (err) {
      setError(err.message || "Failed to update salary");
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <FaSortUp className="ml-1 opacity-0" size={12} />;
    
    return sortConfig.direction === 'ascending' 
      ? <FaSortUp className="ml-1 text-green-600" size={12} />
      : <FaSortDown className="ml-1 text-green-600" size={12} />;
  };

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <FaMoneyBillWave size={48} className="mx-auto text-gray-400 mb-4" />
          <div className="text-2xl font-bold text-gray-600 mb-2">No Project Selected</div>
          <p className="text-gray-500 mb-6">Please select a project to view salary details.</p>
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
              <h1 className="text-2xl font-bold text-gray-800">Salary Management</h1>
              <p className="text-gray-600">Manage salaries for your construction site</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <FaPlus size={16} />
              Add Salary
            </button>
          </div>
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
              placeholder="Search salaries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-end text-gray-600">
            <span className="text-sm">
              {filteredAndSortedSalaries.length} salary record{filteredAndSortedSalaries.length !== 1 ? 's' : ''} found
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
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skill Level
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    Salary (LKR)
                    <SortIcon columnKey="amount" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
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
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded"></div></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-red-600 mb-4">{error}</div>
                    <button
                      onClick={fetchSalaries}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg"
                    >
                      Try Again
                    </button>
                  </td>
                </tr>
              ) : filteredAndSortedSalaries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500 mb-4">No salary records found</div>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                    >
                      Add First Salary
                    </button>
                  </td>
                </tr>
              ) : (
                filteredAndSortedSalaries.map((salary) => (
                  <tr key={salary._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {salary.labour?.labourId || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{salary.labour?.name || "Unknown"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{salary.labour?.contact || "No contact"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {salary.labour?.skillLevel || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        LKR {salary.amount?.toLocaleString() || "0"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        salary.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : salary.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {salary.status?.charAt(0).toUpperCase() + salary.status?.slice(1) || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleActionWithPassword(salary, "edit")}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleActionWithPassword(salary, "delete")}
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
      <AddSalary
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onRegister={handleRegister}
        projectId={projectId}
      />

      <EditSalaryForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSalary(null);
        }}
        onSave={handleSaveEdit}
        salary={editingSalary}
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

export default SupervisorLabourerSalary;