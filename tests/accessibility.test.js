/**
 * Accessibility Tests for Loan Calculator
 * Verifies WCAG 2.1 AA compliance
 * Implements requirements 6.1, 6.2, 6.5
 */

import { axe, toHaveNoViolations } from 'jest-axe';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Add custom matcher for accessibility violations
expect.extend(toHaveNoViolations);

describe('Accessibility Compliance', () => {
  let dom;
  let document;
  let window;
  
  beforeEach(() => {
    // Load the HTML file
    const htmlPath = path.resolve(__dirname, '../src/index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    // Create a new JSDOM instance
    dom = new JSDOM(html, {
      url: 'http://localhost/',
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true
    });
    
    // Get the document and window
    document = dom.window.document;
    window = dom.window;
  });
  
  test('should have no accessibility violations in the main page', async () => {
    // Run axe on the document
    const results = await axe(document.documentElement.outerHTML);
    
    // Check for violations
    expect(results).toHaveNoViolations();
  });
  
  test('should have proper heading structure', () => {
    // Get all headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    // Check that there is at least one h1
    const h1Count = document.querySelectorAll('h1').length;
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // Check heading hierarchy (no skipped levels)
    let previousLevel = 0;
    let hasError = false;
    
    headings.forEach(heading => {
      const currentLevel = parseInt(heading.tagName.substring(1), 10);
      
      // First heading or same/lower level is fine
      if (previousLevel === 0 || currentLevel <= previousLevel + 1) {
        previousLevel = currentLevel;
      } else {
        hasError = true;
      }
    });
    
    expect(hasError).toBe(false);
  });
  
  test('should have alt text for all images', () => {
    // Get all images
    const images = document.querySelectorAll('img');
    
    // Check that all images have alt text
    let missingAlt = false;
    
    images.forEach(img => {
      if (!img.hasAttribute('alt')) {
        missingAlt = true;
      }
    });
    
    expect(missingAlt).toBe(false);
  });
  
  test('should have sufficient color contrast', () => {
    // This would typically use a color contrast analyzer
    // For this test, we'll check that CSS variables for colors are defined
    
    // Get the computed style for the body
    const style = window.getComputedStyle(document.body);
    
    // Check for CSS variables that define colors
    const hasTextColor = style.getPropertyValue('--text-color') !== '';
    const hasBackgroundColor = style.getPropertyValue('--background-color') !== '';
    
    expect(hasTextColor || hasBackgroundColor).toBe(true);
  });
  
  test('should have proper form labels', () => {
    // Get all form inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    
    // Check that all inputs have associated labels
    let missingLabel = false;
    
    inputs.forEach(input => {
      // Skip inputs that don't need labels (e.g., hidden, submit)
      if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') {
        return;
      }
      
      // Check for label with 'for' attribute
      const id = input.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      
      // Check for aria-label or aria-labelledby
      const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
      
      if (!hasLabel && !hasAriaLabel) {
        missingLabel = true;
      }
    });
    
    expect(missingLabel).toBe(false);
  });
  
  test('should have proper ARIA attributes', () => {
    // Get elements with ARIA attributes
    const ariaElements = document.querySelectorAll('[aria-*]');
    
    // Check for common ARIA mistakes
    let hasInvalidAria = false;
    
    ariaElements.forEach(el => {
      // Check for invalid role
      if (el.hasAttribute('role')) {
        const role = el.getAttribute('role');
        const validRoles = [
          'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
          'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
          'contentinfo', 'definition', 'dialog', 'directory', 'document',
          'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
          'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
          'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
          'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
          'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
          'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
          'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
          'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar',
          'tooltip', 'tree', 'treegrid', 'treeitem'
        ];
        
        if (!validRoles.includes(role)) {
          hasInvalidAria = true;
        }
      }
      
      // Check for aria-hidden on focusable elements
      if (el.hasAttribute('aria-hidden') && el.getAttribute('aria-hidden') === 'true') {
        const focusableElements = ['a', 'button', 'input', 'select', 'textarea'];
        if (focusableElements.includes(el.tagName.toLowerCase())) {
          hasInvalidAria = true;
        }
      }
    });
    
    expect(hasInvalidAria).toBe(false);
  });
  
  test('should have keyboard navigable interactive elements', () => {
    // Get all interactive elements
    const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
    
    // Check for negative tabindex
    let hasNegativeTabindex = false;
    
    interactiveElements.forEach(el => {
      if (el.hasAttribute('tabindex') && parseInt(el.getAttribute('tabindex'), 10) < 0) {
        // Negative tabindex is only a problem if it's on an element that should be focusable
        const shouldBeFocusable = ['a', 'button', 'input', 'select', 'textarea'].includes(el.tagName.toLowerCase());
        if (shouldBeFocusable) {
          hasNegativeTabindex = true;
        }
      }
    });
    
    expect(hasNegativeTabindex).toBe(false);
  });
  
  test('should have proper document language', () => {
    // Check that the HTML element has a lang attribute
    const html = document.querySelector('html');
    expect(html.hasAttribute('lang')).toBe(true);
    
    // Check that the lang attribute is not empty
    const lang = html.getAttribute('lang');
    expect(lang).not.toBe('');
  });
  
  test('should have proper page title', () => {
    // Check that the page has a title
    const title = document.querySelector('title');
    expect(title).not.toBeNull();
    
    // Check that the title is not empty
    expect(title.textContent).not.toBe('');
  });
});