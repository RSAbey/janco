import React, { useState } from "react";
import LabourerDetails from "./LabourerDetails";
import LabourerAttendance from "./LabourerAttendance";
import LabourerSalary from "./LabourerSalary";
import MaterialStock from "./MaterialStock";
import SiteExpenses from "./SiteExpenses";
import { Button} from "@mui/material";
import { green } from "@mui/material/colors";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import SiteDetails from "./SiteDetail";
import SiteLaborDetails from "./SiteLaborDetails";
import ConstructionScheduler from "./ConstructionScheduler";

const ProjectInterface = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("Site Details");
  
  // Get projectId from navigation state
  const projectId = location.state?.projectId;

  const renderContent = () => {
      switch (activeTab) {
        case "Site Details":
         return <SiteDetails projectId={projectId}/>;
        case "Schedule":
          return <ConstructionScheduler projectId={projectId} />;
        case "Transactions":
          return <SiteExpenses projectId={projectId} />;
        case "Materials":
          return  <MaterialStock projectId={projectId}/>;
        case "Labourer":
          return <SiteLaborDetails projectId={projectId}/>;
        default:
          return <LabourerDetails projectId={projectId} />;
      }
    };

return (
  <div className="flex flex-col h-full md:w-full sm:w-min p-4 bg-white shadow-md rounded-lg overflow-auto">
    {/* Display project ID for debugging */}
    <div className="text-sm text-gray-600 mb-2">
      Project ID: {projectId || "Not available"}
    </div>
    
    {/* Tabs Navigation */}
    <div className="flex space-x-2 justify-between p-4 bg-white shadow-md rounded-lg">
    <Button variant="outlined"  style={{color:green[900], borderColor:green[800]}} onClick={()=>{navigate('/constructionSites')}}>Back</Button>
      {["Site Details", "Schedule", "Transactions", "Materials", "Labourer"].map((tab) => (
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

export default ProjectInterface
