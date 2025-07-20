/**
 * Keyboard Navigation Utility
 * Provides comprehensive keyboard navigation testing and enhancement
 * Implements requirements 5.2, 5.4
 */

import { announceToScreenReader } from './accessibility.js';

class KeyboardNavigationManager {
  constructor() {
    this.focusableElements = [];
    this.currentFocusIndex = -1;
    this.keyboardShortcuts = new Map();
    this.focusTraps = new Map();
    this.isTestMode = false;
    this.testResults = [];
    
    this.init();
  }

  /**
   * Initialize keyboard navigation manager
   */
  init() {
    this.setupGlobalKeyboardHandlers();
    this.setupFocusManagement();
    this.registerDefaultShortcuts();
    this.enhanceFocusIndicators();
  }

  /**
   * Setup global keyboard event handlers
   */
  setupGlobalKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
      this.handleGlobalKeydown(e);
    });

    // Track focus changes for testing
    document.addEventListener('focusin', (e) => {
      this.onFocusChange(e.target);
    });

    // Handle escape key globally
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleEscapeKey(e);
      }
    });
  }

  /**
   * Handle global keydown events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleGlobalKeydown(e) {
    // Handle keyboard shortcuts
    const shortcutKey = this.getShortcutKey(e);
    if (this.keyboardShortcuts.has(shortcutKey)) {
      const shortcut = this.keyboardShortcuts.get(shortcutKey);
      if (shortcut.handler) {
        e.preventDefault();
        shortcut.handler(e);
        announceToScreenReader(`Activated ${shortcut.description}`);
      }
    }

    // Handle tab navigation enhancements
    if (e.key === 'Tab') {
      this.handleTabNavigation(e);
    }

    // Handle arrow key navigation in specific contexts
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      this.handleArrowNavigation(e);
    }
  }

  /**
   * Handle tab navigation with enhancements
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleTabNavigation(e) {
    const activeElement = document.activeElement;
    
    // Check if we're in a focus trap
    for (const [container, trap] of this.focusTraps) {
      if (container.contains(activeElement)) {
        this.handleFocusTrapNavigation(e, container, trap);
        return;
      }
    }

    // Skip hidden or disabled elements
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(activeElement);
    
    if (currentIndex !== -1) {
      let nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
      
      // Find next valid focusable element
      while (nextIndex >= 0 && nextIndex < focusableElements.length) {
        const nextElement = focusableElements[nextIndex];
        if (this.isElementFocusable(nextElement)) {
          break;
        }
        nextIndex = e.shiftKey ? nextIndex - 1 : nextIndex + 1;
      }
    }
  }

  /**
   * Handle arrow key navigation in specific contexts
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleArrowNavigation(e) {
    const activeElement = document.activeElement;
    
    // Handle table navigation
    if (activeElement.closest('table')) {
      this.handleTableArrowNavigation(e, activeElement);
    }
    
    // Handle form group navigation
    if (activeElement.closest('.form-group')) {
      this.handleFormGroupArrowNavigation(e, activeElement);
    }
    
    // Handle slider navigation
    if (activeElement.type === 'range') {
      // Let default behavior handle slider navigation
      return;
    }
  }

  /**
   * Handle table arrow key navigation
   * @param {KeyboardEvent} e - Keyboard event
   * @param {HTMLElement} activeElement - Currently focused element
   */
  handleTableArrowNavigation(e, activeElement) {
    const table = activeElement.closest('table');
    if (!table) return;

    const cells = Array.from(table.querySelectorAll('th, td'));
    const currentIndex = cells.indexOf(activeElement);
    if (currentIndex === -1) return;

    const rows = Array.from(table.querySelectorAll('tr'));
    const currentRow = activeElement.closest('tr');
    const currentRowIndex = rows.indexOf(currentRow);
    const cellsInRow = Array.from(currentRow.querySelectorAll('th, td'));
    const cellIndexInRow = cellsInRow.indexOf(activeElement);

    let targetElement = null;

    switch (e.key) {
      case 'ArrowUp':
        if (currentRowIndex > 0) {
          const targetRow = rows[currentRowIndex - 1];
          const targetCells = Array.from(targetRow.querySelectorAll('th, td'));
          targetElement = targetCells[Math.min(cellIndexInRow, targetCells.length - 1)];
        }
        break;
      
      case 'ArrowDown':
        if (currentRowIndex < rows.length - 1) {
          const targetRow = rows[currentRowIndex + 1];
          const targetCells = Array.from(targetRow.querySelectorAll('th, td'));
          targetElement = targetCells[Math.min(cellIndexInRow, targetCells.length - 1)];
        }
        break;
      
      case 'ArrowLeft':
        if (cellIndexInRow > 0) {
          targetElement = cellsInRow[cellIndexInRow - 1];
        }
        break;
      
      case 'ArrowRight':
        if (cellIndexInRow < cellsInRow.length - 1) {
          targetElement = cellsInRow[cellIndexInRow + 1];
        }
        break;
    }

    if (targetElement) {
      e.preventDefault();
      targetElement.focus();
      announceToScreenReader(`Moved to ${targetElement.textContent || 'cell'}`);
    }
  }

  /**
   * Handle form group arrow navigation
   * @param {KeyboardEvent} e - Keyboard event
   * @param {HTMLElement} activeElement - Currently focused element
   */
  handleFormGroupArrowNavigation(e, activeElement) {
    const formGroup = activeElement.closest('.form-group');
    if (!formGroup) return;

    // Handle slider and input synchronization
    if (activeElement.type === 'range' || activeElement.classList.contains('form-slider')) {
      const input = formGroup.querySelector('input:not([type="range"])');
      if (input && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        // Allow default slider behavior, but sync with input
        setTimeout(() => {
          input.value = activeElement.value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }, 0);
      }
    }
  }

  /**
   * Handle escape key functionality
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleEscapeKey(e) {
    // Close any open modals or dropdowns
    const openModals = document.querySelectorAll('[role="dialog"][aria-hidden="false"]');
    const openDropdowns = document.querySelectorAll('[aria-expanded="true"]');
    
    if (openModals.length > 0) {
      const modal = openModals[openModals.length - 1]; // Close topmost modal
      const closeButton = modal.querySelector('[data-dismiss="modal"], .modal-close');
      if (closeButton) {
        closeButton.click();
      }
      e.preventDefault();
      return;
    }
    
    if (openDropdowns.length > 0) {
      openDropdowns.forEach(dropdown => {
        dropdown.setAttribute('aria-expanded', 'false');
      });
      e.preventDefault();
      return;
    }
    
    // Clear any active states
    const activeElements = document.querySelectorAll('.active, .selected');
    if (activeElements.length > 0) {
      activeElements.forEach(el => {
        el.classList.remove('active', 'selected');
      });
      e.preventDefault();
    }
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Add skip to content link
    this.addSkipToContentLink();
    
    // Enhance focus indicators
    this.enhanceFocusIndicators();
    
    // Setup focus restoration
    this.setupFocusRestoration();
  }

  /**
   * Add skip to content link
   */
  addSkipToContentLink() {
    const existingSkipLink = document.querySelector('.skip-to-content');
    if (existingSkipLink) return;

    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-to-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.setAttribute('aria-label', 'Skip to main content');
    
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const mainContent = document.querySelector('#main-content, main, [role="main"]');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView();
        announceToScreenReader('Skipped to main content');
      }
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Enhance focus indicators
   */
  enhanceFocusIndicators() {
    // Add focus-visible polyfill behavior
    document.addEventListener('keydown', () => {
      document.body.classList.add('keyboard-navigation');
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });

    // Add enhanced focus styles
    const style = document.createElement('style');
    style.textContent = `
      /* Enhanced keyboard navigation focus indicators */
      .keyboard-navigation *:focus {
        outline: 2px solid var(--primary-600, #2563eb) !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.25) !important;
        border-radius: 4px;
      }
      
      /* Special focus for interactive elements */
      .keyboard-navigation button:focus,
      .keyboard-navigation .form-button:focus,
      .keyboard-navigation input:focus,
      .keyboard-navigation select:focus,
      .keyboard-navigation textarea:focus {
        outline: 2px solid var(--primary-600, #2563eb) !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.25) !important;
      }
      
      /* Focus for table elements */
      .keyboard-navigation th:focus,
      .keyboard-navigation td:focus {
        outline: 2px solid var(--primary-600, #2563eb) !important;
        outline-offset: -2px !important;
        background-color: rgba(37, 99, 235, 0.1) !important;
      }
      
      /* Focus for custom elements */
      .keyboard-navigation .sortable:focus,
      .keyboard-navigation .pagination-item:focus,
      .keyboard-navigation .term-preset:focus {
        outline: 2px solid var(--primary-600, #2563eb) !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.25) !important;
      }
      
      /* Focus for sliders */
      .keyboard-navigation .form-slider:focus {
        outline: 2px solid var(--primary-600, #2563eb) !important;
        outline-offset: 2px !important;
      }
      
      /* Focus for info icons */
      .keyboard-navigation .info-icon:focus {
        outline: 2px solid var(--primary-600, #2563eb) !important;
        outline-offset: 2px !important;
        border-radius: 50% !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup focus restoration
   */
  setupFocusRestoration() {
    // Store focus before page changes
    window.addEventListener('beforeunload', () => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.id) {
        sessionStorage.setItem('lastFocusedElement', activeElement.id);
      }
    });

    // Restore focus on page load
    window.addEventListener('load', () => {
      const lastFocusedId = sessionStorage.getItem('lastFocusedElement');
      if (lastFocusedId) {
        const element = document.getElementById(lastFocusedId);
        if (element && this.isElementFocusable(element)) {
          setTimeout(() => {
            element.focus();
          }, 100);
        }
        sessionStorage.removeItem('lastFocusedElement');
      }
    });
  }

  /**
   * Register default keyboard shortcuts
   */
  registerDefaultShortcuts() {
    // Calculator shortcuts
    this.registerShortcut('ctrl+enter', {
      description: 'Calculate loan',
      handler: () => {
        const calculateButton = document.querySelector('#calculate-button');
        if (calculateButton && !calculateButton.disabled) {
          calculateButton.click();
        }
      }
    });

    this.registerShortcut('ctrl+r', {
      description: 'Reset form',
      handler: (e) => {
        e.preventDefault();
        const resetButton = document.querySelector('#reset-button');
        if (resetButton) {
          resetButton.click();
        }
      }
    });

    // Navigation shortcuts
    this.registerShortcut('alt+1', {
      description: 'Go to calculator form',
      handler: () => {
        const form = document.querySelector('#calculator-form-container');
        if (form) {
          const firstInput = form.querySelector('input, select, button');
          if (firstInput) {
            firstInput.focus();
          }
        }
      }
    });

    this.registerShortcut('alt+2', {
      description: 'Go to results',
      handler: () => {
        const results = document.querySelector('#results-display-container');
        if (results) {
          results.focus();
        }
      }
    });

    this.registerShortcut('alt+3', {
      description: 'Go to amortization table',
      handler: () => {
        const table = document.querySelector('#amortization-table-container table');
        if (table) {
          const firstCell = table.querySelector('th, td');
          if (firstCell) {
            firstCell.focus();
          }
        }
      }
    });

    // Help shortcut
    this.registerShortcut('f1', {
      description: 'Show keyboard shortcuts help',
      handler: (e) => {
        e.preventDefault();
        this.showKeyboardShortcutsHelp();
      }
    });
  }

  /**
   * Register a keyboard shortcut
   * @param {string} keys - Key combination (e.g., 'ctrl+enter')
   * @param {Object} shortcut - Shortcut configuration
   */
  registerShortcut(keys, shortcut) {
    this.keyboardShortcuts.set(keys, shortcut);
  }

  /**
   * Get shortcut key from keyboard event
   * @param {KeyboardEvent} e - Keyboard event
   * @returns {string} Shortcut key string
   */
  getShortcutKey(e) {
    const parts = [];
    
    if (e.ctrlKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    if (e.metaKey) parts.push('meta');
    
    parts.push(e.key.toLowerCase());
    
    return parts.join('+');
  }

  /**
   * Show keyboard shortcuts help
   */
  showKeyboardShortcutsHelp() {
    const helpContent = Array.from(this.keyboardShortcuts.entries())
      .map(([keys, shortcut]) => `${keys.toUpperCase()}: ${shortcut.description}`)
      .join('\n');
    
    const helpText = `Keyboard Shortcuts:\n\n${helpContent}\n\nPress Escape to close this help.`;
    
    // Create help modal
    const modal = document.createElement('div');
    modal.className = 'keyboard-help-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'keyboard-help-title');
    modal.setAttribute('aria-modal', 'true');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 8px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    `;

    content.innerHTML = `
      <h2 id="keyboard-help-title">Keyboard Shortcuts</h2>
      <pre style="white-space: pre-wrap; font-family: monospace; line-height: 1.5;">${helpContent}</pre>
      <button class="close-help" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">Close (Escape)</button>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Focus the close button
    const closeButton = content.querySelector('.close-help');
    closeButton.focus();

    // Handle close
    const closeModal = () => {
      document.body.removeChild(modal);
      announceToScreenReader('Keyboard shortcuts help closed');
    };

    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    });

    // Trap focus in modal
    this.trapFocus(modal);
    
    announceToScreenReader('Keyboard shortcuts help opened');
  }

  /**
   * Handle focus trap navigation
   * @param {KeyboardEvent} e - Keyboard event
   * @param {HTMLElement} container - Container element
   * @param {Object} trap - Trap configuration
   */
  handleFocusTrapNavigation(e, container, trap) {
    if (e.key !== 'Tab') return;

    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Trap focus within a container
   * @param {HTMLElement} container - Container to trap focus in
   */
  trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const trapHandler = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', trapHandler);
    this.focusTraps.set(container, { handler: trapHandler, focusableElements });
  }

  /**
   * Remove focus trap
   * @param {HTMLElement} container - Container to remove trap from
   */
  removeFocusTrap(container) {
    const trap = this.focusTraps.get(container);
    if (trap) {
      container.removeEventListener('keydown', trap.handler);
      this.focusTraps.delete(container);
    }
  }

  /**
   * Get all focusable elements in the document
   * @returns {Array<HTMLElement>} Array of focusable elements
   */
  getFocusableElements() {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]:not([disabled])',
      '[role="menuitem"]:not([disabled])',
      '[role="tab"]:not([disabled])'
    ].join(', ');

    return Array.from(document.querySelectorAll(selector))
      .filter(el => this.isElementFocusable(el));
  }

  /**
   * Check if an element is focusable
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if element is focusable
   */
  isElementFocusable(element) {
    if (!element || element.disabled) return false;
    
    // Check if element is in the document
    if (!document.contains(element)) return false;
    
    // Check if element is visible
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    
    // Check if element has zero dimensions (but allow elements with overflow hidden)
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0 && style.overflow !== 'hidden') return false;
    
    // Check if element is hidden by parent
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      const parentStyle = window.getComputedStyle(parent);
      if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') return false;
      parent = parent.parentElement;
    }
    
    return true;
  }

  /**
   * Handle focus change for testing
   * @param {HTMLElement} element - Newly focused element
   */
  onFocusChange(element) {
    if (this.isTestMode) {
      this.testResults.push({
        timestamp: Date.now(),
        element: element,
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        textContent: element.textContent?.substring(0, 50),
        tabIndex: element.tabIndex,
        role: element.getAttribute('role'),
        ariaLabel: element.getAttribute('aria-label')
      });
    }
  }

  /**
   * Start keyboard navigation testing
   */
  startTesting() {
    this.isTestMode = true;
    this.testResults = [];
    announceToScreenReader('Keyboard navigation testing started. Use Tab to navigate through all elements.');
    
    console.log('🎯 Keyboard Navigation Testing Started');
    console.log('Use Tab/Shift+Tab to navigate through all focusable elements');
    console.log('Press Ctrl+Shift+T to stop testing and view results');
    
    // Add test stop shortcut
    this.registerShortcut('ctrl+shift+t', {
      description: 'Stop keyboard navigation testing',
      handler: () => this.stopTesting()
    });
  }

  /**
   * Stop keyboard navigation testing and show results
   */
  stopTesting() {
    this.isTestMode = false;
    
    console.log('🎯 Keyboard Navigation Test Results:');
    console.log(`Total focus events: ${this.testResults.length}`);
    
    // Analyze tab order
    const tabOrder = this.testResults.map((result, index) => ({
      order: index + 1,
      element: `${result.tagName}${result.id ? '#' + result.id : ''}${result.className ? '.' + result.className.split(' ')[0] : ''}`,
      text: result.textContent,
      tabIndex: result.tabIndex,
      role: result.role,
      ariaLabel: result.ariaLabel
    }));
    
    console.table(tabOrder);
    
    // Check for issues
    const issues = this.analyzeTabOrder(this.testResults);
    if (issues.length > 0) {
      console.warn('🚨 Keyboard Navigation Issues Found:');
      issues.forEach(issue => console.warn(`- ${issue}`));
    } else {
      console.log('✅ No keyboard navigation issues detected');
    }
    
    announceToScreenReader(`Keyboard navigation testing completed. ${issues.length} issues found.`);
    
    // Remove test shortcut
    this.keyboardShortcuts.delete('ctrl+shift+t');
    
    return {
      tabOrder,
      issues,
      totalElements: this.testResults.length
    };
  }

  /**
   * Analyze tab order for issues
   * @param {Array} testResults - Test results array
   * @returns {Array<string>} Array of issues found
   */
  analyzeTabOrder(testResults) {
    const issues = [];
    
    // Check for elements without proper labels
    testResults.forEach((result, index) => {
      if (['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(result.tagName)) {
        if (!result.ariaLabel && !result.textContent && !result.id) {
          issues.push(`Element ${index + 1} (${result.tagName}) lacks proper labeling`);
        }
      }
    });
    
    // Check for skip links
    const hasSkipLink = testResults.some(result => 
      result.className?.includes('skip-to-content') || 
      result.textContent?.toLowerCase().includes('skip')
    );
    
    if (!hasSkipLink) {
      issues.push('No skip to content link found');
    }
    
    // Check for logical tab order
    const formElements = testResults.filter(result => 
      ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(result.tagName)
    );
    
    if (formElements.length > 0) {
      // Check if form elements are grouped logically
      let lastFormIndex = -1;
      let formGroupBreaks = 0;
      
      testResults.forEach((result, index) => {
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(result.tagName)) {
          if (lastFormIndex !== -1 && index - lastFormIndex > 3) {
            formGroupBreaks++;
          }
          lastFormIndex = index;
        }
      });
      
      if (formGroupBreaks > 2) {
        issues.push('Form elements may not be grouped logically in tab order');
      }
    }
    
    return issues;
  }

  /**
   * Test all keyboard functionality
   * @returns {Promise<Object>} Test results
   */
  async testAllKeyboardFunctionality() {
    console.log('🧪 Starting comprehensive keyboard functionality test...');
    
    const testResults = {
      focusableElements: [],
      shortcuts: [],
      navigation: [],
      issues: []
    };
    
    // Test 1: Find all focusable elements
    const focusableElements = this.getFocusableElements();
    testResults.focusableElements = focusableElements.map(el => ({
      tagName: el.tagName,
      id: el.id,
      className: el.className,
      tabIndex: el.tabIndex,
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label'),
      isVisible: this.isElementFocusable(el)
    }));
    
    console.log(`Found ${focusableElements.length} focusable elements`);
    
    // Test 2: Test keyboard shortcuts
    for (const [keys, shortcut] of this.keyboardShortcuts) {
      testResults.shortcuts.push({
        keys,
        description: shortcut.description,
        hasHandler: typeof shortcut.handler === 'function'
      });
    }
    
    console.log(`Found ${testResults.shortcuts.length} keyboard shortcuts`);
    
    // Test 3: Test navigation patterns
    const tables = document.querySelectorAll('table');
    const forms = document.querySelectorAll('form');
    
    testResults.navigation.push({
      type: 'tables',
      count: tables.length,
      hasArrowNavigation: tables.length > 0
    });
    
    testResults.navigation.push({
      type: 'forms',
      count: forms.length,
      hasTabNavigation: forms.length > 0
    });
    
    // Test 4: Check for common issues
    
    // Check focus indicators
    const elementsWithoutFocusStyles = focusableElements.filter(el => {
      const styles = window.getComputedStyle(el, ':focus');
      return styles.outline === 'none' && !styles.boxShadow;
    });
    
    if (elementsWithoutFocusStyles.length > 0) {
      testResults.issues.push(`${elementsWithoutFocusStyles.length} elements may lack proper focus indicators`);
    }
    
    // Check for skip links
    const skipLinks = document.querySelectorAll('.skip-to-content, [href="#main-content"]');
    if (skipLinks.length === 0) {
      testResults.issues.push('No skip to content links found');
    }
    
    // Check for proper headings structure
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    if (headings.length === 0) {
      testResults.issues.push('No heading structure found');
    }
    
    console.log('🧪 Keyboard functionality test completed');
    console.table(testResults.focusableElements);
    
    if (testResults.issues.length > 0) {
      console.warn('🚨 Issues found:');
      testResults.issues.forEach(issue => console.warn(`- ${issue}`));
    } else {
      console.log('✅ No major keyboard navigation issues detected');
    }
    
    return testResults;
  }
}

// Create global instance
const keyboardNavigationManager = new KeyboardNavigationManager();

// Export for use in other modules
export default keyboardNavigationManager;

// Export individual functions for direct use
export {
  KeyboardNavigationManager
};