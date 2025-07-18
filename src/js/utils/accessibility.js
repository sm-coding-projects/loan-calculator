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
 */
export function announceToScreenReader(message, ariaLive = 'polite') {
  // Create or get the announcement element
  let announcer = document.getElementById('screen-reader-announcer');

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'screen-reader-announcer';
    announcer.setAttribute('aria-live', ariaLive);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.classList.add('sr-only');
    document.body.appendChild(announcer);
  }

  // Set the message
  announcer.textContent = '';

  // Force a DOM reflow
  void announcer.offsetWidth;

  // Set the message
  announcer.textContent = message;
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

export default {
  setFocus,
  addKeyboardNavigation,
  announceToScreenReader,
  setInternationalizedText,
  updateDocumentLanguage,
};
