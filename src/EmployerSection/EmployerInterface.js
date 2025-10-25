import React, { useState } from "react";
import { Button} from "@mui/material";
import { green } from "@mui/material/colors";
import { useNavigate } from "react-router-dom";
import EmployerDetails from "./EmployerDetails";
import EmployerSalary from "./EmployerSalary";

const EmployerInterface = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("Employees Details");

    const renderContent = () => {
        switch (activeTab) {
          case "Employees Details":
           return <EmployerDetails/>;
          case "Employee Salary":
            return <EmployerSalary />;
          default:
            return <EmployerDetails/>;
        }
      };

  return (
    <div className="flex flex-col h-full md:w-full sm:w-min p-4 bg-white shadow-md rounded-lg overflow-auto">
      {/* Tabs Navigation */}
      <div className="flex space-x-2 justify-between p-4 bg-white shadow-md rounded-lg">
      <Button variant="outlined"  style={{color:green[900], borderColor:green[800]}} onClick={()=>{navigate('/constructionSites')}}>Back</Button>
        {["Employees Details", "Employee Salary"].map((tab) => (
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

export default EmployerInterface;
