import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WorkPaymentSchedule from "./WorkPayement";
import SiteService from "../services/siteService";
import { Search } from '@mui/icons-material';

const DisplaySites = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const sitesPerPage = 8;

  // Function to calculate duration in days
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + " days";
  };

  // Fetch sites from API
  const fetchSites = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await SiteService.getAllSites();
      
      if (response && response.projects) {
        // Transform the API response to match the expected format
        const formattedSites = response.projects.map(project => ({
          siteId: project._id,
          projectId: project.projectId,
          siteName: project.name,
          siteAddress: project.location,
          duration: calculateDuration(project.startDate, project.endDate),
          startDate: project.startDate,
          endDate: project.endDate,
          documentFileNo: project.documentFileNo || "N/A", // Using documentFileNo as site owner placeholder
          supervisorName: project.supervisor || "Not assigned",
          estimatedCost: project.estimatedCost || "N/A",
          profit: "200,000", // This would need to come from your financial data
          status: project.status,
          progress: project.progress || 0
        }));
        
        setSites(formattedSites);
      }
    } catch (err) {
      console.error("Error fetching sites:", err);
      setError("Failed to load sites. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  // Filter sites based on search term
  const filteredSites = sites.filter(site =>
    site.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.siteAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.documentFileNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.supervisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (site.status && site.status.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredSites.length / sitesPerPage);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle site creation success
  const handleSiteCreated = () => {
    fetchSites(); // Refresh the list
    setIsModalOpen(false);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full p-4 bg-white shadow-md rounded-lg">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading sites...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full w-full p-4 bg-white shadow-md rounded-lg">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
          <button
            onClick={fetchSites}
            className="ml-4 bg-green-500 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full p-4 bg-white shadow-md rounded-lg">
      {/* Header & Search Section - Similar to MaterialDetails.js */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-black">Construction Sites</h3>
        
        {/* Search Bar */}
        <div className='flex gap-2 p-2 border rounded-lg focus:ring-2 focus:ring-green-400 shadow-md'>
          <Search/>
          <input
            placeholder='Search sites...'
            className='focus:outline-none'
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="flex-grow overflow-auto mt-4">
        <div>
          {filteredSites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No sites match your search." : "No sites found. Create your first site to get started."}
            </div>
          ) : (
            <>
              <table className="w-full border-collapse border border-gray-300 text-center">
                <thead>
                  <tr className="text-gray-500">
                    <th className="border border-gray-300 p-2">Site Name</th>
                    <th className="border border-gray-300 p-2">Location</th>
                    <th className="border border-gray-300 p-2">Duration</th>
                    <th className="border border-gray-300 p-2">File No</th>
                    <th className="border border-gray-300 p-2">Supervisor</th>
                    <th className="border border-gray-300 p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSites
                    .slice(
                      (currentPage - 1) * sitesPerPage,
                      currentPage * sitesPerPage
                    )
                    .map((site, index) => (
                      <tr
                        key={site.siteId || index}
                        className="border border-gray-300 hover:bg-green-200 cursor-pointer"
                        onClick={() => {
                          navigate('/constructionSites/projectDetails', { 
                            state: { 
                              site,
                              projectId: site.siteId // Pass the actual project ID
                            } 
                          });
                        }}
                      >
                        <td className="border border-gray-300 p-2">
                          {site.siteName}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {site.siteAddress}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {site.duration}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {site.documentFileNo}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {site.supervisorName}
                        </td>
                        <td className="border border-gray-300 p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            site.status === 'active' ? 'bg-green-100 text-green-800' :
                            site.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            site.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                            site.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {site.status || 'planning'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </>
          )}
          
          <div className="flex justify-between items-center mt-4">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              onClick={() => setIsModalOpen(true)}
            >
              + Add a Site
            </button>
            
            {filteredSites.length > sitesPerPage && (
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
        </div>
      </div>
      
      <WorkPaymentSchedule
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSiteCreated={handleSiteCreated}
      />
    </div>
  );
};

export default DisplaySites;