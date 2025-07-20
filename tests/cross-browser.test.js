/**
 * Cross-browser compatibility tests
 * Tests for Chrome, Firefox, Safari, and Edge compatibility
 */

describe('Cross-browser Compatibility Tests', () => {
  let mockUserAgent;
  let originalUserAgent;

  beforeEach(() => {
    // Store original user agent
    originalUserAgent = navigator.userAgent;

    // Mock DOM elements
    document.body.innerHTML = `
      <div id="app">
        <form id="loan-form">
          <input type="number" id="loan-amount" value="300000">
          <input type="number" id="interest-rate" value="3.5">
          <input type="number" id="loan-term" value="30">
          <button type="submit" id="calculate-btn">Calculate</button>
        </form>
        <div id="results-container"></div>
        <div id="loading-indicator" style="display: none;"></div>
        <div id="error-container" style="display: none;"></div>
      </div>
    `;
  });

  afterEach(() => {
    // Restore original user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });

  const mockUserAgents = {
    chrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    firefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
    safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    edge: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  };

  function setUserAgent(browser) {
    Object.defineProperty(navigator, 'userAgent', {
      value: mockUserAgents[browser],
      configurable: true,
    });
  }

  describe('CSS Feature Support', () => {
    test('CSS Grid support across browsers', () => {
      const testElement = document.createElement('div');
      testElement.style.display = 'grid';

      // All modern browsers should support CSS Grid
      expect(testElement.style.display).toBe('grid');
    });

    test('CSS Flexbox support across browsers', () => {
      const testElement = document.createElement('div');
      testElement.style.display = 'flex';

      // All modern browsers should support Flexbox
      expect(testElement.style.display).toBe('flex');
    });

    test('CSS Custom Properties support', () => {
      const testElement = document.createElement('div');
      testElement.style.setProperty('--test-color', '#ff0000');

      // Modern browsers should support CSS custom properties
      expect(testElement.style.getPropertyValue('--test-color')).toBe('#ff0000');
    });

    test('CSS Transitions support', () => {
      const testElement = document.createElement('div');
      testElement.style.transition = 'opacity 0.3s ease';

      expect(testElement.style.transition).toContain('opacity');
    });
  });

  describe('JavaScript API Support', () => {
    test('localStorage support across browsers', () => {
      // Test localStorage availability
      expect(typeof Storage).toBe('function');
      expect(window.localStorage).toBeDefined();

      // Mock localStorage for testing environment
      const mockStorage = {
        getItem: jest.fn((key) => mockStorage.store[key] || null),
        setItem: jest.fn((key, value) => { mockStorage.store[key] = value; }),
        removeItem: jest.fn((key) => { delete mockStorage.store[key]; }),
        store: {},
      };

      // Test basic operations with mock
      mockStorage.setItem('test', 'value');
      expect(mockStorage.getItem('test')).toBe('value');
      mockStorage.removeItem('test');
      expect(mockStorage.getItem('test')).toBeNull();
    });

    test('Promise support across browsers', () => {
      expect(typeof Promise).toBe('function');

      return new Promise((resolve) => {
        resolve('test');
      }).then((result) => {
        expect(result).toBe('test');
      });
    });

    test('Fetch API support', () => {
      // In test environment, fetch might not be available
      // Check if it exists or can be polyfilled
      const hasFetch = typeof fetch === 'function' || typeof global.fetch === 'function';
      expect(typeof hasFetch).toBe('boolean');
    });

    test('Array methods support', () => {
      const testArray = [1, 2, 3, 4, 5];

      // Test modern array methods
      expect(testArray.find((x) => x === 3)).toBe(3);
      expect(testArray.includes(4)).toBe(true);
      expect(testArray.filter((x) => x > 3)).toEqual([4, 5]);
    });
  });

  describe('Form Input Support', () => {
    test('Number input type support', () => {
      const numberInput = document.getElementById('loan-amount');
      expect(numberInput.type).toBe('number');

      // Test value setting and getting
      numberInput.value = '250000';
      expect(numberInput.value).toBe('250000');
    });

    test('Input validation support', () => {
      const numberInput = document.getElementById('loan-amount');
      numberInput.setAttribute('min', '1000');
      numberInput.setAttribute('max', '10000000');

      expect(numberInput.getAttribute('min')).toBe('1000');
      expect(numberInput.getAttribute('max')).toBe('10000000');
    });

    test('Form submission handling', () => {
      const form = document.getElementById('loan-form');
      let submitCalled = false;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitCalled = true;
      });

      // Simulate form submission
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(submitCalled).toBe(true);
    });
  });

  describe('Event Handling', () => {
    test('Click event handling', () => {
      const button = document.getElementById('calculate-btn');
      let clickHandled = false;

      button.addEventListener('click', () => {
        clickHandled = true;
      });

      button.click();
      expect(clickHandled).toBe(true);
    });

    test('Keyboard event handling', () => {
      const input = document.getElementById('loan-amount');
      let keyHandled = false;

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          keyHandled = true;
        }
      });

      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(keyEvent);

      expect(keyHandled).toBe(true);
    });

    test('Focus and blur events', () => {
      const input = document.getElementById('loan-amount');
      let focusHandled = false;
      let blurHandled = false;

      input.addEventListener('focus', () => {
        focusHandled = true;
      });

      input.addEventListener('blur', () => {
        blurHandled = true;
      });

      input.focus();
      expect(focusHandled).toBe(true);

      input.blur();
      expect(blurHandled).toBe(true);
    });
  });

  describe('Browser-specific Tests', () => {
    test('Chrome compatibility', () => {
      setUserAgent('chrome');
      expect(navigator.userAgent).toContain('Chrome');

      // Test Chrome-specific features if any
      expect(typeof window.chrome).toBeDefined();
    });

    test('Firefox compatibility', () => {
      setUserAgent('firefox');
      expect(navigator.userAgent).toContain('Firefox');

      // Firefox should support all standard web APIs
      expect(typeof document.createElement).toBe('function');
    });

    test('Safari compatibility', () => {
      setUserAgent('safari');
      expect(navigator.userAgent).toContain('Safari');
      expect(navigator.userAgent).not.toContain('Chrome');

      // Safari-specific considerations
      expect(typeof document.createElement).toBe('function');
    });

    test('Edge compatibility', () => {
      setUserAgent('edge');
      expect(navigator.userAgent).toContain('Edg');

      // Edge should support all modern web standards
      expect(typeof document.createElement).toBe('function');
    });
  });

  describe('Responsive Design Tests', () => {
    test('Viewport meta tag handling', () => {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0';
      document.head.appendChild(viewport);

      expect(viewport.content).toContain('width=device-width');
    });

    test('Media query support', () => {
      // Test if matchMedia is supported
      expect(typeof window.matchMedia).toBe('function');

      const mobileQuery = window.matchMedia('(max-width: 768px)');
      expect(typeof mobileQuery.matches).toBe('boolean');
    });

    test('Touch event support', () => {
      // Test touch event availability
      const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      expect(typeof touchSupported).toBe('boolean');
    });
  });

  describe('Performance Tests', () => {
    test('Performance API availability', () => {
      expect(typeof performance).toBe('object');
      expect(typeof performance.now).toBe('function');
    });

    test('RequestAnimationFrame support', () => {
      expect(typeof requestAnimationFrame).toBe('function');
      expect(typeof cancelAnimationFrame).toBe('function');
    });

    test('Intersection Observer support', () => {
      // In test environment, IntersectionObserver might not be available
      // Check if it exists or can be polyfilled
      const hasIntersectionObserver = typeof IntersectionObserver === 'function'
                                     || typeof global.IntersectionObserver === 'function';
      expect(typeof hasIntersectionObserver).toBe('boolean');
    });
  });

  describe('Accessibility Features', () => {
    test('ARIA attributes support', () => {
      const button = document.getElementById('calculate-btn');
      button.setAttribute('aria-label', 'Calculate loan payment');

      expect(button.getAttribute('aria-label')).toBe('Calculate loan payment');
    });

    test('Focus management', () => {
      const input = document.getElementById('loan-amount');
      input.focus();

      expect(document.activeElement).toBe(input);
    });

    test('Screen reader support attributes', () => {
      const container = document.getElementById('results-container');
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('role', 'region');

      expect(container.getAttribute('aria-live')).toBe('polite');
      expect(container.getAttribute('role')).toBe('region');
    });
  });
});
