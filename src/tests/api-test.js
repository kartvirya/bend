// Test file to verify API configuration and endpoints
import { API_CONFIG, ENDPOINTS, buildApiUrl, getDefaultHeaders, makeApiRequest } from '../utils/api';

// Test function to verify API configuration
const testApiConfig = () => {
  console.log('API Configuration:');
  console.log('BASE_URL:', API_CONFIG.BASE_URL);
  console.log('PROXY_URL:', API_CONFIG.PROXY_URL);
  console.log('AUTH_TOKEN:', API_CONFIG.AUTH_TOKEN);
  
  console.log('\nAPI Endpoints:');
  console.log('GET_DATES:', ENDPOINTS.GET_DATES);
  console.log('GET_CATEGORIES.LADDER:', ENDPOINTS.GET_CATEGORIES.LADDER);
  
  // Test URL building
  const testUrl1 = buildApiUrl(ENDPOINTS.GET_DATES);
  console.log('\nTest URL for GET_DATES:', testUrl1);
  
  const testUrl2 = buildApiUrl(ENDPOINTS.GET_ALL_RESULTS.LADDER, 'SUPER_GAS', '2025-03-01');
  console.log('Test URL for GET_ALL_RESULTS.LADDER with category and date:', testUrl2);
  
  // Test headers
  console.log('\nAPI Headers:', getDefaultHeaders());
};

// Run the test
testApiConfig();

// Example of making an API request
// Uncomment to test an actual API call
/*
const testApiCall = async () => {
  try {
    const data = await makeApiRequest(ENDPOINTS.GET_DATES);
    console.log('API Response:', data);
  } catch (error) {
    console.error('API Error:', error);
  }
};

testApiCall();
*/ 