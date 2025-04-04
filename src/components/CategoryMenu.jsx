import React from 'react';

const CategoryMenu = ({ setSelectedCategory, setActiveView }) => {
  const categories = [
    "MODIFIED BIKE",
    "JUNIOR DRAGSTER",
    "SUPER STREET",
    "TOP FUEL",
    "TOP SPORTSMAN",
    "PRO STOCK",
    "FUNNY CAR",
    "TOP ALCOHOL"
  ];
  
  const qualifyingRounds = [
    "Q1",
    "Q2",
    "Q3",
    "Q4",
    "QF",
    "SF",
    "FINALS"
  ];
  
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setActiveView('results');
  };
  
  return (
    <div className="bg-gray-800 bg-opacity-80 p-4 rounded-xl shadow-xl">
      <h3 className="text-white text-xl font-bold mb-2 px-4">CATEGORIES</h3>
      <ul className="space-y-2 mb-4">
        {categories.map((category, index) => (
          <li 
            key={index}
            className="px-4 py-2 hover:bg-gray-700 rounded cursor-pointer text-white font-semibold"
            onClick={() => handleCategorySelect(category)}
          >
            {category}
          </li>
        ))}
      </ul>
      
      
      <h3 className="text-white text-xl font-bold mb-2 px-4 mt-4">QUALIFYING ROUNDS</h3>
      <ul className="space-y-2">
        {qualifyingRounds.map((round, index) => (
          <li 
            key={index}
            className="px-4 py-2 hover:bg-gray-700 rounded cursor-pointer text-white font-semibold"
            onClick={() => handleCategorySelect(round)}
          >
            {round}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryMenu;