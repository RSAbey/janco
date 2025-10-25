// import React from 'react';
// import { useNavigate } from 'react-router-dom';

// const Table = ({ title, columns, data, buttonLabel, buttonRoute,upDateInfo }) => {
//   const navigate = useNavigate();
//   return (
//     <div className='bg-white p-4 rounded-lg'>
//       {/* Title & Button Container */}
//       <div className="flex justify-between items-center mb-2">
//         <h3 className='text-lg font-bold text-green-700'>{title}</h3>
//         <button 
//           className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
//           onClick={()=> {navigate(buttonRoute)}}
//           >
//           {buttonLabel}
//         </button>
//       </div>
//       <h1 className='text-gray-400 text-sm'>{upDateInfo}</h1>

//       {/* Table */}
//       <table className='w-full border-collapse border border-gray-300 mt-4'>
//         <thead>
//           <tr className="text-gray-500">
//             {columns.map((col, index) => (
//               <th key={index} className="border border-gray-300 p-2">{col}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {data.map((row, rowIndex) => (
//             <tr key={rowIndex} className="border border-gray-300">
//               {Object.values(row).map((cell, cellIndex) => (
//                 <td key={cellIndex} className="border border-gray-300 p-2">{cell}</td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default Table;

import React from 'react';
import { useNavigate } from 'react-router-dom';

const Table = ({ title, columns, data, buttonLabel, buttonRoute, upDateInfo, renderCell }) => {
  const navigate = useNavigate();

  return (
    <div className='bg-white p-4 rounded-lg'>
      {/* Title & Button Container */}
      <div className="flex justify-between items-center mb-2">
        <h3 className='text-lg font-bold text-green-700'>{title}</h3>
        <button 
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          onClick={() => { navigate(buttonRoute); }}
        >
          {buttonLabel}
        </button>
      </div>

      {upDateInfo && <h1 className='text-gray-400 text-sm'>{upDateInfo}</h1>}

      {/* Table */}
      <table className='w-full border-collapse border border-gray-300 mt-4'>
        <thead>
          <tr className="text-gray-500">
            {columns.map((col, index) => (
              <th key={index} className="border border-gray-300 p-2">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border border-gray-300">
              {columns.map((col, colIndex) => {
                const key = Object.keys(row)[colIndex]; // assuming keys are aligned
                return (
                  <td key={colIndex} className="border border-gray-300 p-2">
                    {renderCell 
                      ? renderCell(row, key, rowIndex, colIndex) 
                      : row[key]}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
