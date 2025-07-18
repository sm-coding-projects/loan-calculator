/**
 * Formatters Utility
 * Provides formatting functions for numbers, currencies, dates, etc.
 * Enhanced with internationalization support
 */

/**
 * Get locale string based on language code
 * @param {string} language - Language code (e.g., 'en', 'es')
 * @returns {string} Locale string (e.g., 'en-US', 'es-ES')
 */
export function getLocaleFromLanguage(language) {
  const localeMap = {
    en: 'en-US',
    es: 'es-ES',
  };
  return localeMap[language] || 'en-US';
}

/**
 * Get date format based on locale
 * @param {string} locale - Locale string (e.g., 'en-US', 'es-ES')
 * @returns {string} Date format string
 */
export function getDateFormatForLocale(locale) {
  const formatMap = {
    'en-US': 'MM/DD/YYYY',
    'es-ES': 'DD/MM/YYYY',
  };
  return formatMap[locale] || 'MM/DD/YYYY';
}

/**
 * Format a number with specified decimal places and locale
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places
 * @param {string} locale - Locale for formatting (e.g., 'en-US', 'es-ES')
 * @returns {string} Formatted number
 */
export function formatNumber(value, decimals = 2, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a value as currency
 * @param {number} value - The value to format
 * @param {string} currencyCode - Currency code (e.g., 'USD', 'EUR')
 * @param {string} locale - Locale for formatting (e.g., 'en-US', 'es-ES')
 * @returns {string} Formatted currency
 */
export function formatCurrency(value, currencyCode = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(value);
}

/**
 * Format a date
 * @param {Date|string} date - The date to format
 * @param {string} format - Format string (e.g., 'MM/DD/YYYY')
 * @param {string} locale - Locale for formatting (e.g., 'en-US', 'es-ES')
 * @returns {string} Formatted date
 */
export function formatDate(date, format = null, locale = 'en-US') {
  const dateObj = date instanceof Date ? date : new Date(date);

  // Use Intl.DateTimeFormat for locale-aware formatting
  if (!format) {
    return new Intl.DateTimeFormat(locale).format(dateObj);
  }

  // Use custom format if specified
  format = format || getDateFormatForLocale(locale);
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const year = dateObj.getFullYear();

  let formatted = format;
  formatted = formatted.replace('MM', month);
  formatted = formatted.replace('DD', day);
  formatted = formatted.replace('YYYY', year);

  return formatted;
}

/**
 * Format a percentage
 * @param {number} value - The value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, decimals = 2) {
  return `${Number(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a duration in months to years and months
 * @param {number} months - Number of months
 * @returns {string} Formatted duration
 */
export function formatDuration(months) {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  let result = '';
  if (years > 0) {
    result += `${years} year${years !== 1 ? 's' : ''}`;
  }

  if (remainingMonths > 0) {
    if (result.length > 0) {
      result += ' and ';
    }
    result += `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  }

  return result;
}
