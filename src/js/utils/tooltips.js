/**
 * Tooltips Utility
 * Provides tooltip and guidance functionality for the application
 * Implements requirement 5.2
 */

/**
 * Initialize tooltips for elements with data-tooltip attribute
 * @param {HTMLElement} container - Container element to search for tooltips
 */
export function initTooltips(container = document) {
  const tooltipElements = container.querySelectorAll('[data-tooltip]');
  
  tooltipElements.forEach(element => {
    // Create tooltip element if it doesn't exist
    let tooltip = element.querySelector('.tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.setAttribute('role', 'tooltip');
      tooltip.setAttribute('aria-hidden', 'true');
      
      // Add tooltip content
      const tooltipContent = element.getAttribute('data-tooltip');
      tooltip.textContent = tooltipContent;
      
      // Add tooltip to element
      element.appendChild(tooltip);
      
      // Set position relative for proper tooltip positioning
      if (getComputedStyle(element).position === 'static') {
        element.style.position = 'relative';
      }
    }
    
    // Add event listeners
    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
    element.addEventListener('focus', showTooltip);
    element.addEventListener('blur', hideTooltip);
    
    // Add accessibility attributes
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
    
    const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
    tooltip.id = tooltipId;
    element.setAttribute('aria-describedby', tooltipId);
  });
}

/**
 * Show tooltip
 * @param {Event} event - Mouse or focus event
 */
function showTooltip(event) {
  const element = event.currentTarget;
  const tooltip = element.querySelector('.tooltip');
  
  if (tooltip) {
    // Position tooltip
    positionTooltip(element, tooltip);
    
    // Show tooltip
    tooltip.classList.add('visible');
    tooltip.setAttribute('aria-hidden', 'false');
    
    // Announce tooltip for screen readers
    const tooltipContent = element.getAttribute('data-tooltip');
    announceTooltip(tooltipContent);
  }
}

/**
 * Hide tooltip
 * @param {Event} event - Mouse or blur event
 */
function hideTooltip(event) {
  const element = event.currentTarget;
  const tooltip = element.querySelector('.tooltip');
  
  if (tooltip) {
    tooltip.classList.remove('visible');
    tooltip.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Position tooltip relative to its parent element
 * @param {HTMLElement} element - Parent element
 * @param {HTMLElement} tooltip - Tooltip element
 */
function positionTooltip(element, tooltip) {
  // Get position preference from data attribute
  const position = element.getAttribute('data-tooltip-position') || 'top';
  
  // Remove all position classes
  tooltip.classList.remove('tooltip-top', 'tooltip-bottom', 'tooltip-left', 'tooltip-right');
  
  // Add position class
  tooltip.classList.add(`tooltip-${position}`);
  
  // Adjust position if tooltip would go off screen
  setTimeout(() => {
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Check if tooltip is off screen
    if (tooltipRect.left < 0) {
      tooltip.classList.remove(`tooltip-${position}`);
      tooltip.classList.add('tooltip-right');
    } else if (tooltipRect.right > viewportWidth) {
      tooltip.classList.remove(`tooltip-${position}`);
      tooltip.classList.add('tooltip-left');
    } else if (tooltipRect.top < 0) {
      tooltip.classList.remove(`tooltip-${position}`);
      tooltip.classList.add('tooltip-bottom');
    } else if (tooltipRect.bottom > viewportHeight) {
      tooltip.classList.remove(`tooltip-${position}`);
      tooltip.classList.add('tooltip-top');
    }
  }, 0);
}

/**
 * Announce tooltip content to screen readers
 * @param {string} content - Tooltip content
 */
function announceTooltip(content) {
  // Create or get the announcement element
  let announcer = document.getElementById('tooltip-announcer');
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'tooltip-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.classList.add('sr-only');
    document.body.appendChild(announcer);
  }
  
  // Set the message
  announcer.textContent = '';
  
  // Force a DOM reflow
  void announcer.offsetWidth;
  
  // Set the message
  announcer.textContent = content;
}

/**
 * Add guidance tooltip to an element
 * @param {HTMLElement} element - Element to add tooltip to
 * @param {string} content - Tooltip content
 * @param {string} position - Tooltip position (top, bottom, left, right)
 */
export function addTooltip(element, content, position = 'top') {
  if (!element) return;
  
  element.setAttribute('data-tooltip', content);
  element.setAttribute('data-tooltip-position', position);
  
  // Initialize tooltip
  initTooltips(element.parentNode);
}

/**
 * Create a guidance panel with detailed information
 * @param {HTMLElement} container - Container to append guidance panel to
 * @param {string} title - Guidance panel title
 * @param {string} content - Guidance panel content (can include HTML)
 * @param {string} id - Unique ID for the guidance panel
 * @returns {HTMLElement} The created guidance panel
 */
export function createGuidancePanel(container, title, content, id) {
  if (!container) return null;
  
  // Create guidance panel
  const panel = document.createElement('div');
  panel.className = 'guidance-panel';
  panel.id = id || `guidance-${Math.random().toString(36).substr(2, 9)}`;
  
  // Create panel content
  panel.innerHTML = `
    <div class="guidance-header">
      <h3>${title}</h3>
      <button class="guidance-close" aria-label="Close guidance">×</button>
    </div>
    <div class="guidance-content">
      ${content}
    </div>
  `;
  
  // Add event listener for close button
  const closeButton = panel.querySelector('.guidance-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      panel.classList.add('guidance-hidden');
      
      // Remove panel after animation
      setTimeout(() => {
        panel.remove();
      }, 300);
    });
  }
  
  // Add panel to container
  container.appendChild(panel);
  
  // Show panel with animation
  setTimeout(() => {
    panel.classList.add('guidance-visible');
  }, 10);
  
  return panel;
}

