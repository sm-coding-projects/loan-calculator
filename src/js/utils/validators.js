/**
 * Validators Utility
 * Provides validation functions for form inputs
 */

/**
 * Validate that a value is a number
 * @param {any} value - The value to validate
 * @returns {boolean} True if valid
 */
export function isNumber(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Validate that a value is a positive number
 * @param {any} value - The value to validate
 * @returns {boolean} True if valid
 */
export function isPositiveNumber(value) {
  return isNumber(value) && parseFloat(value) > 0;
}

/**
 * Validate that a value is within a range
 * @param {any} value - The value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if valid
 */
export function isInRange(value, min, max) {
  return isNumber(value) && parseFloat(value) >= min && parseFloat(value) <= max;
}

/**
 * Validate that a value is a valid interest rate
 * @param {any} value - The value to validate
 * @returns {boolean} True if valid
 */
export function isValidInterestRate(value) {
  return isInRange(value, 0, 100);
}

/**
 * Validate that a value is a valid inflation rate
 * @param {any} value - The value to validate
 * @returns {boolean} True if valid
 */
export function isValidInflationRate(value) {
  return isInRange(value, 0, 20);
}

/**
 * Validate that a value is a valid loan term in months
 * @param {any} value - The value to validate
 * @returns {boolean} True if valid
 */
export function isValidLoanTerm(value) {
  return isNumber(value) && Number.isInteger(parseFloat(value)) && parseFloat(value) > 0;
}

/**
 * Validate that a value is a valid date
 * @param {any} value - The value to validate
 * @returns {boolean} True if valid
 */
export function isValidDate(value) {
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }

  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Validate that a value is not empty
 * @param {any} value - The value to validate
 * @returns {boolean} True if valid
 */
export function isNotEmpty(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

/**
 * Get validation error message
 * @param {string} validationType - Type of validation
 * @param {any} value - The value that failed validation
 * @param {Object} options - Additional options for error message
 * @returns {string} Error message
 */
export function getValidationErrorMessage(validationType, value, options = {}) {
  const messages = {
    isNumber: 'Please enter a valid number.',
    isPositiveNumber: 'Please enter a positive number.',
    isInRange: `Please enter a number between ${options.min} and ${options.max}.`,
    isValidInterestRate: 'Please enter a valid interest rate between 0 and 100.',
    isValidInflationRate: 'Please enter a valid inflation rate between 0 and 20.',
    isValidLoanTerm: 'Please enter a valid loan term (positive whole number).',
    isValidDate: 'Please enter a valid date.',
    isNotEmpty: 'This field is required.',
  };

  return messages[validationType] || 'Invalid input.';
}
