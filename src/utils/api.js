// Import environment configuration
import { ENV } from './environment';

// API Configuration (for backward compatibility)
export const API_CONFIG = {
  BASE_URL: ENV.API.BASE_URL,
  PROXY_URL: ENV.API.BASE_URL,
  AUTH_TOKEN: ENV.API.AUTH_TOKEN
};

// API Endpoints
export const ENDPOINTS = {
  GET_DATES: '/getdates',
  GET_CATEGORIES: {
    LADDER: '/getcategories/ladder',
    QUALIFYING: '/getcategories/qualifying',
    PAIRING: '/getcategories/pairings',
    RESULTS: '/getcategories/results'
  },
  GET_ROUNDS: {
    LADDER: '/getcategoriesround/ladder',
    QUALIFYING: '/getcategoriesround/qualifying',
    PAIRING: '/getcategoriesround/pairing',
    RESULTS: '/getcategoriesround/results'
  },
  GET_ALL_RESULTS: {
    LADDER: '/getAllResults/ladder',
    QUALIFYING: '/getAllResults/qualifying',
    PAIRING: '/getAllResults/pairing',
    RESULTS: '/getAllResults/results'
  },
  SWAP_PAIRING: '/swappairing'  // This will be used as /swappairing/LADDER_ID/PAIR_NUM
};

// Helper function to format date for API
export const formatDateForApi = (date) => {
  if (!date) {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  
  // If date is already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // If date is in DD/MM/YYYY format, convert to YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    const [day, month, year] = date.split('/');
    return `${year}-${month}-${day}`;
  }

  // Try to parse the date and format it
  try {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Error parsing date:', error);
  }

  // Return today's date as fallback
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

// Helper function to build API URL with date parameter
export const buildApiUrl = (endpoint, category = '', selectedDate = '') => {
  const formattedDate = formatDateForApi(selectedDate);
  
  // Use environment utility for consistent URL building
  return ENV.buildApiUrl(endpoint, category, {
    displaydate: formattedDate
  });
};

// Helper function to get default headers
export const getDefaultHeaders = () => ENV.getApiHeaders();

// Helper function to make API requests
export const makeApiRequest = async (endpoint, category = '', selectedDate = '', options = {}) => {
  try {
    const url = buildApiUrl(endpoint, category, selectedDate);
    
    // Get environment-specific request options
    const requestOptions = ENV.getRequestOptions(options);
    
    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.msg || 'API returned an error');
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}; 