/**
 * Accessibility Utility
 * Provides functions for improving application accessibility
 * Implements requirements 6.1, 6.2, 6.5, 6.6
 */

/**
 * Set focus to an element
 * @param {HTMLElement} element - Element to focus
 */
export function setFocus(element) {
  if (element && typeof element.focus === 'function') {
    element.focus();
  }
}

/**
 * Add keyboard navigation to a component
 * @param {HTMLElement} container - Container element
 * @param {string} selector - Selector for focusable elements
 * @param {boolean} loop - Whether to loop from last to first element
 */
export function addKeyboardNavigation(container, selector = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])', loop = true) {
  if (!container) return;

  const focusableElements = container.querySelectorAll(selector);
  if (focusableElements.length === 0) return;

  container.addEventListener('keydown', (e) => {
    // Tab key navigation
    if (e.key === 'Tab') {
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab on first element
      if (e.shiftKey && document.activeElement === firstElement) {
        if (loop) {
          e.preventDefault();
          lastElement.focus();
        }
      } else if (!e.shiftKey && document.activeElement === lastElement) { // Tab on last element
        if (loop) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  });
}

/**
 * Make an element announce a message to screen readers
 * @param {string} message - Message to announce
 * @param {string} ariaLive - ARIA live value ('polite' or 'assertive')
 * @param {number} delay - Delay before announcement in milliseconds
 */
export function announceToScreenReader(message, ariaLive = 'polite', delay = 100) {
  // Create or get the announcement element
  let announcer = document.getElementById('screen-reader-announcer');

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'screen-reader-announcer';
    announcer.setAttribute('aria-live', ariaLive);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('role', 'status');
    announcer.classList.add('sr-only');
    document.body.appendChild(announcer);
  }

  // Clear previous message
  announcer.textContent = '';

  // Force a DOM reflow and add delay for better screen reader compatibility
  void announcer.offsetWidth;

  setTimeout(() => {
    announcer.textContent = message;
  }, delay);
}

/**
 * Announce loading states to screen readers
 * @param {string} status - Loading status ('started', 'progress', 'completed', 'error')
 * @param {string} message - Custom message
 * @param {number} progress - Progress percentage (0-100)
 */
export function announceLoadingState(status, message = '', progress = null) {
  let announcement = '';
  
  switch (status) {
    case 'started':
      announcement = message || 'Calculation started. Please wait.';
      break;
    case 'progress':
      if (progress !== null) {
        announcement = `${message || 'Calculating'} ${Math.round(progress)}% complete.`;
      } else {
        announcement = message || 'Calculation in progress.';
      }
      break;
    case 'completed':
      announcement = message || 'Calculation completed. Results are now available.';
      break;
    case 'error':
      announcement = message || 'An error occurred during calculation. Please try again.';
      break;
    default:
      announcement = message;
  }
  
  const ariaLive = status === 'error' ? 'assertive' : 'polite';
  announceToScreenReader(announcement, ariaLive);
}

/**
 * Announce form validation errors to screen readers
 * @param {string} fieldName - Name of the field with error
 * @param {string} errorMessage - Error message
 */
export function announceValidationError(fieldName, errorMessage) {
  const announcement = `${fieldName} field error: ${errorMessage}`;
  announceToScreenReader(announcement, 'assertive');
}

/**
 * Add internationalization support to an element
 * @param {HTMLElement} element - Element to update
 * @param {string} textContent - Text content to set
 * @param {string} language - Language code
 */
export function setInternationalizedText(element, textContent, language = 'en') {
  if (!element) return;

  element.textContent = textContent;
  element.setAttribute('lang', language);

  // Set text direction based on language
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  if (rtlLanguages.includes(language)) {
    element.setAttribute('dir', 'rtl');
  } else {
    element.setAttribute('dir', 'ltr');
  }
}

/**
 * Update document language
 * @param {string} language - Language code
 */
export function updateDocumentLanguage(language = 'en') {
  document.documentElement.setAttribute('lang', language);

  // Set text direction based on language
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  if (rtlLanguages.includes(language)) {
    document.documentElement.setAttribute('dir', 'rtl');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
  }
}

/**
 * Add ARIA labels and descriptions to form elements
 * @param {HTMLElement} container - Container with form elements
 */
