/**
 * Utility functions for handling cookies
 */

// Function to set a cookie with expiration days
export const setCookie = (name, value, days = 30) => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    const cookieValue = `${name}=${value};expires=${expirationDate.toUTCString()};path=/`;
    document.cookie = cookieValue;
  };
  
  // Function to get a cookie by name
  export const getCookie = (name) => {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(`${name}=`)) {
        return cookie.substring(name.length + 1);
      }
    }
    return null;
  };
  
  // Function to delete a cookie
  export const deleteCookie = (name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  };
  
  // Function to synchronize cookies with localStorage
  export const syncCookieWithLocalStorage = (key) => {
    const localStorageValue = localStorage.getItem(key);
    const cookieValue = getCookie(key);
    
    if (localStorageValue && !cookieValue) {
      // Sync from localStorage to cookies
      setCookie(key, localStorageValue);
    } else if (!localStorageValue && cookieValue) {
      // Sync from cookies to localStorage
      localStorage.setItem(key, cookieValue);
    }
    
    // Return the current value from either source
    return cookieValue || localStorageValue || null;
  };