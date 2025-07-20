/**
 * Keyboard Navigation Tests
 * Tests for keyboard navigation functionality
 * Implements requirements 5.2, 5.4
 */

import keyboardNavigationManager from '../src/js/utils/keyboard-navigation.js';

describe('Keyboard Navigation', () => {
  let container;
  
  beforeEach(() => {
    // Create test container
    container = document.createElement('div');
    container.innerHTML = `
      <div id="test-container">
        <button id="button1">Button 1</button>
        <input id="input1" type="text" placeholder="Input 1">
        <select id="select1">
          <option>Option 1</option>
          <option>Option 2</option>
        </select>
        <a href="#" id="link1">Link 1</a>
        <div tabindex="0" id="div1">Focusable Div</div>
        
        <table id="test-table">
          <thead>
            <tr>
              <th tabindex="0">Header 1</th>
              <th tabindex="0">Header 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td tabindex="0">Cell 1</td>
              <td tabindex="0">Cell 2</td>
            </tr>
            <tr>
              <td tabindex="0">Cell 3</td>
              <td tabindex="0">Cell 4</td>
            </tr>
          </tbody>
        </table>
        
        <form id="test-form">
          <div class="form-group">
            <input type="number" id="amount" name="amount">
            <input type="range" id="amount-slider" class="form-slider" min="0" max="1000">
          </div>
          <button type="submit" id="submit-btn">Submit</button>
        </form>
      </div>
    `;
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Focus Management', () => {
    test('should identify all focusable elements', () => {
      const focusableElements = keyboardNavigationManager.getFocusableElements();
      
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // Check that all expected elements are found
      const expectedIds = ['button1', 'input1', 'select1', 'link1', 'div1', 'amount', 'amount-slider', 'submit-btn'];
      const foundIds = focusableElements.map(el => el.id).filter(id => expectedIds.includes(id));
      
      expect(foundIds.length).toBe(expectedIds.length);
    });

    test('should correctly identify focusable elements', () => {
      const button = document.getElementById('button1');
      const input = document.getElementById('input1');
      const hiddenDiv = document.createElement('div');
      hiddenDiv.style.display = 'none';
      hiddenDiv.tabIndex = 0;
      
      expect(keyboardNavigationManager.isElementFocusable(button)).toBe(true);
      expect(keyboardNavigationManager.isElementFocusable(input)).toBe(true);
      expect(keyboardNavigationManager.isElementFocusable(hiddenDiv)).toBe(false);
    });

    test('should handle disabled elements correctly', () => {
      const button = document.getElementById('button1');
      button.disabled = true;
      
      expect(keyboardNavigationManager.isElementFocusable(button)).toBe(false);
      
      button.disabled = false;
      expect(keyboardNavigationManager.isElementFocusable(button)).toBe(true);
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('should register keyboard shortcuts', () => {
      const handler = jest.fn();
      
      keyboardNavigationManager.registerShortcut('ctrl+t', {
        description: 'Test shortcut',
        handler: handler
      });
      
      // Simulate keyboard event
      const event = new KeyboardEvent('keydown', {
        key: 't',
        ctrlKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      expect(handler).toHaveBeenCalled();
    });

    test('should generate correct shortcut keys', () => {
      const event1 = { key: 'enter', ctrlKey: true, altKey: false, shiftKey: false, metaKey: false };
      const event2 = { key: 'f1', ctrlKey: false, altKey: true, shiftKey: true, metaKey: false };
      
      expect(keyboardNavigationManager.getShortcutKey(event1)).toBe('ctrl+enter');
      expect(keyboardNavigationManager.getShortcutKey(event2)).toBe('alt+shift+f1');
    });
  });

  describe('Table Navigation', () => {
    test('should handle arrow key navigation in tables', () => {
      const table = document.getElementById('test-table');
      const firstCell = table.querySelector('td');
      firstCell.focus();
      
      // Test right arrow
      const rightArrowEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true
      });
      
      firstCell.dispatchEvent(rightArrowEvent);
      
      // Should move focus to next cell
      expect(document.activeElement).toBe(table.querySelectorAll('td')[1]);
    });

    test('should handle up/down arrow navigation in tables', () => {
      const table = document.getElementById('test-table');
      const cells = table.querySelectorAll('td');
      const firstRowFirstCell = cells[0];
      const secondRowFirstCell = cells[2];
      
      firstRowFirstCell.focus();
      
      // Test down arrow
      const downArrowEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true
      });
      
      firstRowFirstCell.dispatchEvent(downArrowEvent);
      
      // Should move focus to cell below
      expect(document.activeElement).toBe(secondRowFirstCell);
    });
  });

  describe('Form Navigation', () => {
    test('should sync slider and input values', async () => {
      const input = document.getElementById('amount');
      const slider = document.getElementById('amount-slider');
      
      slider.focus();
      slider.value = '500';
      
      // Simulate arrow key on slider
      const arrowEvent = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true
      });
      
      slider.dispatchEvent(arrowEvent);
      
      // Wait for sync
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(input.value).toBe('500');
    });
  });

  describe('Focus Trapping', () => {
    test('should trap focus within a container', () => {
      const modal = document.createElement('div');
      modal.innerHTML = `
        <button id="first-btn">First</button>
        <button id="last-btn">Last</button>
      `;
      document.body.appendChild(modal);
      
      keyboardNavigationManager.trapFocus(modal);
      
      const firstBtn = modal.querySelector('#first-btn');
      const lastBtn = modal.querySelector('#last-btn');
      
      lastBtn.focus();
      
      // Simulate tab key
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });
      
      lastBtn.dispatchEvent(tabEvent);
      
      // Should wrap to first button
      expect(document.activeElement).toBe(firstBtn);
      
      keyboardNavigationManager.removeFocusTrap(modal);
      document.body.removeChild(modal);
    });
  });

  describe('Escape Key Handling', () => {
    test('should handle escape key to close modals', () => {
      const modal = document.createElement('div');
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-hidden', 'false');
      modal.innerHTML = '<button class="modal-close">Close</button>';
      document.body.appendChild(modal);
      
      const closeBtn = modal.querySelector('.modal-close');
      const closeSpy = jest.fn();
      closeBtn.addEventListener('click', closeSpy);
      
      // Simulate escape key
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });
      
      document.dispatchEvent(escapeEvent);
      
      expect(closeSpy).toHaveBeenCalled();
      
      document.body.removeChild(modal);
    });
  });

  describe('Testing Mode', () => {
    test('should start and stop testing mode', () => {
      keyboardNavigationManager.startTesting();
      expect(keyboardNavigationManager.isTestMode).toBe(true);
      
      // Simulate some focus events
      const button = document.getElementById('button1');
      button.focus();
      
      const results = keyboardNavigationManager.stopTesting();
      
      expect(keyboardNavigationManager.isTestMode).toBe(false);
      expect(results.tabOrder.length).toBeGreaterThan(0);
      expect(results.totalElements).toBeGreaterThan(0);
    });

    test('should analyze tab order for issues', () => {
      const testResults = [
        {
          tagName: 'BUTTON',
          id: 'btn1',
          textContent: 'Button 1',
          ariaLabel: null
        },
        {
          tagName: 'INPUT',
          id: '',
          textContent: '',
          ariaLabel: null
        }
      ];
      
      const issues = keyboardNavigationManager.analyzeTabOrder(testResults);
      
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(issue => issue.includes('lacks proper labeling'))).toBe(true);
    });
  });

  describe('Comprehensive Testing', () => {
    test('should test all keyboard functionality', async () => {
      const results = await keyboardNavigationManager.testAllKeyboardFunctionality();
      
      expect(results).toHaveProperty('focusableElements');
      expect(results).toHaveProperty('shortcuts');
      expect(results).toHaveProperty('navigation');
      expect(results).toHaveProperty('issues');
      
      expect(Array.isArray(results.focusableElements)).toBe(true);
      expect(Array.isArray(results.shortcuts)).toBe(true);
      expect(Array.isArray(results.navigation)).toBe(true);
      expect(Array.isArray(results.issues)).toBe(true);
    });
  });

  describe('Focus Indicators', () => {
    test('should enhance focus indicators', () => {
      // Check if keyboard navigation class is added on keydown
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });
      
      document.dispatchEvent(keydownEvent);
      
      expect(document.body.classList.contains('keyboard-navigation')).toBe(true);
    });

    test('should remove keyboard navigation class on mousedown', () => {
      document.body.classList.add('keyboard-navigation');
      
      const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true
      });
      
      document.dispatchEvent(mousedownEvent);
      
      expect(document.body.classList.contains('keyboard-navigation')).toBe(false);
    });
  });

  describe('Skip Links', () => {
    test('should add skip to content link', () => {
      // Remove any existing skip links
      const existingSkipLinks = document.querySelectorAll('.skip-to-content');
      existingSkipLinks.forEach(link => link.remove());
      
      // Re-initialize to add skip link
      keyboardNavigationManager.addSkipToContentLink();
      
      const skipLink = document.querySelector('.skip-to-content');
      expect(skipLink).toBeTruthy();
      expect(skipLink.textContent).toBe('Skip to main content');
      expect(skipLink.href).toContain('#main-content');
    });
  });
});

// Integration tests
describe('Keyboard Navigation Integration', () => {
  test('should work with calculator form', () => {
    // This would test integration with the actual calculator form
    // For now, we'll just verify the manager is properly initialized
    expect(keyboardNavigationManager).toBeDefined();
    expect(typeof keyboardNavigationManager.getFocusableElements).toBe('function');
    expect(typeof keyboardNavigationManager.registerShortcut).toBe('function');
  });

  test('should work with amortization table', () => {
    // Create a mock table structure
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th tabindex="0" class="sortable">Payment #</th>
          <th tabindex="0" class="sortable">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td tabindex="0">1</td>
          <td tabindex="0">$1,000</td>
        </tr>
      </tbody>
    `;
    document.body.appendChild(table);
    
    const focusableElements = keyboardNavigationManager.getFocusableElements();
    const tableElements = focusableElements.filter(el => el.closest('table'));
    
    expect(tableElements.length).toBeGreaterThan(0);
    
    document.body.removeChild(table);
  });
});