import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Calendar from './components/Calendar';
import SearchBar from './components/SearchBar';
import ResultsTable from './components/ResultsTable';
import Qualifying from './components/Qualifying';
import Pairing from './components/Pairing';
import Drivers from './components/Drivers';
import Ladder from './components/ladder'; 
import CategoryMenu from './components/CategoryMenu';
import backgroundImage from './assets/dragstrip-background.jpg';
import { formatDateForApi, API_CONFIG, makeApiRequest, ENDPOINTS } from './utils/api';
import { syncCookieWithLocalStorage } from './utils/cookies';
import './App.css'; 

function App() {
  const [activeView, setActiveView] = useState('calendar'); 
  const [selectedCategory, setSelectedCategory] = useState('TOP SPORTSMAN');
  const [selectedDate, setSelectedDate] = useState(() => {
    // Get date from synchronized cookies and localStorage
    return syncCookieWithLocalStorage('selectedCalendarDate');
  });
  const [ladderCategory, setLadderCategory] = useState('SUPER_GAS');
  const [submenus, setSubmenus] = useState({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Fetch results categories
        const resultsData = await makeApiRequest(ENDPOINTS.GET_CATEGORIES.RESULTS, '', selectedDate);
        if (Array.isArray(resultsData.msg) && resultsData.msg.length > 0) {
          const formattedResultsSubmenu = resultsData.msg.map((item) => ({
            label: item.Category,
            view: item.CategoryCode.toLowerCase(),
            code: item.CategoryCode,
          }));
          setSubmenus(prev => ({ ...prev, results: formattedResultsSubmenu }));
        }

        // Fetch qualifying categories
        const qualifyingData = await makeApiRequest(ENDPOINTS.GET_CATEGORIES.QUALIFYING, '', selectedDate);
        if (Array.isArray(qualifyingData.msg) && qualifyingData.msg.length > 0) {
          const formattedQualifyingSubmenu = qualifyingData.msg.map((item) => ({
            label: item.Category,
            view: item.CategoryCode.toLowerCase(),
            code: item.CategoryCode,
          }));
          setSubmenus(prev => ({ ...prev, qualifying: formattedQualifyingSubmenu }));
        }

        // Fetch pairing categories
        const pairingData = await makeApiRequest(ENDPOINTS.GET_CATEGORIES.PAIRING, '', selectedDate);
        if (Array.isArray(pairingData.msg) && pairingData.msg.length > 0) {
          const formattedPairingSubmenu = pairingData.msg.map((item) => ({
            label: item.Category,
            view: item.CategoryCode.toLowerCase(),
            code: item.CategoryCode,
          }));
          setSubmenus(prev => ({ ...prev, pairing: formattedPairingSubmenu }));
        }

        // Fetch ladder categories
        const ladderData = await makeApiRequest(ENDPOINTS.GET_CATEGORIES.LADDER, '', selectedDate);
        if (Array.isArray(ladderData.msg) && ladderData.msg.length > 0) {
          const formattedLadderSubmenu = ladderData.msg.map((item) => ({
            label: item.Category,
            view: item.CategoryCode.toLowerCase(),
            code: item.CategoryCode,
          }));
          setSubmenus(prev => ({ ...prev, ladder: formattedLadderSubmenu }));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    if (selectedDate) {
      fetchCategories();
    }
  }, [selectedDate]);

  // Function to handle date selection
  const handleDateSelect = (date) => {
    // Format the date properly before setting it
    const formattedDate = formatDateForApi(date);
    setSelectedDate(formattedDate);
    
    // After setting the date, switch back to the previous view or stay in calendar
    if (activeView === 'calendar') {
      // If we're already in calendar view, stay there
      return;
    }
    // Otherwise, go back to the previous view
    setActiveView(activeView);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        setActiveView={setActiveView} 
        setLadderCategory={setLadderCategory}
        setSelectedCategory={setSelectedCategory}
        selectedCategory={selectedCategory}
        selectedDate={selectedDate}
        setSelectedDate={handleDateSelect}
        ladderCategory={ladderCategory}
      />
      
      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Background Image */}
        <div 
          className={`absolute inset-0 bg-cover bg-center z-0 ${activeView !== 'pairing' ? 'background-dark-blur' : ''}`}
          style={{ 
            backgroundImage: `url(${backgroundImage})`,
          }}
        />
        {/* Background Overlay */}
        <div className={`absolute inset-0 bg-black bg-opacity-50 z-0 ${activeView !== 'pairing' ? 'background-dark-blur' : ''}`} />

        {/* Content Overlay */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          {activeView === 'calendar' && (
            <Calendar selectedDate={selectedDate} setSelectedDate={handleDateSelect} />
          )}
          
          {activeView === 'search' && (
            <div className="w-full max-w-2xl">
              <SearchBar 
                selectedDate={selectedDate} 
                setSelectedDate={handleDateSelect}
                setActiveView={setActiveView}
                apiEndpoint={`${API_CONFIG.PROXY_URL}/getdates`}
                apiToken={API_CONFIG.AUTH_TOKEN}
              />
            </div>
          )}
          
          {activeView === 'categories' && (
            <CategoryMenu setSelectedCategory={setSelectedCategory} setActiveView={setActiveView} />
          )}
          
          {activeView === 'results' && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 mb-4">
                <button 
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition"
                  aria-label="Previous"
                  onClick={() => {
                    const categories = submenus?.results || [];
                    const currentIndex = categories.findIndex(item => item.label === selectedCategory);
                    if (currentIndex > 0) {
                      setSelectedCategory(categories[currentIndex - 1].label);
                    } else {
                      // If at the beginning, go to the last category
                      setSelectedCategory(categories[categories.length - 1].label);
                    }
                  }}
                >
                  <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6"></path>
                  </svg>
                </button>
                <div className="flex items-center gap-2 bg-gray-800 bg-opacity-80 rounded-full px-6 py-2">
                  <span className="text-red-500 text-lg">▶</span>
                  <span className="text-white text-xl font-bold uppercase">{selectedCategory}</span>
                </div>
                <button 
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition"
                  aria-label="Next"
                  onClick={() => {
                    const categories = submenus?.results || [];
                    const currentIndex = categories.findIndex(item => item.label === selectedCategory);
                    if (currentIndex < categories.length - 1) {
                      setSelectedCategory(categories[currentIndex + 1].label);
                    } else {
                      // If at the end, go to the first category
                      setSelectedCategory(categories[0].label);
                    }
                  }}
                >
                  <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"></path>
                  </svg>
                </button>
              </div>
              <ResultsTable category={selectedCategory} selectedDate={selectedDate} />
            </div>
          )}

          {activeView === 'qualifying' && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 mb-4">
                <button 
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition"
                  aria-label="Previous"
                  onClick={() => {
                    const categories = submenus?.qualifying || [];
                    const currentIndex = categories.findIndex(item => item.label === selectedCategory);
                    if (currentIndex > 0) {
                      setSelectedCategory(categories[currentIndex - 1].label);
                    } else {
                      // If at the beginning, go to the last category
                      setSelectedCategory(categories[categories.length - 1].label);
                    }
                  }}
                >
                  <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6"></path>
                  </svg>
                </button>
                <div className="flex items-center gap-2 bg-gray-800 bg-opacity-80 rounded-full px-6 py-2">
                  <span className="text-red-500 text-lg">▶</span>
                  <span className="text-white text-xl font-bold uppercase">{selectedCategory}</span>
                </div>
                <button 
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition"
                  aria-label="Next"
                  onClick={() => {
                    const categories = submenus?.qualifying || [];
                    const currentIndex = categories.findIndex(item => item.label === selectedCategory);
                    if (currentIndex < categories.length - 1) {
                      setSelectedCategory(categories[currentIndex + 1].label);
                    } else {
                      // If at the end, go to the first category
                      setSelectedCategory(categories[0].label);
                    }
                  }}
                >
                  <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"></path>
                  </svg>
                </button>
              </div>
              <Qualifying selectedDate={selectedDate} category={selectedCategory} />
            </div>
          )}

          {activeView === 'pairing' && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 mb-4">
                <button 
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition"
                  aria-label="Previous"
                  onClick={() => {
                    const categories = submenus?.pairing || [];
                    const currentIndex = categories.findIndex(item => item.label === selectedCategory);
                    if (currentIndex > 0) {
                      setSelectedCategory(categories[currentIndex - 1].label);
                    } else {
                      // If at the beginning, go to the last category
                      setSelectedCategory(categories[categories.length - 1].label);
                    }
                  }}
                >
                  <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6"></path>
                  </svg>
                </button>
                <div className="flex items-center gap-2 bg-gray-800 bg-opacity-80 rounded-full px-6 py-2">
                  <span className="text-red-500 text-lg">▶</span>
                  <span className="text-white text-xl font-bold uppercase">{selectedCategory}</span>
                </div>
                <button 
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition"
                  aria-label="Next"
                  onClick={() => {
                    const categories = submenus?.pairing || [];
                    const currentIndex = categories.findIndex(item => item.label === selectedCategory);
                    if (currentIndex < categories.length - 1) {
                      setSelectedCategory(categories[currentIndex + 1].label);
                    } else {
                      // If at the end, go to the first category
                      setSelectedCategory(categories[0].label);
                    }
                  }}
                >
                  <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"></path>
                  </svg>
                </button>
              </div>
              <Pairing selectedDate={selectedDate} category={selectedCategory} />
            </div>
          )}

          {activeView === 'ladder' && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 mb-2 z-30 sticky top-2 bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
                <button 
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition"
                  aria-label="Previous"
                  onClick={() => {
                    const categories = submenus?.ladder || [];
                    const currentIndex = categories.findIndex(item => item.code === ladderCategory);
                    if (currentIndex > 0) {
                      setLadderCategory(categories[currentIndex - 1].code);
                    } else {
                      // If at the beginning, go to the last category
                      setLadderCategory(categories[categories.length - 1].code);
                    }
                  }}
                >
                  <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6"></path>
                  </svg>
                </button>
                <div className="flex items-center gap-2 bg-gray-800 bg-opacity-80 rounded-full px-6 py-2">
                  <span className="text-red-500 text-lg">▶</span>
                  <span className="text-white text-xl font-bold uppercase">{ladderCategory.replace(/_/g, ' ')}</span>
                </div>
                <button 
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition"
                  aria-label="Next"
                  onClick={() => {
                    const categories = submenus?.ladder || [];
                    const currentIndex = categories.findIndex(item => item.code === ladderCategory);
                    if (currentIndex < categories.length - 1) {
                      setLadderCategory(categories[currentIndex + 1].code);
                    } else {
                      // If at the end, go to the first category
                      setLadderCategory(categories[0].code);
                    }
                  }}
                >
                  <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"></path>
                  </svg>
                </button>
              </div>
              <Ladder category={ladderCategory} selectedDate={selectedDate} />
            </div>
          )}

          {activeView === 'drivers' && (
            <Drivers selectedDate={selectedDate} />
          )}
        </div>
        
        {/* Search Button (Top Right) */}
        <div className="absolute top-4 right-4 z-20">
          <button 
            className="bg-custom-pink hover:bg-white text-white hover:text-black rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
            onClick={() => setActiveView('search')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;