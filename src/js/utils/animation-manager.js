/**
 * Animation Manager Utility
 * Manages smooth animations and transitions for UI elements
 * Implements requirements 3.1, 3.4
 */

class AnimationManager {
  constructor() {
    this.animationQueue = [];
    this.isAnimating = false;
    this.observers = new Map();
  }

  /**
   * Animate results appearing with staggered effect
   * @param {HTMLElement|string} container - Container element or selector
   * @param {Object} options - Animation options
   */
  animateResultsReveal(container, options = {}) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element) return;

    const {
      stagger = true,
      delay = 0,
      duration = 500,
      easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
    } = options;

    // Find all animatable children
    const children = element.querySelectorAll('.summary-item, .breakdown-chart, .chart-item, .results-summary > *, .results-breakdown > *');

    if (children.length === 0) return;

    // Reset any existing animations
    children.forEach((child) => {
      child.classList.remove('results-enter', 'results-enter-stagger');
      child.style.opacity = '0';
      child.style.transform = 'translateY(30px)';
    });

    // Start animation after a brief delay
    setTimeout(() => {
      if (stagger) {
        children.forEach((child, index) => {
          setTimeout(() => {
            child.classList.add('results-enter-stagger');
          }, index * 100);
        });
      } else {
        children.forEach((child) => {
          child.classList.add('results-enter');
        });
      }
    }, delay);
  }

  /**
   * Animate chart reveal with scale effect
   * @param {HTMLElement|string} container - Container element or selector
   * @param {Object} options - Animation options
   */
  animateChartReveal(container, options = {}) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element) return;

    const { delay = 300 } = options;

    // Reset animation state
    element.classList.remove('chart-reveal', 'chart-reveal-delayed');
    element.style.opacity = '0';
    element.style.transform = 'scale(0.8)';

    // Start animation
    setTimeout(() => {
      element.classList.add(delay > 0 ? 'chart-reveal-delayed' : 'chart-reveal');
    }, delay);
  }

  /**
   * Animate table rows appearing
   * @param {HTMLElement|string} table - Table element or selector
   * @param {Object} options - Animation options
   */
  animateTableRows(table, options = {}) {
    const element = typeof table === 'string' ? document.querySelector(table) : table;
    if (!element) return;

    const { delay = 0, staggerDelay = 50 } = options;
    const rows = element.querySelectorAll('tbody tr');

    if (rows.length === 0) return;

    // Reset animation state
    rows.forEach((row) => {
      row.classList.remove('table-row-enter');
      row.style.opacity = '0';
      row.style.transform = 'translateX(-20px)';
    });

    // Start animation
    setTimeout(() => {
      rows.forEach((row, index) => {
        setTimeout(() => {
          row.classList.add('table-row-enter');
        }, index * staggerDelay);
      });
    }, delay);
  }

  /**
   * Animate number changes with counter effect
   * @param {HTMLElement} element - Element containing the number
   * @param {number} from - Starting number
   * @param {number} to - Ending number
   * @param {Object} options - Animation options
   */
  animateNumber(element, from, to, options = {}) {
    if (!element) return;

    const {
      duration = 1000,
      formatter = (num) => num.toLocaleString(),
      easing = 'easeOutCubic',
    } = options;

    const startTime = performance.now();
    const difference = to - from;

    const easingFunctions = {
      linear: (t) => t,
      easeOutCubic: (t) => 1 - (1 - t) ** 3,
      easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
    };

    const easingFunction = easingFunctions[easing] || easingFunctions.easeOutCubic;

    element.classList.add('number-counter', 'updating');

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFunction(progress);

      const currentValue = from + (difference * easedProgress);
      element.textContent = formatter(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.classList.remove('updating');
        element.textContent = formatter(to);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Animate progress bar fill
   * @param {HTMLElement|string} progressBar - Progress bar element or selector
   * @param {number} percentage - Target percentage (0-100)
   * @param {Object} options - Animation options
   */
  animateProgressBar(progressBar, percentage, options = {}) {
    const element = typeof progressBar === 'string' ? document.querySelector(progressBar) : progressBar;
    if (!element) return;

    const { duration = 1000, delay = 0 } = options;
    const fill = element.querySelector('.breakdown-principal, .breakdown-interest, .progress-fill');

    if (!fill) return;

    setTimeout(() => {
      fill.style.transition = `width ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
      fill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    }, delay);
  }

  /**
   * Add hover animations to elements
   * @param {HTMLElement|string} container - Container element or selector
   * @param {string} selector - Selector for elements to animate
   */
  addHoverAnimations(container, selector) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element) return;

    const targets = element.querySelectorAll(selector);

    targets.forEach((target) => {
      target.addEventListener('mouseenter', () => {
        target.style.transform = 'translateY(-2px)';
        target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      });

      target.addEventListener('mouseleave', () => {
        target.style.transform = '';
        target.style.boxShadow = '';
      });
    });
  }

  /**
   * Create ripple effect on button click
   * @param {HTMLElement} button - Button element
   * @param {Event} event - Click event
   */
  createRippleEffect(button, event) {
    if (!button || !event) return;

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;

    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * Animate element entrance with intersection observer
   * @param {string} selector - Selector for elements to observe
   * @param {Object} options - Animation options
   */
  observeAndAnimate(selector, options = {}) {
    const {
      threshold = 0.1,
      rootMargin = '0px 0px -50px 0px',
      animationClass = 'results-enter',
    } = options;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(animationClass);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold,
      rootMargin,
    });

    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      observer.observe(element);
    });

    this.observers.set(selector, observer);
  }

  /**
   * Remove all observers
   */
  disconnectObservers() {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }

  /**
   * Queue animation for sequential execution
   * @param {Function} animationFunction - Function that performs the animation
   * @param {number} delay - Delay before executing this animation
   */
  queueAnimation(animationFunction, delay = 0) {
    this.animationQueue.push({ fn: animationFunction, delay });

    if (!this.isAnimating) {
      this.processQueue();
    }
  }

  /**
   * Process animation queue
   * @private
   */
  async processQueue() {
    if (this.animationQueue.length === 0) {
      this.isAnimating = false;
      return;
    }

    this.isAnimating = true;
    const { fn, delay } = this.animationQueue.shift();

    if (delay > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
    }

    try {
      await fn();
    } catch (error) {
      console.error('Animation error:', error);
    }

    // Process next animation
    this.processQueue();
  }

  /**
   * Clear animation queue
   */
  clearQueue() {
    this.animationQueue = [];
    this.isAnimating = false;
  }

  /**
   * Check if user prefers reduced motion
   * @returns {boolean} True if reduced motion is preferred
   */
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Animate with respect to user preferences
   * @param {Function} animationFunction - Animation to run
   * @param {Function} fallbackFunction - Fallback for reduced motion
   */
  respectfulAnimate(animationFunction, fallbackFunction = null) {
    if (this.prefersReducedMotion()) {
      if (fallbackFunction) {
        fallbackFunction();
      }
    } else {
      animationFunction();
    }
  }
}

// Add ripple animation CSS if not already present
if (!document.querySelector('#ripple-animation-styles')) {
  const style = document.createElement('style');
  style.id = 'ripple-animation-styles';
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Create singleton instance
const animationManager = new AnimationManager();

export default animationManager;
