import React, { useState } from "react";
import LabourerDetails from "./LabourerDetails";
import LabourerAttendance from "./LabourerAttendance";
import LabourerSalary from "./LabourerSalary";
import MaterialStock from "./MaterialStock";
import SiteExpenses from "./SiteExpenses";
import { Button} from "@mui/material";
import { green } from "@mui/material/colors";
import { useNavigate } from "react-router-dom";

const ConstructionArea = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Labourer Details");

  const renderContent = () => {
    switch (activeTab) {
      case "Labourer Details":
        return <LabourerDetails />;
      case "Labourer Attendance":
        return <LabourerAttendance />;
      case "Labourer Salary":
        return <LabourerSalary />;
      case "Material Stock":
        return <MaterialStock />;
      case "Site Expenses":
        return <SiteExpenses />;
      default:
        return <LabourerDetails />;
    }
  };

  return (
    <div className="flex flex-col h-full md:w-full sm:w-min p-4 bg-white shadow-md rounded-lg overflow-auto">
      {/* Tabs Navigation */}
      <div className="flex space-x-2 justify-between p-4 bg-white shadow-md rounded-lg">
      <Button variant="outlined"  style={{color:green[900], borderColor:green[800]}} onClick={()=>{navigate('/')}}>Back</Button>
        {["Labourer Details", "Labourer Attendance", "Labourer Salary", "Material Stock", "Site Expenses"].map((tab) => (
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
  );
};

export default ConstructionArea;
