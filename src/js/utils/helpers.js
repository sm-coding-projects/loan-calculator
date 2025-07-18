/**
 * Helper utility functions for the loan calculator application
 * This module contains general-purpose helper functions used across the application
 */

/**
 * Generate a unique ID for calculations
 * @returns {string} Unique identifier
 */
export function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));

  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Debounce function to limit the rate of function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if a value is a valid number
 * @param {any} value - Value to check
 * @returns {boolean} True if valid number
 */
export function isValidNumber(value) {
  return !isNaN(value) && isFinite(value) && value !== null && value !== '';
}
