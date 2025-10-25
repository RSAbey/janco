import React from 'react'
import { useNavigate } from 'react-router-dom';

const Card = ({title, children, className, buttonLabel, buttonOnClick}) => {
  const navigate = useNavigate();

  return (
    <div className={`bg-white p-4 rounded-lg ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-primary-base">{title}</h3>
        <button 
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          onClick={buttonOnClick}
          >
          {buttonLabel}
        </button>
      </div>
      {children}
    </div>
  )
}

export default Card;
