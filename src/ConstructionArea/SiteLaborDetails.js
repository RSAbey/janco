import React, { useState } from "react";
import LabourerDetails from "./LabourerDetails";
import LabourerSalary from "./LabourerSalary";
import LabourerAttendance from "./LabourerAttendance";
import MaterialStock from "./MaterialStock";
import SiteExpenses from "./SiteExpenses";
import { Button } from "@mui/material";
import { green } from "@mui/material/colors";
import { useNavigate } from "react-router-dom";

const SiteLaborDetails = ({ projectId }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("Labourer Details");

    const renderContent = () => {
        switch (activeTab) {
          case "Labourer Details":
            return <LabourerDetails projectId={projectId} />;
          case "Labourer Attendance":
            return <LabourerAttendance projectId={projectId} />; // Pass projectId here
          case "Labourer Salary":
            return <LabourerSalary projectId={projectId} />;
          default:
            return <LabourerDetails projectId={projectId} />;
        }
      };

  return (
    <div className="flex flex-col h-full md:w-full sm:w-min p-4 bg-white shadow-md rounded-lg overflow-auto">
      {/* Display project ID for debugging */}
      <div className="text-sm text-gray-600 mb-2">
        Current Project ID: {projectId || "Not available"}
      </div>
      
      {/* Back button */}
      <div className="mb-4">
        <Button 
          variant="outlined"  
          style={{color: green[900], borderColor: green[800]}} 
          onClick={() => navigate('/constructionSites')}
        >
          Back to Sites
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-2 justify-between p-2 bg-white shadow-md rounded-lg">
        {["Labourer Details", "Labourer Attendance", "Labourer Salary"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 border rounded-md ${
              activeTab === tab ? "bg-green-600 text-white" : "bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Render Content Based on Active Tab */}
      <div className="flex-grow mt-2">{renderContent()}</div>
    </div>
  )
}

export default SiteLaborDetails;