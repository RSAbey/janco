import React from 'react'
import RevenueCard from '../dashboard_Components/RevenueCard';
import AttendanceCard from '../dashboard_Components/AttendanceCard';
import MaterialCard from '../dashboard_Components/MaterialCard';
import SupplierTable from '../dashboard_Components/SupplierTable';
import SitesTable from '../dashboard_Components/SitesTable';

const Dashboard = () => {
  return (
    <div className='h-full p-2 overflow-auto'>
      {/* Revenue & Attendance Section */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
        <div className='bg-white rounded-lg border-l-4 border-green-500 p-4'>
          <RevenueCard/>
        </div>
        <div className='bg-white rounded-lg border-l-4 border-green-500 p-4'>
          <AttendanceCard/>
        </div>
      </div>

      {/* Dashboard Components */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2'>
        <div className='bg-white shadow-md rounded-lg border-l-4 border-green-500 p-4'>
          <MaterialCard/>
        </div>
        <div className='bg-white shadow-md rounded-lg border-l-4 border-green-500 p-4'>
          <SupplierTable/>
        </div>
        <div className='bg-white shadow-md rounded-lg border-l-4 border-green-500 p-4'>
          <SitesTable/>
        </div>
      </div>
    </div>
  )
}

export default Dashboard;
