// AttendanceChart.js - Fixed with Better Styling
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const AttendanceChart = ({ data }) => {
  if (!data) {
    return (
      <div className="flex flex-col items-center p-4">
        <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-full">
          <span className="text-gray-500">No data</span>
        </div>
      </div>
    );
  }

  const { projectName, percentage = 0, presentCount = 0, totalCount = 0 } = data;

  const chartData = {
    labels: [`Present - ${percentage}%`, `Absent - ${100 - percentage}%`],
    datasets: [
      {
        data: [percentage, Math.max(0, 100 - percentage)],
        backgroundColor: ['#4F9863', '#C7FFDE'],
        hoverBackgroundColor: ['#3e7950', '#D1D5DB'],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return context.label;
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">{projectName || 'Unknown Project'}</h3>
      
      <div className="relative w-48 h-48">
        <Doughnut data={chartData} options={options} />
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">{percentage}%</span>
          <span className="text-xs text-gray-500">Attendance</span>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          {presentCount} of {totalCount} laborers present
        </p>
      </div>
      
      {/* Status indicator */}
      <div className="mt-2 flex items-center justify-center">
        <span className={`w-2 h-2 rounded-full mr-2 ${
          percentage >= 80 ? 'bg-green-500' : 
          percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
        }`}></span>
        <span className="text-xs text-gray-500">
          {percentage >= 80 ? 'Good' : percentage >= 60 ? 'Average' : 'Needs attention'}
        </span>
      </div>
    </div>
  );
};

export default AttendanceChart;