/**
 * Create an interactive tutorial
 * @param {Array} steps - Array of tutorial steps
 * @param {Function} onComplete - Callback function when tutorial is complete
 */
export function createTutorial(steps, onComplete) {
  if (!steps || !steps.length) return;
  
  let currentStep = 0;
  
  // Create tutorial overlay
  const overlay = document.createElement('div');
  overlay.className = 'tutorial-overlay';
  document.body.appendChild(overlay);
  
  // Show first step
  showTutorialStep(steps[currentStep]);
  
  /**
   * Show a tutorial step
   * @param {Object} step - Tutorial step
   */
  function showTutorialStep(step) {
    // Find target element
    const target = document.querySelector(step.selector);
    if (!target) {
      console.error(`Tutorial target not found: ${step.selector}`);
      nextStep();
      return;
    }
    
    // Position highlight around target
    positionHighlight(target);
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tutorial-tooltip';
    tooltip.innerHTML = `
      <div class="tutorial-content">
        <h3>${step.title}</h3>
        <p>${step.content}</p>
      </div>
      <div class="tutorial-controls">
        <button class="tutorial-prev" ${currentStep === 0 ? 'disabled' : ''}>Previous</button>
        <span class="tutorial-progress">${currentStep + 1}/${steps.length}</span>
        <button class="tutorial-next">${currentStep === steps.length - 1 ? 'Finish' : 'Next'}</button>
      </div>
    `;
    
    // Position tooltip
    positionTooltipNearTarget(tooltip, target, step.position || 'bottom');
    
    // Add tooltip to document
    document.body.appendChild(tooltip);
    
    // Add event listeners
    const prevButton = tooltip.querySelector('.tutorial-prev');
    const nextButton = tooltip.querySelector('.tutorial-next');
    
    if (prevButton) {
      prevButton.addEventListener('click', prevStep);
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', nextStep);
    }
    
    // Execute step action if provided
    if (step.action && typeof step.action === 'function') {
      step.action(target);
    }
  }
  
  /**
   * Position highlight around target element
   * @param {HTMLElement} target - Target element
   */
  function positionHighlight(target) {
    const rect = target.getBoundingClientRect();
    
    // Create highlight element if it doesn't exist
    let highlight = document.querySelector('.tutorial-highlight');
    if (!highlight) {
      highlight = document.createElement('div');
      highlight.className = 'tutorial-highlight';
      overlay.appendChild(highlight);
    }
    
    // Position highlight
    highlight.style.top = `${rect.top - 10}px`;
    highlight.style.left = `${rect.left - 10}px`;
    highlight.style.width = `${rect.width + 20}px`;
    highlight.style.height = `${rect.height + 20}px`;
  }
  
  /**
   * Position tooltip near target element
   * @param {HTMLElement} tooltip - Tooltip element
   * @param {HTMLElement} target - Target element
   * @param {string} position - Position (top, bottom, left, right)
   */
  function positionTooltipNearTarget(tooltip, target, position) {
    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Set initial position
    switch (position) {
      case 'top':
        tooltip.style.top = `${rect.top - tooltipRect.height - 20}px`;
        tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltipRect.width / 2)}px`;
        break;
      case 'bottom':
        tooltip.style.top = `${rect.bottom + 20}px`;
        tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltipRect.width / 2)}px`;
        break;
      case 'left':
        tooltip.style.top = `${rect.top + (rect.height / 2) - (tooltipRect.height / 2)}px`;
        tooltip.style.left = `${rect.left - tooltipRect.width - 20}px`;
        break;
      case 'right':
        tooltip.style.top = `${rect.top + (rect.height / 2) - (tooltipRect.height / 2)}px`;
        tooltip.style.left = `${rect.right + 20}px`;
        break;
      default:
        tooltip.style.top = `${rect.bottom + 20}px`;
        tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltipRect.width / 2)}px`;
    }
    
    // Adjust if tooltip is off screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (parseFloat(tooltip.style.left) < 20) {
      tooltip.style.left = '20px';
    } else if (parseFloat(tooltip.style.left) + tooltipRect.width > viewportWidth - 20) {
      tooltip.style.left = `${viewportWidth - tooltipRect.width - 20}px`;
    }
    
    if (parseFloat(tooltip.style.top) < 20) {
      tooltip.style.top = '20px';
    } else if (parseFloat(tooltip.style.top) + tooltipRect.height > viewportHeight - 20) {
      tooltip.style.top = `${viewportHeight - tooltipRect.height - 20}px`;
    }
  }
  
  /**
   * Go to previous step
   */
  function prevStep() {
    if (currentStep > 0) {
      // Remove current tooltip
      const tooltip = document.querySelector('.tutorial-tooltip');
      if (tooltip) {
        tooltip.remove();
      }
      
      // Go to previous step
      currentStep--;
      showTutorialStep(steps[currentStep]);
    }
  }
  
  /**
   * Go to next step
   */
  function nextStep() {
    // Remove current tooltip
    const tooltip = document.querySelector('.tutorial-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
    
    // Check if tutorial is complete
    if (currentStep === steps.length - 1) {
      completeTutorial();
      return;
    }
    
    // Go to next step
    currentStep++;
    showTutorialStep(steps[currentStep]);
  }
  
  /**
   * Complete tutorial
   */
  function completeTutorial() {
    // Remove overlay and highlight
    overlay.remove();
    
    // Call onComplete callback
    if (onComplete && typeof onComplete === 'function') {
      onComplete();
    }
  }
}

export default {
  initTooltips,
  addTooltip,
  createGuidancePanel,
  createTutorial
};