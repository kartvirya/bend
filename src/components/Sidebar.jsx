import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Trophy, Flag, Users, ChevronDown, ChevronRight, Activity, Timer, Aperture, Medal, Star } from 'lucide-react';
import { ENDPOINTS, makeApiRequest, formatDateForApi } from '../utils/api';

function App() {
  const [activeView, setActiveView] = useState('pairing');

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar setActiveView={setActiveView} />
      <div className="flex-1 flex items-center justify-center">
        <p>Start prompting (or editing) to see magic happen :)</p>
      </div>
    </div>
  );
}

const Sidebar = ({ setActiveView, setLadderCategory, selectedDate, setSelectedDate, setSelectedCategory, selectedCategory, ladderCategory }) => {
  const [activeItem, setActiveItem] = useState('pairing');
  const [expanded, setExpanded] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [lastOpenSubmenu, setLastOpenSubmenu] = useState(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0 });
  const [submenus, setSubmenus] = useState({});
  const [loading, setLoading] = useState({});
  const [eventDates, setEventDates] = useState([]);
  const [eventCount, setEventCount] = useState(0);
  const menuRefs = useRef({});
  const submenuRef = useRef(null);

  const today = new Date();
  const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  const defaultApiDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const menuItems = [
    {
      view: 'calendar',
      icon: Calendar,
      label: selectedDate || formattedDate
    },
    {
      view: 'results',
      icon: Trophy,
      label: 'RESULTS',
      endpoint: ENDPOINTS.GET_CATEGORIES.RESULTS,
    },
    {
      view: 'ladder',
      icon: Activity,
      label: 'LADDER',
      endpoint: ENDPOINTS.GET_CATEGORIES.LADDER,
    },
    // {
    //   view: 'pairing',
    //   icon: Aperture,
    //   label: 'PAIRING',
    //   endpoint: ENDPOINTS.GET_CATEGORIES.PAIRING,
    // },
    {
      view: 'qualifying',
      icon: Timer,
      label: 'QUALIFYING',
      endpoint: ENDPOINTS.GET_CATEGORIES.QUALIFYING,
    },
    {
      view: 'drivers',
      icon: Users,
      label: 'DRIVERS',
    }
  ];

  const fetchSubmenu = async (view, endpoint) => {
    if (!endpoint) return;
  
    setLoading(prev => ({ ...prev, [view]: true }));
  
    try {
      if (view === 'calendar') {
        setLoading(prev => ({ ...prev, [view]: false }));
        return;
      }
  
      const data = await makeApiRequest(endpoint, '', selectedDate);
      
      if (Array.isArray(data.msg) && data.msg.length > 0) {
        const formattedSubmenu = data.msg.map((item) => ({
          label: item.Category,
          view: item.CategoryCode.toLowerCase(),
          code: item.CategoryCode,
        }));
  
        setSubmenus((prev) => ({ ...prev, [view]: formattedSubmenu }));
      } else {
        console.log(`No data found for ${view}`);
        setSubmenus((prev) => ({ ...prev, [view]: [] }));
      }
    } catch (error) {
      console.error(`Error fetching submenu for ${view}:`, error);
    } finally {
      setLoading((prev) => ({ ...prev, [view]: false }));
    }
  };

  const fetchEventDates = async () => {
    try {
      const data = await makeApiRequest(ENDPOINTS.GET_DATES);
      
      if (Array.isArray(data.msg) && data.msg.length > 0) {
        setEventDates(data.msg);
        setEventCount(data.msg.length);
      } else {
        console.log('No event dates found');
        setEventDates([]);
        setEventCount(0);
      }
    } catch (error) {
      console.error('Error fetching event dates:', error);
      setEventDates([]);
      setEventCount(0);
    }
  };

  const updateSubmenuPosition = (view) => {
    const buttonRef = menuRefs.current[view];
    if (buttonRef) {
      const rect = buttonRef.getBoundingClientRect();
      setSubmenuPosition({
        top: rect.top,
      });
    }
  };

  const handleItemClick = (view, endpoint) => {
    if (endpoint && (!submenus[view] || submenus[view].length === 0) && !loading[view]) {
      let apiEndpoint;
      switch (view) {
        case 'results':
          apiEndpoint = ENDPOINTS.GET_CATEGORIES.RESULTS;
          break;
        case 'ladder':
          apiEndpoint = ENDPOINTS.GET_CATEGORIES.LADDER;
          break;
        case 'pairing':
          apiEndpoint = ENDPOINTS.GET_CATEGORIES.PAIRING;
          break;
        case 'qualifying':
          apiEndpoint = ENDPOINTS.GET_CATEGORIES.QUALIFYING;
          break;
        default:
          apiEndpoint = endpoint;
      }
      fetchSubmenu(view, apiEndpoint);
    }
    
    if (expanded) {
      if (openSubmenu === view) {
        setOpenSubmenu(null);
      } else {
        if (view !== 'calendar' && view !== 'drivers') {
          setOpenSubmenu(view);
        }
      }
    } else {
      if (openSubmenu === view) {
        setOpenSubmenu(null);
      } else {
        if (view !== 'calendar' && view !== 'drivers') {
          setOpenSubmenu(view);
          updateSubmenuPosition(view);
        }
      }
    }
    setActiveItem(view);
    setActiveView(view);
  };

  const handleSubmenuClick = (view, code, e) => {
    e.stopPropagation();
    
    if (openSubmenu === 'calendar') {
      const [day, month, year] = view.split('/');
      const formattedDate = `${year}-${month}-${day}`;
      setSelectedDate(formattedDate);

      setSubmenus({});

      menuItems.forEach(item => {
        if (item.endpoint) {
          fetchSubmenu(item.view, item.endpoint);
        }
      });

      setOpenSubmenu(null);
      setActiveItem('calendar');
    } else if (openSubmenu === 'ladder' && setLadderCategory) {
      setLadderCategory(code);
      const clickedSubItem = submenus[openSubmenu].find(item => item.code === code);
      if (clickedSubItem) {
        setSelectedCategory(clickedSubItem.label);
      }
      setActiveView('ladder');
      setActiveItem('ladder');
    } else if ((openSubmenu === 'results' || openSubmenu === 'pairing' || openSubmenu === 'qualifying') && setSelectedCategory) {
      const clickedSubItem = submenus[openSubmenu].find(item => item.code === code);
      if (clickedSubItem) {
        setSelectedCategory(clickedSubItem.label);
        setActiveView(openSubmenu);
        setActiveItem(openSubmenu);
      }
    } else {
      setActiveView(view);
      setActiveItem(view);
      if (!code) {
        setOpenSubmenu(null);
      }
    }
  };

  const handleSidebarToggle = () => {
    if (expanded) {
      setLastOpenSubmenu(openSubmenu);
      setOpenSubmenu(null);
    } else {
      setOpenSubmenu(lastOpenSubmenu);
    }
    setExpanded(!expanded);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (openSubmenu && !expanded) {
        updateSubmenuPosition(openSubmenu);
      }
    };

    const menuContainer = document.querySelector('.menu-container');
    if (menuContainer) {
      menuContainer.addEventListener('scroll', handleScroll);
      return () => menuContainer.removeEventListener('scroll', handleScroll);
    }
  }, [openSubmenu, expanded]);

  useEffect(() => {
    const handleMouseLeave = () => {
      setOpenSubmenu(null);
    };

    const submenuElement = submenuRef.current;
    if (submenuElement) {
      submenuElement.addEventListener('mouseleave', handleMouseLeave);
      return () => submenuElement.removeEventListener('mouseleave', handleMouseLeave);
    }
  }, [openSubmenu]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setExpanded(false);
      } else {
        setExpanded(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchEventDates();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setSubmenus({});
      menuItems.forEach(item => {
        if (item.endpoint) {
          fetchSubmenu(item.view, item.endpoint);
        }
      });
    }
  }, [selectedDate]);

  return (
    <>
      <div 
        className={`${expanded ? 'w-64' : 'w-20'} h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex flex-col border-r border-red-700/30 transition-all duration-300 ease-in-out relative`}
      >
        <button
          className="absolute -right-3 top-16 bg-custom-pink rounded-full p-1.5 cursor-pointer shadow-lg z-50 hover:bg-red-700 transition-colors group"
          onClick={handleSidebarToggle}
        >
          <div className={`transform transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
        </button>

        <div className="flex items-center justify-center px-6 py-6">
          <div className="relative">
            <div className="flex items-center justify-center mb-8">
              <img
                alt="Logo"
                className="h-12 w-auto"
                src="./logo.svg"
              />
            </div>
          </div>
        </div>

        <div className="relative w-full h-0.5 mb-6">
          <div className="absolute w-full h-full bg-red-700/20"></div>
          <div className="absolute h-full w-2/3 bg-red-600/50"></div>
          <div className="absolute h-full w-1/3 right-0 bg-red-800/30"></div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-2 menu-container">
          {menuItems.map((item) => (
            <div key={item.view} className="relative group">
              <button
                ref={el => menuRefs.current[item.view] = el}
                onClick={() => handleItemClick(item.view, item.endpoint)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200
                  ${activeItem === item.view 
                    ? 'bg-gradient-to-r from-custom-pink to-red-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}
              >
                <item.icon className={`flex-shrink-0 w-5 h-5 ${expanded ? 'mr-3' : ''}`} />
                {expanded && (
                  <>
                    <span className="flex-1 text-sm font-medium truncate">
                      {item.view === 'calendar' ? (selectedDate || item.label) : item.label}
                    </span>
                    {item.endpoint && item.view !== 'calendar' && item.view !== 'drivers' && (
                      <ChevronDown 
                        className={`flex-shrink-0 w-4 h-4 transition-transform duration-200 
                          ${openSubmenu === item.view ? 'transform rotate-180' : ''}`}
                      />
                    )}
                  </>
                )}
              </button>

              {expanded && openSubmenu === item.view && (
                <div className="mt-1 pl-3 space-y-1">
                  {item.view === 'calendar' ? (
                    eventDates.length > 0 ? (
                      eventDates.map((dateItem) => (
                        <button
                          key={dateItem.DisplayDate}
                          onClick={(e) => handleSubmenuClick(dateItem.DisplayDate, null, e)}
                          className={`w-full flex items-center py-2 text-sm transition-colors rounded-md group
                            ${selectedDate === dateItem.DisplayDate
                              ? 'text-red-400' 
                              : 'text-gray-400 hover:text-white'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 transition-colors
                            ${selectedDate === dateItem.DisplayDate ? 'bg-red-400' : 'bg-gray-600 group-hover:bg-white'}`}
                          />
                          {dateItem.DisplayDate}
                        </button>
                      ))
                    ) : (
                      <div className="py-2 text-gray-400 text-sm">
                        No event dates available
                      </div>
                    )
                  ) : loading[item.view] ? (
                    <div className="flex items-center py-2 text-gray-400">
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-red-500 border-t-transparent rounded-full"></div>
                      Loading...
                    </div>
                  ) : submenus[item.view] && submenus[item.view].length > 0 ? (
                    submenus[item.view].map((subItem) => (
                      <button
                        key={subItem.code}
                        onClick={(e) => handleSubmenuClick(subItem.view, subItem.code, e)}
                        className={`w-full flex items-center py-2 text-sm transition-colors rounded-md group
                          ${(openSubmenu === 'ladder' && item.view === 'ladder' && subItem.code === ladderCategory) || 
                             ((openSubmenu !== 'ladder' || item.view !== 'ladder') && subItem.label === selectedCategory)
                            ? 'text-red-400 bg-red-500/10' 
                            : 'text-gray-400 hover:text-white'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 transition-colors
                          ${(openSubmenu === 'ladder' && item.view === 'ladder' && subItem.code === ladderCategory) || 
                             ((openSubmenu !== 'ladder' || item.view !== 'ladder') && subItem.label === selectedCategory)
                            ? 'bg-red-400' 
                            : 'bg-gray-600 group-hover:bg-white'}`}
                        />
                        <span className="truncate">{subItem.label}</span>
                      </button>
                    ))
                  ) : (
                    <div className="py-2 text-gray-400 text-sm">
                      No categories available
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {expanded && (
          <div className="px-3 py-4 bg-gray-800/50">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="flex items-center space-x-2">
                  <Medal className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-gray-400">Events</span>
                </div>
                <p className="text-lg font-bold text-white">{eventCount}</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-400">Drivers</span>
                </div>
                <p className="text-lg font-bold text-white">100</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {!expanded && openSubmenu && (
        <div 
          ref={submenuRef}
          className="fixed left-20 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl z-50 min-w-[200px] max-w-[280px]" 
          style={{
            top: `${submenuPosition.top}px`,
            transform: 'translateY(-0.5rem)'
          }}
        >
          <div className="py-2">
            {openSubmenu === 'calendar' ? (
              eventDates.length > 0 ? (
                eventDates.map((dateItem) => (
                  <button
                    key={dateItem.DisplayDate}
                    onClick={(e) => handleSubmenuClick(dateItem.DisplayDate, null, e)}
                    className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors group
                      ${selectedDate === dateItem.DisplayDate
                        ? 'bg-red-600/20 text-red-400' 
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 transition-colors
                      ${selectedDate === dateItem.DisplayDate ? 'bg-red-400' : 'bg-gray-600 group-hover:bg-white'}`}
                    />
                    {dateItem.DisplayDate}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2.5 text-gray-300 text-sm">
                  No event dates available
                </div>
              )
            ) : loading[openSubmenu] ? (
              <div className="flex items-center px-4 py-2.5 text-gray-300">
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-red-500 border-t-transparent rounded-full"></div>
                Loading...
              </div>
            ) : submenus[openSubmenu] && submenus[openSubmenu].length > 0 ? (
              submenus[openSubmenu].map((subItem) => (
                <button
                  key={subItem.code}
                  onClick={(e) => handleSubmenuClick(subItem.view, subItem.code, e)}
                  className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors group
                    ${(openSubmenu === 'ladder' && subItem.code === ladderCategory) || 
                       (openSubmenu !== 'ladder' && subItem.label === selectedCategory)
                      ? 'bg-red-600/20 text-red-400' 
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 transition-colors
                      ${(openSubmenu === 'ladder' && subItem.code === ladderCategory) || 
                         (openSubmenu !== 'ladder' && subItem.label === selectedCategory)
                        ? 'bg-red-400' 
                        : 'bg-gray-600 group-hover:bg-white'}`}
                    />
                    <span className="truncate">{subItem.label}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-2.5 text-gray-300 text-sm">
                  No categories available
                </div>
              )}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;