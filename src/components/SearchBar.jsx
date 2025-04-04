import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { formatDateForApi } from '../utils/api';

const SearchBar = ({ apiEndpoint, apiToken, selectedDate, setSelectedDate, setActiveView }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value) {
      setIsLoading(true);
      setIsOpen(true);
      try {
        // Format the date for API request
        const formattedDate = formatDateForApi(selectedDate);
        
        // Add date parameter to the request
        const response = await axios.get(`${apiEndpoint}?query=${value}&displaydate=${formattedDate}`, {
          headers: {
            'Auth-Token': apiToken
          }
        });
        
        // Check if response has the expected data structure
        if (response.data && response.data.msg) {
          const filteredResults = response.data.msg.filter(item => 
            item.EventName && item.EventName.toLowerCase().includes(value.toLowerCase())
          );
          setResults(filteredResults);
        } else {
          console.error('Unexpected API response format:', response.data);
          setResults([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleClickOutside = (e) => {
    if (searchRef.current && !searchRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleItemClick = (item) => {
    console.log('Selected item:', item);
    
    // Set the date if available
    if (item.EventDate) {
      const [day, month, year] = item.EventDate.split('/');
      const formattedDate = `${year}-${month}-${day}`;
      setSelectedDate(formattedDate);
    }
    
    // Clear search
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-lg mt-4" ref={searchRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input 
          type="text" 
          className="w-full pl-10 pr-10 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm transition-all duration-300"
          placeholder="Type to search events, drivers, or races..."
          value={query}
          onChange={handleSearch}
          onFocus={() => query && setIsOpen(true)}
        />
        {query && (
          <button 
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-opacity duration-300 opacity-100"
            onClick={handleClear}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute mt-1 w-[40.4%] z-50">
  <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-500 overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
    {isLoading ? (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin h-6 w-6 border-3 border-custom-pink border-t-transparent rounded-full mr-3"></div>
        <p className="text-gray-300">Searching...</p>
      </div>
    ) : results.length > 0 ? (
      <div>
        <div className="px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-700 text-white text-xs uppercase font-semibold tracking-wider">
          Search Results ({results.length})
        </div>
        <ul className="divide-y divide-gray-600">
          {results.map((item, index) => (
            <li 
              key={index} 
              className="hover:bg-gray-700 transition duration-150 ease-in-out cursor-pointer group"
              onClick={() => handleItemClick(item)}
            >
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-100 group-hover:text-custom-pink transition-colors">
                    {item.EventName}
                  </p>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-custom-pink">
                      {item.RaceTime}
                    </span>
                    {item.Category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {item.Category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-400 group-hover:text-pink-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    ) : (
      query && (
        <div className="p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-gray-300">No results found for "{query}"</p>
          <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
        </div>
      )
    )}
  </div>
</div>

      )}
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d1d1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #b1b1b1;
        }
      `}</style>
    </div>
  );
};

export default SearchBar;