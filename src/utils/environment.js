/**
 * Environment configuration for the application
 * This centralizes all environment-specific settings and detects the current environment
 */

// Environment detection
const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging'
};

// Detect current environment
const detectEnvironment = () => {
  const hostname = window.location.hostname;
  
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return ENVIRONMENTS.DEVELOPMENT;
  } else if (hostname.includes('outix.co')) {
    return ENVIRONMENTS.PRODUCTION;
  } else if (hostname.includes('staging') || hostname.includes('test')) {
    return ENVIRONMENTS.STAGING;
  }
  
  // Default to development for safety
  return ENVIRONMENTS.DEVELOPMENT;
};

// API configuration for different environments
const API_CONFIGS = {
  [ENVIRONMENTS.DEVELOPMENT]: {
    BASE_URL: 'http://localhost:3000/forward?url=https://www.outix.co/thirdparty',
    USE_PROXY: true,
    NEEDS_CORS: true
  },
  [ENVIRONMENTS.STAGING]: {
    BASE_URL: 'https://staging.outix.co/thirdparty',
    USE_PROXY: false,
    NEEDS_CORS: true
  },
  [ENVIRONMENTS.PRODUCTION]: {
    BASE_URL: 'https://www.outix.co/thirdparty',
    USE_PROXY: false,
    NEEDS_CORS: false
  }
};

// Authentication token (consistent across environments for now)
const AUTH_TOKEN = 'UY_eAWHxXHT6Adb8OBIit0txV6SjHVFC3H_2_Em_hy0=';

// Create the environment configuration
export const ENV = {
  // Current environment
  CURRENT: detectEnvironment(),
  
  // Environment checks
  IS_DEVELOPMENT: detectEnvironment() === ENVIRONMENTS.DEVELOPMENT,
  IS_PRODUCTION: detectEnvironment() === ENVIRONMENTS.PRODUCTION,
  IS_STAGING: detectEnvironment() === ENVIRONMENTS.STAGING,
  
  // API configuration
  API: {
    BASE_URL: API_CONFIGS[detectEnvironment()].BASE_URL,
    USE_PROXY: API_CONFIGS[detectEnvironment()].USE_PROXY,
    NEEDS_CORS: API_CONFIGS[detectEnvironment()].NEEDS_CORS,
    AUTH_TOKEN: AUTH_TOKEN
  },
  
  // Asset paths (for consistent asset loading across environments)
  ASSETS: {
    // Returns asset path with proper prefix for current environment
    getPath: (path) => {
      // Remove leading slash if present
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      // Return with relative path
      return `./${cleanPath}`;
    }
  },
  
  // API request helpers
  getApiHeaders: () => {
    const headers = {
      'Auth-Token': AUTH_TOKEN,
      'Content-Type': 'application/json'
    };
    
    if (detectEnvironment() === ENVIRONMENTS.PRODUCTION) {
      // Add production-specific headers
      headers['Origin'] = 'https://www.outix.co';
    }
    
    return headers;
  },
  
  getRequestOptions: (customOptions = {}) => {
    const options = {
      headers: ENV.getApiHeaders(),
      ...customOptions
    };
    
    // Add credentials if needed
    if (detectEnvironment() === ENVIRONMENTS.PRODUCTION) {
      options.credentials = 'include';
    }
    
    return options;
  },
  
  // Build complete API URL with all necessary parts
  buildApiUrl: (endpoint, category = '', params = {}) => {
    const baseUrl = API_CONFIGS[detectEnvironment()].BASE_URL;
    const categoryPath = category ? `/${category}` : '';
    const url = `${baseUrl}${endpoint}${categoryPath}`;
    
    // Add query parameters if provided
    if (Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
      return `${url}?${queryParams.toString()}`;
    }
    
    return url;
  }
};

// Export environment types for reference
export const ENVIRONMENT_TYPES = ENVIRONMENTS; 