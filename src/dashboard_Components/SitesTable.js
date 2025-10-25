import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../components/Table';
import siteService from '../services/siteService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const SitesTable = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await siteService.getAllSites();
        const sitesData = response.projects || response;
        
        // Get only the first 6 sites for the dashboard
        const dashboardSites = sitesData.slice(0, 6);
        
        const tableData = dashboardSites.map(site => ({
          siteName: site.name,
          supervisor: site.supervisor || 'Not assigned',
          view: 'see more...',
          id: site._id
        }));

        setSites(tableData);
      } catch (err) {
        setError(err.message || 'Failed to fetch construction sites');
        console.error('Error fetching sites:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  const renderCell = (row, key) => {
    if (key === "view") {
      return (
        <button
          onClick={() => navigate(`/constructionSites/projectDetails/${row.id}`)}
          className="text-green-500 hover:text-blue-800"
        >
          {row[key]}
        </button>
      );
    }
    return row[key];
  };

  const retryFetch = () => {
    setError('');
    setLoading(true);
    window.location.reload();
  };

  if (loading) {
    return <LoadingSpinner size="md" message="Loading construction sites..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={retryFetch} />;
  }

  return (
    <Table
      title="Construction Sites"
      columns={["Site Name", "Supervisor", "View"]}
      data={sites}
      buttonLabel="View All"
      buttonRoute="/constructionSites"
      renderCell={renderCell}
    />
  );
};

export default SitesTable;