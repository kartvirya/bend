import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Wind, AlertCircle, Loader2, Flag, Car, Activity, Search } from 'lucide-react';
import { ENDPOINTS, makeApiRequest } from '../utils/api';

const Qualify = ({ selectedDate, category = 'SUPER_STREET' }) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRound, setActiveRound] = useState(null);
  const [showError, setShowError] = useState(false);
  const [showData, setShowData] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: 'Position',
    direction: 'ascending'
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await makeApiRequest(ENDPOINTS.GET_ALL_RESULTS.QUALIFYING, category, selectedDate);
        
        if (data && !data.error) {
          setData(data.msg);
          setShowData(true);
        } else {
          setError('Error fetching data: ' + (data?.error || 'Unknown error'));
          setShowError(true);
        }
      } catch (err) {
        console.error('Error during fetch:', err);
        setError('Error fetching data. Please check your network or server.');
        setShowError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [category, selectedDate]);

  useEffect(() => {
    if (data && data.length > 0) {
      setActiveRound(data[0].id);
    }
  }, [data]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getPositionColor = (position) => {
    const pos = parseInt(position);
    switch (pos) {
      case 1:
        return "bg-yellow-500 text-black";
      case 2:
        return "bg-gray-300 text-black";
      case 3:
        return "bg-amber-600 text-white";
      default:
        return "bg-gray-700 text-white";
    }
  };

  const getClassColor = (className) => {
    if (className?.includes('S/STM')) return "text-blue-400";
    if (className?.includes('S/STB')) return "text-green-400";
    if (className?.includes('S/STA')) return "text-red-400";
    return "text-gray-400";
  };

  const getRTColor = (rt) => {
    if (rt?.startsWith("-")) return "text-red-400";
    return "text-blue-400";
  };

  const renderLoading = () => (
    <div className="flex flex-col justify-center items-center h-[85vh] px-4 bg-[#0e1425] text-white">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="mb-6"
      >
        <Loader2 size={48} className="text-red-500" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-xl font-semibold text-red-500"
      >
        Loading qualifying data...
      </motion.div>
    </div>
  );

  const renderError = () => (
    <div className="flex justify-center items-center h-[85vh] px-4 py-8 bg-[#0e1425] text-white">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="bg-gray-800 border-2 border-red-500 p-8 rounded-xl shadow-xl max-w-md w-full mx-4"
      >
        <div className="flex items-center justify-center mb-6">
          <AlertCircle size={40} className="text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-center mb-4">Error</h3>
        <p className="text-gray-300 text-center">{error}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg transition-colors font-medium"
          onClick={() => window.location.reload()}
        >
          Retry
        </motion.button>
      </motion.div>
    </div>
  );

  const renderNoData = () => (
    <div className="flex justify-center items-center h-[85vh] px-4 py-8 bg-[#0e1425] text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gray-800 p-8 rounded-xl shadow-xl text-center max-w-md w-full mx-4"
      >
        <div className="flex justify-center mb-6">
          <Trophy size={48} className="text-gray-500" />
        </div>
        <h3 className="text-xl font-semibold mb-4">No Data Available</h3>
        <p className="text-gray-400">There is currently no qualifying data to display.</p>
      </motion.div>
    </div>
  );

  const renderContent = () => {
    if (!data || data.length === 0) {
      return renderNoData();
    }

    const currentRound = data.find((round) => round.id === activeRound);
    
    if (!currentRound || !currentRound.results) {
      return (
        <div className="flex justify-center items-center h-[85vh] px-4 py-8 bg-gray-900 text-white">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-8 bg-gray-800 rounded-xl shadow-lg max-w-md w-full mx-4"
          >
            <div className="flex justify-center mb-6">
              <AlertCircle size={32} className="text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Round Data Not Available</h3>
            <p className="text-gray-400">The selected round data could not be loaded.</p>
            {data.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-6 px-6 py-3 bg-red-500 text-white rounded-lg font-medium"
                onClick={() => setActiveRound(data[0].id)}
              >
                Return to First Round
              </motion.button>
            )}
          </motion.div>
        </div>
      );
    }
    
    const sortedResults = [...currentRound.results].sort((a, b) => {
      // For Position field, convert to numbers before comparison
      if (sortConfig.key === 'Position') {
        const aValue = parseInt(a[sortConfig.key], 10);
        const bValue = parseInt(b[sortConfig.key], 10);
        return sortConfig.direction === 'ascending' 
          ? aValue - bValue 
          : bValue - aValue;
      }
      
      // For other fields, use the existing string comparison
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return (
      <div className="h-[85vh] w-[90vw] max-w-[1600px] mx-auto bg-[#0e1425] text-white flex flex-col overflow-hidden rounded-lg">
        {/* Fixed top header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <div className="text-xl font-bold text-white">QUALIFYING</div>
        </div>
        
        {/* Fixed rounds selector - horizontally scrollable */}
        <div className="sticky top-0 z-10 bg-[#0e1425] border-b border-gray-800 p-2">
          <div className="overflow-x-auto whitespace-nowrap pb-2 custom-scrollbar">
            <div className="flex gap-2 px-2">
              {data.map((round) => (
                <button
                  key={round.id}
                  className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 min-w-[100px] ${
                    activeRound === round.id
                      ? 'bg-custom-pink text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveRound(round.id)}
                >
                  <span>Round {round.Round}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-hidden relative shadow-md">
          <div className="absolute inset-0 overflow-auto custom-scrollbar">
            <table className="min-w-full border-collapse">
              <thead className="bg-[#0e1425] sticky top-0 z-10">
                <tr>
                  {['POSITION', 'NAME', 'CAR NUMBER', 'CAR MAKE', 'CAR YEAR', 'RT', 'ET', 'SPEED'].map((header) => (
                    <th 
                      key={header}
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-800 cursor-pointer"
                      onClick={() => requestSort(header === 'POSITION' ? 'Position' : header)}
                    >
                      {header}
                      {sortConfig.key === (header === 'POSITION' ? 'Position' : header) && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sortedResults.map((result) => (
                  <tr 
                    key={result.id} 
                    className="hover:bg-[#1a2235] transition-colors"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${getPositionColor(result.Position)}`}>
                        {result.Position}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{result.Name}</div>
                      <div className={`text-xs ${getClassColor(result.Class)}`}>{result.Class}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {result.Car_Number}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {result.Car_Make}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {result.Car_Year}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1 text-blue-400" />
                        <span className={`text-sm font-medium ${getRTColor(result.RT)}`}>{result.RT}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-yellow-400">{result.ET}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Wind size={14} className="mr-1 text-green-400" />
                        <span className="text-sm font-medium text-green-400">{result.Speed}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) return renderLoading();
  if (showError) return renderError();
  if (!showData) return renderNoData();
  return (
    <>
      {renderContent()}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px !important;
          height: 10px !important;
          display: block !important;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a2235;
          border-radius: 0;
          display: block !important;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 0;
          display: block !important;
          border: 1px solid #1a2235;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: #1a2235;
        }
        
        .custom-scrollbar {
          scrollbar-width: auto;
          scrollbar-color: #4b5563 #1a2235;
          -webkit-overflow-scrolling: touch;
        }

        /* Ensure scrollbars are visible at all times */
        .custom-scrollbar {
          overflow: scroll !important;
          -ms-overflow-style: scrollbar !important;
        }
        
        /* Mobile devices */
        @media (max-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar {
            -webkit-appearance: none !important;
            width: 10px !important;
            height: 10px !important;
            display: block !important;
          }
          
          /* iOS devices */
          @supports (-webkit-touch-callout: none) {
            .custom-scrollbar {
              -webkit-overflow-scrolling: touch;
              overflow: scroll !important;
            }
          }

          .mobile-hidden {
            display: none;
          }

          table {
            font-size: 12px;
          }

          th, td {
            padding: 8px;
          }
        }

        table {
          min-width: 1200px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
      `}</style>
    </>
  );
};

export default Qualify;