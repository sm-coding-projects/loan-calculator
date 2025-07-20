/**
 * Loading Manager Utility
 * Manages various loading states and animations
 * Implements requirements 3.2, 3.4, 5.1, 5.5
 */

import { announceLoadingState, enhanceLoadingAccessibility, removeLoadingAccessibility } from './accessibility.js';

class LoadingManager {
  constructor() {
    this.activeLoadings = new Map();
    this.loadingOverlay = null;
  }

  /**
   * Show skeleton loader for a specific container
   * @param {HTMLElement|string} container - Container element or selector
   * @param {string} type - Type of skeleton ('results', 'table', 'chart', 'form')
   * @param {Object} options - Additional options
   */
  showSkeleton(container, type = 'results', options = {}) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element) return;

    const skeletonId = `skeleton-${Date.now()}`;
    const skeletonHtml = this.generateSkeletonHtml(type, options);

    // Store original content
    this.activeLoadings.set(skeletonId, {
      element,
      originalContent: element.innerHTML,
      type: 'skeleton',
    });

    // Show skeleton
    element.innerHTML = skeletonHtml;
    element.classList.add('skeleton-loading');

    return skeletonId;
  }

  /**
   * Hide skeleton loader
   * @param {string} skeletonId - Skeleton ID returned from showSkeleton
   * @param {boolean} restoreContent - Whether to restore original content
   */
  hideSkeleton(skeletonId, restoreContent = false) {
    const loading = this.activeLoadings.get(skeletonId);
    if (!loading) return;

    if (restoreContent) {
      loading.element.innerHTML = loading.originalContent;
    }

    loading.element.classList.remove('skeleton-loading');
    this.activeLoadings.delete(skeletonId);
  }

  /**
   * Show progress overlay with steps
   * @param {Array} steps - Array of step objects {id, label, status}
   * @param {Object} options - Additional options
   */
  showProgressOverlay(steps = [], options = {}) {
    const {
      title = 'Processing...',
      message = 'Please wait while we process your request.',
      cancellable = false,
      onCancel = null,
    } = options;

    // Remove existing overlay
    this.hideProgressOverlay();

    // Announce loading start to screen readers
    announceLoadingState('started', `${title}. ${message}`);

    // Create overlay
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = 'calculation-loading-overlay';
    this.loadingOverlay.setAttribute('role', 'dialog');
    this.loadingOverlay.setAttribute('aria-modal', 'true');
    this.loadingOverlay.setAttribute('aria-labelledby', 'loading-title');
    this.loadingOverlay.setAttribute('aria-describedby', 'loading-message');
    
    this.loadingOverlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-header">
          <h3 id="loading-title">${title}</h3>
          <p id="loading-message" class="loading-message">${message}</p>
        </div>
        
        ${steps.length > 0 ? this.generateProgressSteps(steps) : ''}
        
        <div class="loading-spinner-container" aria-hidden="true">
          <div class="loading-spinner-dots">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </div>
        </div>
        
        <div class="loading-progress">
          <div class="progress-bar-enhanced" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Calculation progress">
            <div class="progress-fill-enhanced pulsing" style="width: 0%"></div>
          </div>
          <div class="progress-text" aria-live="polite" aria-atomic="true">Initializing...</div>
        </div>
        
        ${cancellable ? `
          <div class="loading-actions">
            <button class="btn-cancel" id="cancel-loading" aria-label="Cancel calculation">Cancel</button>
          </div>
        ` : ''}
      </div>
    `;

    // Add to document
    document.body.appendChild(this.loadingOverlay);

    // Set focus to the overlay for screen reader users
    this.loadingOverlay.setAttribute('tabindex', '-1');
    this.loadingOverlay.focus();

    // Handle cancel button
    if (cancellable && onCancel) {
      const cancelBtn = this.loadingOverlay.querySelector('#cancel-loading');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          announceLoadingState('error', 'Calculation cancelled by user.');
          onCancel();
          this.hideProgressOverlay();
        });
      }
    }

    // Animate in
    requestAnimationFrame(() => {
      this.loadingOverlay.style.opacity = '1';
    });
  }

  /**
   * Update progress overlay
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} message - Progress message
   * @param {string} currentStep - Current step ID
   */
  updateProgress(progress, message = '', currentStep = null) {
    if (!this.loadingOverlay) return;

    const progressBar = this.loadingOverlay.querySelector('[role="progressbar"]');
    const progressFill = this.loadingOverlay.querySelector('.progress-fill-enhanced');
    const progressText = this.loadingOverlay.querySelector('.progress-text');

    const clampedProgress = Math.min(100, Math.max(0, progress));

    if (progressBar) {
      progressBar.setAttribute('aria-valuenow', clampedProgress);
      progressBar.setAttribute('aria-valuetext', `${Math.round(clampedProgress)}% complete`);
    }

    if (progressFill) {
      progressFill.style.width = `${clampedProgress}%`;
    }

    if (progressText && message) {
      progressText.textContent = message;
      
      // Announce significant progress milestones
      if (progress === 100) {
        announceLoadingState('completed', message);
      } else if (progress > 0 && progress % 25 === 0) {
        announceLoadingState('progress', message, progress);
      }
    }

    // Update step status
    if (currentStep) {
      this.updateStepStatus(currentStep, 'active');
    }
  }

  /**
   * Update step status in progress overlay
   * @param {string} stepId - Step ID
   * @param {string} status - Status ('pending', 'active', 'completed', 'error')
   */
  updateStepStatus(stepId, status) {
    if (!this.loadingOverlay) return;

    const step = this.loadingOverlay.querySelector(`[data-step-id="${stepId}"]`);
    if (!step) return;

    // Remove all status classes
    step.classList.remove('pending', 'active', 'completed', 'error');
    step.classList.add(status);

    // Update step number/icon
    const circle = step.querySelector('.progress-step-circle');
    if (circle) {
      switch (status) {
        case 'completed':
          circle.innerHTML = '✓';
          break;
        case 'error':
          circle.innerHTML = '✗';
          break;
        case 'active':
          circle.innerHTML = step.dataset.stepNumber || '';
          break;
        default:
          circle.innerHTML = step.dataset.stepNumber || '';
      }
    }
  }

  /**
   * Hide progress overlay
   */
  hideProgressOverlay() {
    if (this.loadingOverlay) {
      // Return focus to the previously focused element
      const previouslyFocused = document.querySelector('[data-was-focused]');
      if (previouslyFocused) {
        previouslyFocused.focus();
        previouslyFocused.removeAttribute('data-was-focused');
      }

      this.loadingOverlay.style.opacity = '0';
      setTimeout(() => {
        if (this.loadingOverlay && this.loadingOverlay.parentNode) {
          this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
        }
        this.loadingOverlay = null;
      }, 300);
    }
  }

  /**
   * Show inline loading spinner
   * @param {HTMLElement|string} container - Container element or selector
   * @param {string} type - Spinner type ('default', 'dots', 'pulse', 'bars')
   * @param {string} message - Loading message
   */
  showInlineLoader(container, type = 'default', message = 'Loading...') {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element) return;

    const loaderId = `loader-${Date.now()}`;
    const spinnerHtml = this.generateSpinnerHtml(type, message);

    // Store original content
    this.activeLoadings.set(loaderId, {
      element,
      originalContent: element.innerHTML,
      type: 'inline',
    });

    // Show loader
    element.innerHTML = spinnerHtml;
    element.classList.add('inline-loading');

    return loaderId;
  }

  /**
   * Hide inline loading spinner
   * @param {string} loaderId - Loader ID returned from showInlineLoader
   * @param {boolean} restoreContent - Whether to restore original content
   */
  hideInlineLoader(loaderId, restoreContent = false) {
    const loading = this.activeLoadings.get(loaderId);
    if (!loading) return;

    if (restoreContent) {
      loading.element.innerHTML = loading.originalContent;
    }

    loading.element.classList.remove('inline-loading');
    this.activeLoadings.delete(loaderId);
  }

  /**
   * Generate skeleton HTML based on type
   * @param {string} type - Skeleton type
   * @param {Object} options - Additional options
   * @returns {string} Skeleton HTML
   */
  generateSkeletonHtml(type, options = {}) {
    switch (type) {
      case 'results':
        return this.generateResultsSkeleton(options);
      case 'table':
        return this.generateTableSkeleton(options);
      case 'chart':
        return this.generateChartSkeleton(options);
      case 'form':
        return this.generateFormSkeleton(options);
      default:
        return this.generateResultsSkeleton(options);
    }
  }

  /**
   * Generate results skeleton HTML
   * @param {Object} options - Options
   * @returns {string} HTML
   */
  generateResultsSkeleton(options = {}) {
    const { items = 8 } = options;

    return `
      <div class="skeleton-results">
        <div class="skeleton-summary">
          ${Array(items).fill(0).map(() => `
            <div class="skeleton-summary-item">
              <div class="skeleton-summary-label skeleton"></div>
              <div class="skeleton-summary-value skeleton"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Generate table skeleton HTML
   * @param {Object} options - Options
   * @returns {string} HTML
   */
  generateTableSkeleton(options = {}) {
    const { rows = 10, columns = 5 } = options;

    return `
      <table class="skeleton-table">
        <thead>
          <tr>
            ${Array(columns).fill(0).map(() => `
              <th><div class="skeleton-table-header skeleton"></div></th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${Array(rows).fill(0).map(() => `
            <tr class="skeleton-row">
              ${Array(columns).fill(0).map((_, i) => `
                <td><div class="skeleton-cell ${i === columns - 1 ? 'number' : i % 3 === 0 ? 'short' : 'medium'} skeleton"></div></td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Generate chart skeleton HTML
   * @param {Object} options - Options
   * @returns {string} HTML
   */
  generateChartSkeleton(options = {}) {
    const { title = true, legend = true } = options;

    return `
      <div class="skeleton-chart">
        ${title ? '<div class="skeleton-chart-title skeleton"></div>' : ''}
        ${legend ? `
          <div class="skeleton-chart-legend">
            <div class="skeleton-legend-item">
              <div class="skeleton-legend-color skeleton"></div>
              <div class="skeleton-legend-text skeleton"></div>
            </div>
            <div class="skeleton-legend-item">
              <div class="skeleton-legend-color skeleton"></div>
              <div class="skeleton-legend-text skeleton"></div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate form skeleton HTML
   * @param {Object} options - Options
   * @returns {string} HTML
   */
  generateFormSkeleton(options = {}) {
    const { fields = 6 } = options;

    return `
      <div class="skeleton-form">
        ${Array(fields).fill(0).map(() => `
          <div class="skeleton-form-group">
            <div class="skeleton-form-label skeleton"></div>
            <div class="skeleton-form-input skeleton"></div>
            <div class="skeleton-form-slider skeleton"></div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Generate spinner HTML
   * @param {string} type - Spinner type
   * @param {string} message - Loading message
   * @returns {string} HTML
   */
  generateSpinnerHtml(type, message) {
    let spinnerHtml = '';

    switch (type) {
      case 'dots':
        spinnerHtml = `
          <div class="loading-spinner-dots">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </div>
        `;
        break;
      case 'pulse':
        spinnerHtml = '<div class="loading-spinner-pulse"></div>';
        break;
      case 'bars':
        spinnerHtml = `
          <div class="loading-spinner-bars">
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
          </div>
        `;
        break;
      default:
        spinnerHtml = '<div class="loading-spinner"></div>';
    }

    return `
      <div class="component-loading">
        ${spinnerHtml}
        <div class="loading-text">${message}</div>
      </div>
    `;
  }

  /**
   * Generate progress steps HTML
   * @param {Array} steps - Array of step objects
   * @returns {string} HTML
   */
  generateProgressSteps(steps) {
    return `
      <div class="progress-steps">
        ${steps.map((step, index) => `
          <div class="progress-step ${step.status || 'pending'}" data-step-id="${step.id}" data-step-number="${index + 1}">
            <div class="progress-step-circle">${step.status === 'completed' ? '✓' : step.status === 'error' ? '✗' : index + 1}</div>
            <div class="progress-step-line"></div>
            <div class="progress-step-label">${step.label}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Clear all active loadings
   */
  clearAll() {
    // Hide progress overlay
    this.hideProgressOverlay();

    // Clear all active loadings
    this.activeLoadings.forEach((loading, id) => {
      if (loading.type === 'skeleton') {
        this.hideSkeleton(id, true);
      } else if (loading.type === 'inline') {
        this.hideInlineLoader(id, true);
      }
    });

    this.activeLoadings.clear();
  }
}

// Create singleton instance
const loadingManager = new LoadingManager();

export default loadingManager;
