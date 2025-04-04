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
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  
  // God Mode scaling system
  const [godModeLevel, setGodModeLevel] = useState(0); // 0 = off, 1-3 = scaling levels
  const [contentWindow, setContentWindow] = useState(null);
  const [isSidebarWindow, setIsSidebarWindow] = useState(false);
  
  // Check if this is the content window
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isContentWindow = urlParams.get('mode') === 'content';
    setIsSidebarWindow(!isContentWindow);

    // Listen for messages from the other window
    const handleMessage = (event) => {
      // Only accept messages from our own origin
      if (event.origin !== window.location.origin) return;
      
      const data = event.data;
      if (data.type === 'state-update') {
        setActiveView(data.activeView);
        setSelectedCategory(data.selectedCategory);
        setSelectedDate(data.selectedDate);
        setLadderCategory(data.ladderCategory);
        setGodModeLevel(data.godModeLevel);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Function to open content window
  const openContentWindow = () => {
    if (!contentWindow || contentWindow.closed) {
      const windowFeatures = 'width=1200,height=800,menubar=no,toolbar=no,status=no';
      const contentUrl = `${window.location.origin}${window.location.pathname}?mode=content`;
      const newWindow = window.open(contentUrl, 'content-window', windowFeatures);
      
      if (newWindow) {
        setContentWindow(newWindow);
        
        // Wait for the window to load and then sync state
        newWindow.onload = () => {
          syncState();
        };
        
        // Handle window close
        const checkWindow = setInterval(() => {
          if (newWindow.closed) {
            setContentWindow(null);
            clearInterval(checkWindow);
          }
        }, 1000);
      }
    } else {
      contentWindow.focus();
    }
  };

  // Sync state between windows
  const syncState = () => {
    if (contentWindow && !contentWindow.closed) {
      const state = {
        type: 'state-update',
        activeView,
        selectedCategory,
        selectedDate,
        ladderCategory,
        godModeLevel
      };
      
      try {
        contentWindow.postMessage(state, window.location.origin);
      } catch (error) {
        console.error('Error syncing state:', error);
      }
    }
  };

  // Call syncState whenever relevant state changes
  useEffect(() => {
    if (isSidebarWindow) {
      syncState();
    }
  }, [activeView, selectedCategory, selectedDate, ladderCategory, godModeLevel]);

  // Open content window on sidebar mount and reopen if closed
  useEffect(() => {
    if (isSidebarWindow) {
      const checkAndOpenWindow = () => {
        if (!contentWindow || contentWindow.closed) {
          openContentWindow();
        }
      };
      
      checkAndOpenWindow();
      const intervalId = setInterval(checkAndOpenWindow, 2000);
      
      return () => clearInterval(intervalId);
    }
  }, [isSidebarWindow]);

  // Handle keyboard shortcuts for God Mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd/Ctrl + Shift + 1/2/3
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === '1' || e.key === '2' || e.key === '3')) {
        const level = parseInt(e.key);
        setGodModeLevel(level);
        // Show feedback for the mode change
        showGodModeIndicator(level);
        e.preventDefault();
      }
      
      // Reset to normal with Cmd/Ctrl + Shift + 0
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '0') {
        setGodModeLevel(0);
        // Show feedback for mode off
        showGodModeIndicator(0);
        e.preventDefault();
      }
    };
    
    // Add the event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Remove the event listener on cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Function to show a temporary visual indicator when God Mode is toggled
  const showGodModeIndicator = (level) => {
    // Create or get the indicator element
    let indicator = document.getElementById('god-mode-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'god-mode-indicator';
      document.body.appendChild(indicator);
    }
    
    // Set the message based on level
    let message = '';
    switch(level) {
      case 0:
        message = 'God Mode: OFF';
        break;
      case 1:
        message = 'God Mode: LEVEL 1';
        break;
      case 2:
        message = 'God Mode: LEVEL 2';
        break;
      case 3:
        message = 'God Mode: LEVEL 3';
        break;
      default:
        message = 'God Mode: UNKNOWN';
    }
    
    // Style and show the indicator
    indicator.innerText = message;
    indicator.style.position = 'fixed';
    indicator.style.top = '20px';
    indicator.style.left = '50%';
    indicator.style.transform = 'translateX(-50%)';
    indicator.style.padding = '10px 20px';
    indicator.style.background = level === 0 ? '#333' : '#e11d48';
    indicator.style.color = 'white';
    indicator.style.borderRadius = '8px';
    indicator.style.fontWeight = 'bold';
    indicator.style.zIndex = '9999';
    indicator.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    indicator.style.opacity = '1';
    indicator.style.transition = 'opacity 0.3s ease-in-out';
    
    // Remove after a delay
    setTimeout(() => {
      indicator.style.opacity = '0';
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 300);
    }, 2000);
  };

  // Function to fetch categories
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
      
      // Update last refresh timestamp
      setLastRefresh(Date.now());
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

  useEffect(() => {
    if (selectedDate) {
      fetchCategories();
    }
  }, [selectedDate]);
  
  // Set up auto-refresh polling every 2 minutes
  useEffect(() => {
    const AUTO_REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds
    
    // Create polling interval for auto-refresh
    const intervalId = setInterval(() => {
      if (selectedDate) {
        console.log('Auto-refreshing data...');
        fetchCategories();
      }
    }, AUTO_REFRESH_INTERVAL);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [selectedDate]); // Re-establish interval if selectedDate changes

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

  // Calculate scaling based on God Mode level
  const getGodModeStyles = () => {
    if (godModeLevel === 0) return {};
    
    const scales = {
      1: 1.15, // Level 1: 15% larger
      2: 1.3,  // Level 2: 30% larger
      3: 1.5   // Level 3: 50% larger
    };
    
    const scale = scales[godModeLevel] || 1;
    
    return {
      fontSize: `${scale}rem`,
      '--god-mode-scale': scale
    };
  };

  // Render only sidebar if this is the sidebar window
  if (isSidebarWindow) {
  return (
      <div className="sidebar-window" style={getGodModeStyles()}>
      <Sidebar 
        setActiveView={setActiveView} 
        setLadderCategory={setLadderCategory}
        setSelectedCategory={setSelectedCategory}
        selectedCategory={selectedCategory}
        selectedDate={selectedDate}
        setSelectedDate={handleDateSelect}
        ladderCategory={ladderCategory}
          godModeLevel={godModeLevel}
      />
      </div>
    );
  }
      
  // Render only content if this is the content window
  return (
    <div className="content-window" style={getGodModeStyles()}>
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
      <div className="absolute inset-0 z-10 flex items-center justify-center overflow-auto custom-scrollbar">
        <div className="w-full h-full flex items-center justify-center">
          {activeView === 'calendar' && (
            <div className="flex items-center justify-center w-full">
              <Calendar selectedDate={selectedDate} setSelectedDate={handleDateSelect} godModeLevel={godModeLevel} />
            </div>
          )}
          
          {activeView === 'search' && (
            <div className="w-full max-w-2xl">
              <SearchBar 
                selectedDate={selectedDate} 
                setSelectedDate={handleDateSelect}
                setActiveView={setActiveView}
                apiEndpoint={`${API_CONFIG.PROXY_URL}/getdates`}
                apiToken={API_CONFIG.AUTH_TOKEN}
                godModeLevel={godModeLevel}
              />
            </div>
          )}
          
          {activeView === 'categories' && (
            <div className="flex items-center justify-center w-full">
              <CategoryMenu 
                setSelectedCategory={setSelectedCategory} 
                setActiveView={setActiveView} 
                godModeLevel={godModeLevel}
              />
            </div>
          )}
          
          {activeView === 'results' && (
            <div className="w-full max-w-[1200px] mx-auto px-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                <button 
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition"
                  aria-label="Previous"
                  onClick={() => {
                    const categories = submenus?.results || [];
                    const currentIndex = categories.findIndex(item => item.label === selectedCategory);
                    if (currentIndex > 0) {
                      setSelectedCategory(categories[currentIndex - 1].label);
                    } else {
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
                      setSelectedCategory(categories[0].label);
                    }
                  }}
                >
                  <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"></path>
                  </svg>
                </button>
              </div>
              <ResultsTable 
                category={selectedCategory} 
                selectedDate={selectedDate} 
                godModeLevel={godModeLevel} 
              />
            </div>
          )}

          {activeView === 'qualifying' && (
            <div className="w-full max-w-[1200px] mx-auto px-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                <button 
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition"
                  aria-label="Previous"
                  onClick={() => {
                    const categories = submenus?.qualifying || [];
                    const currentIndex = categories.findIndex(item => item.label === selectedCategory);
                    if (currentIndex > 0) {
                      setSelectedCategory(categories[currentIndex - 1].label);
                    } else {
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
                      setSelectedCategory(categories[0].label);
                    }
                  }}
                >
                  <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"></path>
                  </svg>
                </button>
              </div>
              <Qualifying 
                selectedDate={selectedDate} 
                category={selectedCategory} 
                godModeLevel={godModeLevel}
              />
            </div>
          )}

          {activeView === 'pairing' && (
            <div className="w-full max-w-[1200px] mx-auto px-4">
              <div className="flex items-center justify-center gap-4 mb-4">
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
            <Pairing 
              selectedDate={selectedDate} 
              category={selectedCategory}
              godModeLevel={godModeLevel} 
            />
            </div>
          )}

          {activeView === 'ladder' && (
            <div className="w-full max-w-[1200px] mx-auto px-4">
              <div className="flex items-center justify-center gap-4 mb-2 z-30 sticky top-2 bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
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
            <Ladder 
              category={ladderCategory} 
              selectedDate={selectedDate}
              godModeLevel={godModeLevel} 
            />
            </div>
          )}

          {activeView === 'drivers' && (
            <div className="flex items-center justify-center w-full">
              <Drivers selectedDate={selectedDate} godModeLevel={godModeLevel} />
            </div>
          )}
        </div>
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
      
      {/* God Mode Keyboard Shortcut Help */}
      <div className="absolute bottom-4 right-4 z-20 text-xs text-gray-400 bg-black bg-opacity-50 p-2 rounded">
        <div>Press <kbd className="bg-gray-700 px-1 rounded">Cmd/Ctrl</kbd> + <kbd className="bg-gray-700 px-1 rounded">Shift</kbd> + <kbd className="bg-gray-700 px-1 rounded">1-3</kbd> for God Mode</div>
        <div>Press <kbd className="bg-gray-700 px-1 rounded">Cmd/Ctrl</kbd> + <kbd className="bg-gray-700 px-1 rounded">Shift</kbd> + <kbd className="bg-gray-700 px-1 rounded">0</kbd> to reset</div>
      </div>
    </div>
  );
}

export default App;