export function enhanceFormAccessibility(container) {
  if (!container) return;

  // Add ARIA labels to inputs that don't have proper labels
  const inputs = container.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    const label = container.querySelector(`label[for="${input.id}"]`);
    const ariaLabel = input.getAttribute('aria-label');
    
    if (!label && !ariaLabel) {
      // Try to find a nearby label or use placeholder
      const placeholder = input.getAttribute('placeholder');
      if (placeholder) {
        input.setAttribute('aria-label', placeholder);
      }
    }

    // Add aria-describedby for error messages
    const errorElement = container.querySelector(`#${input.id}-error, #${input.name}-error`);
    if (errorElement) {
      input.setAttribute('aria-describedby', errorElement.id);
      errorElement.setAttribute('role', 'alert');
      errorElement.setAttribute('aria-live', 'polite');
    }

    // Add aria-invalid for validation states
    if (input.classList.contains('is-invalid')) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.setAttribute('aria-invalid', 'false');
    }
  });

  // Enhance sliders with proper ARIA attributes
  const sliders = container.querySelectorAll('input[type="range"]');
  sliders.forEach(slider => {
    if (!slider.getAttribute('aria-label') && !slider.getAttribute('aria-labelledby')) {
      const associatedInput = container.querySelector(`#${slider.id.replace('-slider', '')}`);
      if (associatedInput) {
        const label = container.querySelector(`label[for="${associatedInput.id}"]`);
        if (label) {
          slider.setAttribute('aria-label', `${label.textContent.trim()} slider`);
        }
      }
    }
    
    // Add value text for screen readers
    slider.setAttribute('aria-valuetext', `${slider.value} ${slider.getAttribute('aria-label') || ''}`);
  });
}

/**
 * Add ARIA attributes to loading states
 * @param {HTMLElement} element - Element with loading state
 * @param {string} loadingText - Text to announce during loading
 */
export function enhanceLoadingAccessibility(element, loadingText = 'Loading') {
  if (!element) return;

  element.setAttribute('aria-busy', 'true');
  element.setAttribute('aria-live', 'polite');
  element.setAttribute('aria-label', loadingText);
  
  // Add role if not present
  if (!element.getAttribute('role')) {
    element.setAttribute('role', 'status');
  }
}

/**
 * Remove loading accessibility attributes
 * @param {HTMLElement} element - Element to clean up
 */
export function removeLoadingAccessibility(element) {
  if (!element) return;

  element.removeAttribute('aria-busy');
  element.removeAttribute('aria-live');
  element.removeAttribute('aria-label');
  
  // Only remove role if it was 'status'
  if (element.getAttribute('role') === 'status') {
    element.removeAttribute('role');
  }
}

/**
 * Add ARIA attributes to tables for better screen reader support
 * @param {HTMLElement} table - Table element
 * @param {string} caption - Table caption
 */
export function enhanceTableAccessibility(table, caption = '') {
  if (!table) return;

  // Add table role if not present
  if (!table.getAttribute('role')) {
    table.setAttribute('role', 'table');
  }

  // Add caption if provided
  if (caption && !table.querySelector('caption')) {
    const captionElement = document.createElement('caption');
    captionElement.textContent = caption;
    captionElement.classList.add('sr-only');
    table.insertBefore(captionElement, table.firstChild);
  }

  // Enhance headers
  const headers = table.querySelectorAll('th');
  headers.forEach((header, index) => {
    if (!header.getAttribute('scope')) {
      // Determine scope based on position
      const row = header.closest('tr');
      const isFirstRow = row === table.querySelector('tr');
      header.setAttribute('scope', isFirstRow ? 'col' : 'row');
    }
    
    if (!header.id) {
      header.id = `table-header-${index}`;
    }
  });

  // Add aria-describedby to data cells
  const cells = table.querySelectorAll('td');
  cells.forEach(cell => {
    const row = cell.closest('tr');
    const cellIndex = Array.from(row.children).indexOf(cell);
    const header = table.querySelector(`th:nth-child(${cellIndex + 1})`);
    
    if (header && header.id) {
      const existingDescribedBy = cell.getAttribute('aria-describedby');
      const newDescribedBy = existingDescribedBy ? `${existingDescribedBy} ${header.id}` : header.id;
      cell.setAttribute('aria-describedby', newDescribedBy);
    }
  });
}

/**
 * Test color contrast ratio
 * @param {string} foreground - Foreground color (hex, rgb, or hsl)
 * @param {string} background - Background color (hex, rgb, or hsl)
 * @returns {Object} Contrast ratio and WCAG compliance info
 */
export function testColorContrast(foreground, background) {
  // Convert colors to RGB
  const fgRgb = hexToRgb(foreground) || parseRgb(foreground);
  const bgRgb = hexToRgb(background) || parseRgb(background);
  
  if (!fgRgb || !bgRgb) {
    return { error: 'Invalid color format' };
  }
  
  // Calculate relative luminance
  const fgLuminance = getRelativeLuminance(fgRgb);
  const bgLuminance = getRelativeLuminance(bgRgb);
  
  // Calculate contrast ratio
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7,
    wcagAALarge: ratio >= 3,
    wcagAAALarge: ratio >= 4.5
  };
}

// Helper functions for color contrast testing
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function parseRgb(rgb) {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return match ? {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3])
  } : null;
}

function getRelativeLuminance(rgb) {
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export default {
  setFocus,
  addKeyboardNavigation,
  announceToScreenReader,
  announceLoadingState,
  announceValidationError,
  setInternationalizedText,
  updateDocumentLanguage,
  enhanceFormAccessibility,
  enhanceLoadingAccessibility,
  removeLoadingAccessibility,
  enhanceTableAccessibility,
  testColorContrast,
};
