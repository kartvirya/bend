import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, Trophy, Car, Clock, ChevronUp, ChevronDown, Filter, Menu } from "lucide-react";

const TableComponent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: 'et',
    direction: 'asc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Generate more realistic data
  const data = useMemo(() => Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    driver: `${['John', 'Mike', 'Sarah', 'Emma', 'David', 'Chris', 'Alex', 'Tom'][Math.floor(Math.random() * 8)]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'][Math.floor(Math.random() * 8)]}`,
    carNumber: `${Math.floor(100 + Math.random() * 900)}`,
    et: (Math.random() * (12 - 8) + 8).toFixed(3),
  })), []);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item =>
      item.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.carNumber.includes(searchTerm) ||
      item.et.includes(searchTerm)
    );

    return filtered.sort((a, b) => {
      if (sortConfig.key === 'et') {
        return sortConfig.direction === 'asc' 
          ? parseFloat(a.et) - parseFloat(b.et)
          : parseFloat(b.et) - parseFloat(a.et);
      }
      
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, searchTerm, sortConfig]);

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };



  
  return (
    <div className="min-h max-w-[1500px] bg-gray-900 p-2 sm:p-4 md:p-6 rounded-2xl shadow-2xlx">
      <div className="max-h-[700px] max-w-6xl mx-auto flex flex-col">
        <div className="flex-1 bg-gray-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
          {/* Header Section */}
          <div className="p-3 sm:p-4 border-b border-gray-900 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-custom-pink" />
                Driver Rankings
              </h1>
              
              {/* Mobile Search Toggle */}
              <button 
                className="sm:hidden bg-gray-800 p-2 rounded-lg"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="w-5 h-5 text-gray-400" />
              </button>
              
              {/* Search and Filter Controls */}
              <div className={`w-full sm:w-auto flex flex-col sm:flex-row gap-2 ${showSearch ? 'block' : 'hidden sm:flex'}`}>
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-56 pl-9 pr-3 py-1.5 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-gray-600 text-sm"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3"
                >
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-gray-400 text-sm">Filter options coming soon...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Table Section */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th 
                      onClick={() => handleSort('id')}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-custom-pink" />
                        <span className="hidden sm:inline">Rank</span>
                        <SortIcon column="id" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('driver')}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Driver
                        <SortIcon column="driver" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('carNumber')}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-blue-400" />
                        Car #
                        <SortIcon column="carNumber" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('et')}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-green-400" />
                        ET
                        <SortIcon column="et" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 overflow-y-auto">
                  {filteredAndSortedData.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      className="hover:bg-gray-800/50 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-amber-700' :
                          'bg-gray-300'
                        } text-gray-900 font-bold`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-white">
                        {item.driver}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300 hidden sm:table-cell">
                        #{item.carNumber}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                        {item.et}s
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Section */}
          <div className="p-3 border-t border-gray-800 flex-shrink-0">
            <p className="text-gray-400 text-xs">
              Showing {filteredAndSortedData.length} of {data.length} drivers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableComponent;