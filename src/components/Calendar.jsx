import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'; // Import axios
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { API_CONFIG, ENDPOINTS, buildApiUrl, getDefaultHeaders } from '../utils/api';
import { setCookie, getCookie, syncCookieWithLocalStorage } from '../utils/cookies';

// Function to fetch event data
async function getEventCalendar() {
  try {
    const apiUrl = buildApiUrl(ENDPOINTS.GET_DATES);
    const response = await axios.get(apiUrl, {
      headers: getDefaultHeaders()
    });

    const events = response.data.msg;
    const eventCalendar = {};

    events.forEach(event => {
      const date = new Date(event.RaceTime);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // Months are 0-indexed
      const day = date.getDate();

      if (!eventCalendar[year]) {
        eventCalendar[year] = {};
      }
      if (!eventCalendar[year][month]) {
        eventCalendar[year][month] = {};
      }
      if (!eventCalendar[year][month][day]) {
        eventCalendar[year][month][day] = [];
      }

      eventCalendar[year][month][day].push({
        title: event.EventName,
      });
    });

    return eventCalendar;
  } catch (error) {
    console.error('Error fetching event calendar:', error.response ? error.response.data : error.message);
    return {}; // Return an empty object in case of an error
  }
}

const Calendar = ({ selectedDate, setSelectedDate }) => {
  // Get initial date from cookies or localStorage or use current date if none exists
  const getInitialDate = () => {
    // First, synchronize cookies and localStorage
    const savedDate = syncCookieWithLocalStorage('selectedCalendarDate');
    
    if (savedDate) {
      // If there's a saved date, update the parent component
      if (setSelectedDate && !selectedDate) {
        setSelectedDate(savedDate);
      }
      // Return date object for the saved date
      const [year, month, day] = savedDate.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    
    return new Date(); // Use current date if no saved date exists
  };

  const [currentDate, setCurrentDate] = useState(getInitialDate());
  const [highlightedDays, setHighlightedDays] = useState({});
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [eventPosition, setEventPosition] = useState({ x: 0, y: 0 });
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const calendarRef = useRef(null);

  // Initialize currentDate based on the selectedDate prop if available
  useEffect(() => {
    if (selectedDate) {
      const [year, month, day] = selectedDate.split('-').map(Number);
      setCurrentDate(new Date(year, month - 1, day));
    }
  }, []);

  // Ensure cookies and localStorage are synchronized
  useEffect(() => {
    // Sync cookies and localStorage whenever selectedDate changes
    if (selectedDate) {
      localStorage.setItem('selectedCalendarDate', selectedDate);
      setCookie('selectedCalendarDate', selectedDate, 30);
    }
  }, [selectedDate]);

  // Fetch event data when the component mounts
  useEffect(() => {
    async function fetchData() {
      const eventCalendar = await getEventCalendar();
      const yearKey = currentDate.getFullYear().toString();
      setHighlightedDays(eventCalendar[yearKey] || {});
    }
    fetchData();
  }, [currentDate]);

  // Format month and year
  const month = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const years = Array.from({ length: 10 }, (_, i) => year - 5 + i);

  // Define weekdays with unique identifiers
  const weekDays = [
    { id: 'mon', label: 'M' },
    { id: 'tue', label: 'T' },
    { id: 'wed', label: 'W' },
    { id: 'thu', label: 'T' },
    { id: 'fri', label: 'F' },
    { id: 'sat', label: 'S' },
    { id: 'sun', label: 'S' }
  ];

  // Calculate calendar grid properties
  const firstDayOfMonth = new Date(year, currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyCells = Array.from({ length: adjustedFirstDay }, (_, i) => null);

  const handleMonthSelect = (monthIndex) => {
    setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
    setShowMonthDropdown(false);
  };

  const handleYearSelect = (selectedYear) => {
    setCurrentDate(new Date(selectedYear, currentDate.getMonth(), 1));
    setShowYearDropdown(false);
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const selectDay = (day, event) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Format the date as YYYY-MM-DD
    const formattedDate = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayStr = day.toString();
    const currentMonthKey = `${currentDate.getMonth() + 1}`;
    
    // Set the selected date regardless of whether there are events
    setSelectedDate(formattedDate);
    
    // Save the selected date to localStorage and cookies
    localStorage.setItem('selectedCalendarDate', formattedDate);
    setCookie('selectedCalendarDate', formattedDate, 30);
    
    // Only show event details if there are events for this day
    if (highlightedDays[currentMonthKey] && highlightedDays[currentMonthKey][dayStr]) {
      setSelectedDayEvents(highlightedDays[currentMonthKey][dayStr]);
      
      if (calendarRef.current) {
        const cellRect = event.currentTarget.getBoundingClientRect();
        const calendarRect = calendarRef.current.getBoundingClientRect();
        
        let x = cellRect.left - calendarRect.left + cellRect.width / 2;
        let y = cellRect.top - calendarRect.top + cellRect.height;

        const maxX = calendarRect.width - 320;
        x = Math.min(Math.max(20, x - 160), maxX);
        
        setEventPosition({ x, y });
      }
      
      setShowEventDetails(true);
    } else {
      setSelectedDayEvents([]);
      setShowEventDetails(false);
    }
  };

  const hasEvents = (day) => {
    const dayStr = day.toString();
    const currentMonthKey = `${currentDate.getMonth() + 1}`;
    return highlightedDays[currentMonthKey] && highlightedDays[currentMonthKey][dayStr];
  };

  const getEventCount = (day) => {
    const dayStr = day.toString();
    const currentMonthKey = `${currentDate.getMonth() + 1}`;
    if (highlightedDays[currentMonthKey] && highlightedDays[currentMonthKey][dayStr]) {
      return highlightedDays[currentMonthKey][dayStr].length;
    }
    return 0;
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === currentDate.getMonth() && 
           today.getFullYear() === currentDate.getFullYear();
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    const [year, month, date] = selectedDate.split('-');
    return parseInt(date) === day && 
           (parseInt(month) - 1) === currentDate.getMonth() && 
           parseInt(year) === currentDate.getFullYear();
  };

  // Add a function to format the display date
  const formatDisplayDate = (day) => {
    return `${month} ${day}, ${year}`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowEventDetails(false);
        setShowMonthDropdown(false);
        setShowYearDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      ref={calendarRef}
      className="relative bg-gray-900 bg-blend-saturation backdrop-blur-2xls p-6 rounded-2xl shadow-10xl text-white border border-white/10 w-full max-w-md md:max-w-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <button 
          className="group p-1 hover:bg-custom-pink rounded-lg transition-colors"
          onClick={goToPreviousMonth}
        >
          <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
        </button>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => {
                setShowMonthDropdown(!showMonthDropdown);
                setShowYearDropdown(false);
              }}
              className="flex items-center gap-1 hover:text-custom-pink transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
            >
              <span className="text-lg font-semibold">{month}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showMonthDropdown && (
              <div className="absolute top-full mt-1 bg-gray-800 rounded-lg shadow-xl border border-white/10 py-1 z-50">
                {months.map((m, index) => (
                  <button
                    key={m}
                    onClick={() => handleMonthSelect(index)}
                    className="block w-full px-4 py-2 text-left hover:bg-white/5 text-sm"
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowYearDropdown(!showYearDropdown);
                setShowMonthDropdown(false);
              }}
              className="flex items-center gap-1 hover:text-custom-pink transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
            >
              <span className="text-lg font-semibold">{year}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showYearDropdown && (
              <div className="absolute top-full mt-1 bg-gray-800 rounded-lg shadow-xl border border-white/10 py-1 z-50">
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => handleYearSelect(y)}
                    className="block w-full px-4 py-2 text-left hover:bg-white/5 text-sm"
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button 
          className="group p-1 hover:bg-custom-pink rounded-lg transition-colors"
          onClick={goToNextMonth}
        >
          <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm sm:text-base">
        {weekDays.map((day) => (
          <div 
            key={day.id} 
            className="text-gray-400 text-xs font-medium"
          >
            {day.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 p-3 text-center text-sm sm:text-base">
        {emptyCells.map((_, index) => (
          <div 
            key={`empty-${index}`} 
            className="h-12"
          />
        ))}

        {days.map(day => {
          const eventCount = getEventCount(day);
          const todayClass = isToday(day) ? 'ring-1 ring-custom-pink' : '';
          
          return (
            <div 
              key={day} 
              className={`
                relative h-12 p-3 flex flex-col rounded-lg cursor-pointer
                ${isSelected(day) ? 'bg-white/10': 'hover:bg-white/5'}
                ${todayClass}
                transition-all duration-200
              `}
              onClick={(e) => selectDay(day, e)}
            >
              <div className={`
                text-center text-sm font-medium
                ${isSelected(day) ? 'text-custom-pink' : 'text-white'}
              `}>
                {day}
              </div>
              
              {hasEvents(day) && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                  {Array.from({ length: Math.min(eventCount, 3) }).map((_, idx) => (
                    <div 
                      key={`dot-${idx}`}
                      className="w-1 h-1 rounded-full bg-custom-pink"
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <AnimatePresence>
        {showEventDetails && selectedDayEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            style={{
              left: `${eventPosition.x}px`,
              top: `${eventPosition.y}px`,
            }}
            className="absolute z-50 w-64 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 transform -translate-x-1/2"
          >
            <div className="p-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold">
                  {formatDisplayDate(selectedDate?.split('-')[2])}
                </h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEventDetails(false);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {selectedDayEvents.map((event, idx) => (
                  <motion.div
                    key={`event-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-semibold text-custom-pink">{event.title}</h4>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Calendar;