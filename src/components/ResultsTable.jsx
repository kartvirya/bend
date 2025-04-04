import { useState, useEffect } from "react";
import { Search, Loader2, AlertCircle, ChevronRight, Trophy, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { ENDPOINTS, makeApiRequest } from '../utils/api';

export default function ResultsTable({ selectedDate, category = 'SUPER_STREET' }) {
  const [activeTab, setActiveTab] = useState("Q1");
  const [namesData, setNamesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const data = await makeApiRequest(ENDPOINTS.GET_ALL_RESULTS.RESULTS, category, selectedDate);

      const formattedData = data.msg.reduce((acc, session) => {
        // Sort results by position before assigning to acc
        const sortedResults = session.results
          .map(result => ({
            id: result.id,
            main_id: result.main_id,
            timestamp: result.timestamp,
            car_number: result.car_number,
            name: result.name,
            dial_in: result.dial_in,
            rt: result.rt,
            ft60: result.ft60,
            ft330: result.ft330,
            ft660: result.ft660,
            mph660: result.mph660,
            ft1000: result.ft1000,
            mph1000: result.mph1000,
            ft1320: result.ft1320,
            mph1320: result.mph1320,
            mov: result.mov,
            dov: result.dov,
            win: result.win,
            flag: result.flag,
            position: result.position
          }))
          .sort((a, b) => {
            // For qualifying rounds, we want numerical sorting only
            const aNum = Number(a.position);
            const bNum = Number(b.position);
            
            // If both are valid numbers, sort numerically
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return aNum - bNum;
            }
            
            // If one is a number and other isn't, put number first
            if (!isNaN(aNum)) return -1;
            if (!isNaN(bNum)) return 1;
            
            // If neither are numbers, maintain original order
            return 0;
          });

        acc[`Q${session.rnd}`] = sortedResults;
        return acc;
      }, {});

      setNamesData(formattedData);
      setLastRefresh(Date.now());
      
      // Set activeTab to 'Q1' (Round 1) if it exists, otherwise to the first available round
      if (formattedData['Q1']) {
        setActiveTab('Q1');
      } else if (Object.keys(formattedData).length > 0) {
        // Sort the rounds and get the first one
        const sortedRounds = Object.keys(formattedData).sort((a, b) => {
          const numA = parseInt(a.replace('Q', ''));
          const numB = parseInt(b.replace('Q', ''));
          return numA - numB;
        });
        setActiveTab(sortedRounds[0]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial data fetch on component mount
  useEffect(() => {
    fetchData();
  }, [category, selectedDate]);
  
  // Set up auto-refresh polling every 2 minutes
  useEffect(() => {
    const AUTO_REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds
    
    // Create polling interval for auto-refresh
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing results table data...');
      fetchData(true); // true means to show refreshing state instead of loading
    }, AUTO_REFRESH_INTERVAL);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [category, selectedDate]); // Re-establish interval if category or selectedDate changes

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchData(true);
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

  const getRowStyle = (row) => {
    let classes = "hover:bg-[#1a2235] transition-colors";

    // Winner gets green highlight
    if (isWinner(row.win)) {
      classes += " bg-green-900 bg-opacity-30 text-green-400"; // Green highlight for winners
      return classes;
    }

    // Breakout gets blue highlight (when a car runs faster than dial-in)
    if (row.dial_in && parseFloat(row.dial_in) > 0 && 
        row.ft1320 && row.ft1320 !== "0" && 
        parseFloat(row.ft1320) < parseFloat(row.dial_in)) {
      classes += " bg-blue-900 bg-opacity-30 text-cyan-400"; // Blue highlight for breakout
      return classes;
    }

    // Red light gets red highlight
    if (row.rt && parseFloat(row.rt) < 0) {
      classes += " bg-red-900 bg-opacity-30 text-red-400"; // Red highlight for negative RT
      return classes;
    }
    
    // Default colors
    classes += " text-gray-300";
    return classes;
  };

  const getRTColor = (rt, position) => {
    if (rt?.startsWith("-")) return "text-red-500 font-bold";
    // Don't override the blue color if it's a breakout condition
    return position?.toLowerCase() === 'right' ? "text-green-400" : "text-gray-300";
  };

  const getFT1320Style = (row) => {
    if (row.dial_in && parseFloat(row.dial_in) > 0 && 
        row.ft1320 && row.ft1320 !== "0" && 
        parseFloat(row.ft1320) < parseFloat(row.dial_in)) {
      return "text-cyan-400 font-bold";
    }
    if (isWinner(row.win)) {
      return "text-green-400";
    }
    return "text-yellow-400";
  };

  const isWinner = (win) => {
    return win === "W" || win === "1" || win === 1;
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
        Loading results data...
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
          className="mt-6 w-full bg-custom-pink hover:bg-red-600 text-white py-3 rounded-lg transition-colors font-medium"
          onClick={() => window.location.reload()}
        >
          Retry
        </motion.button>
      </motion.div>
    </div>
  );

  if (loading) return renderLoading();
  if (error) return renderError();
  if (!Object.keys(namesData).length) return (
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
        <p className="text-gray-400">There is currently no results data to display.</p>
      </motion.div>
    </div>
  );

  // Complete table headers with shorter alternatives for mobile
  const tableHeaders = [
    "Pos", "Car #", "Name", "Dial", "RT", 
    "60ft", "330ft", "660ft", "MPH", "1000ft", "MPH", "1320ft", 
    "MPH", "Win"
  ];

  return (
    <div className="h-[85vh] w-[calc(100vw-105px)] mx-auto bg-[#0e1425] text-white flex flex-col overflow-hidden rounded-lg results-container">
      {/* Fixed top header */}
      <div className="flex justify-between items-center p-3 border-b border-gray-800">
        <div className="text-lg font-bold text-white">RESULTS</div>
        <div className="flex items-center">
          {lastRefresh && (
            <div className="text-xs text-gray-400 mr-2">
              Last updated: {new Date(lastRefresh).toLocaleTimeString()}
            </div>
          )}
          <button 
            onClick={handleManualRefresh} 
            disabled={isRefreshing || loading}
            className={`p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors ${isRefreshing ? 'animate-spin text-blue-400' : ''}`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      
      {/* Fixed rounds selector - horizontally scrollable */}
      <div className="sticky top-0 z-10 bg-[#0e1425] border-b border-gray-800 p-1">
        <div className="overflow-x-auto whitespace-nowrap pb-1 custom-scrollbar">
          <div className="flex gap-1 px-1">
            {Object.keys(namesData)
              .sort((a, b) => {
                // Extract numeric part and sort numerically
                const numA = parseInt(a.replace('Q', ''));
                const numB = parseInt(b.replace('Q', ''));
                return numA - numB;
              })
              .map((quarter) => (
                <button
                  key={quarter}
                  className={`px-2 py-2 rounded-md font-medium transition-all flex items-center justify-center gap-1 min-w-[80px] text-sm ${
                    activeTab === quarter
                      ? 'bg-custom-pink text-white shadow-lg'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab(quarter)}
                >
                  <span>Round {quarter.replace('Q', '')}</span>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-hidden relative shadow-md">
        <div 
          className="absolute inset-0 overflow-auto custom-scrollbar"
          style={{ 
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "auto",
            scrollbarWidth: "thin",
            overscrollBehavior: "contain"
          }}
        >
          <div className="table-responsive w-full">
            <table className="w-full border-collapse shadow-lg table-auto" style={{ minWidth: "800px", maxWidth: "100%" }}>
              <thead className="bg-[#0e1425] sticky top-0 z-10 shadow-md">
                <tr>
                  {tableHeaders.map((header) => (
                    <th 
                      key={header}
                      scope="col" 
                      className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-800"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {(() => {
                  const rows = [];
                  let currentMainId = null;
                  
                  namesData[activeTab]?.forEach((row, index, array) => {
                    // Check if we're starting a new group
                    const isNewGroup = currentMainId !== row.main_id;
                    currentMainId = row.main_id;
                    
                    // Add a spacer row between different main_id groups
                    if (isNewGroup && index > 0) {
                      // Add a boxed row as a divider
                      rows.push(
                        <tr key={`divider-${index}`} className="h-2 border-none">
                          <td colSpan={tableHeaders.length} className="p-0">
                            <div className="h-2 w-full bg-gray-700 border-t border-b border-gray-600"></div>
                          </td>
                        </tr>
                      );
                      
                      // Add space after the divider
                      rows.push(
                        <tr key={`spacer-${index}`} className="h-4 bg-[#0e1425] border-none">
                          <td colSpan={tableHeaders.length} className="p-0 border-none"></td>
                        </tr>
                      );
                    }
                    
                    // Add the regular data row
                    rows.push(
                      <tr 
                        key={`row-${index}`} 
                        className={getRowStyle(row)}
                      >
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium shadow-sm ${getPositionColor(row.position)}`}>
                            {typeof row.position === 'string' && row.position.toLowerCase() === 'left' 
                              ? 'L' 
                              : typeof row.position === 'string' && row.position.toLowerCase() === 'right' 
                                ? 'R' 
                                : row.position}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm">{row.car_number}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-xs font-medium">{row.name}</div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm">{row.dial_in}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`text-xs font-medium ${getRTColor(row.rt, row.position)}`}>{row.rt}</span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs">{row.ft60}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs">{row.ft330}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs">{row.ft660}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs">{row.mph660}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs">{row.ft1000}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs">{row.mph1000}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs">
                          <span className={getFT1320Style(row)}>{row.ft1320}</span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs">{row.mph1320}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {isWinner(row.win) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Win
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                  
                  return rows;
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CSS for custom scrollbars and responsive design */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px !important;
          height: 8px !important;
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
            width: 4px !important;
            height: 4px !important;
            display: block !important;
          }
          
          /* iOS devices */
          @supports (-webkit-touch-callout: none) {
            .custom-scrollbar {
              -webkit-overflow-scrolling: touch;
              overflow: scroll !important;
            }
          }

          /* Smaller font size and padding for mobile */
          table {
            font-size: 10px;
          }

          th, td {
            padding: 4px !important;
          }
          
          /* Ensure text doesn't overflow on mobile */
          td, th {
            max-width: 60px;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        /* For extra small screens, optimize table layout */
        @media (max-width: 480px) {
          td, th {
            max-width: 50px;
            padding: 3px !important;
          }
          
          table {
            font-size: 9px;
          }
        }

        /* For small phones, optimize visibility of important columns */
        @media (max-width: 360px) {
          table {
            width: max-content !important;
          }
        }

        /* Mobile sidebar adjustment */
        @media (max-width: 640px) {
          :global(.results-container) {
            width: calc(100vw - 62px) !important; /* Adjust for smaller sidebar on mobile */
            margin-left: 0;
          }
        }

        /* Ensure responsive table width on all devices */
        .table-responsive {
          min-width: fit-content;
          width: 100%;
        }

        table {
          width: 100%;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border-spacing: 0;
        }

        /* Group header styling */
        tr.border-t.border-b td {
          border-bottom: 1px solid #2d3748;
        }
        
        /* Improved spacing */
        tr td {
          padding-top: 8px;
          padding-bottom: 8px;
        }
        
        /* Remove old gap styling */
        tr.border-b-\[12px\] {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}