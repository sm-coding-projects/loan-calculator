/**
 * Saved Calculations Manager Component
 * Provides UI for viewing, loading, deleting, and comparing saved calculations
 * Implements requirements 1.4, 3.2, 3.3
 */

import CalculationManagerService from '../services/calculation-manager.service.js';

class SavedCalculationsManager {
  /**
   * Create a new saved calculations manager
   * @param {Object} options - Configuration options
   * @param {string} [options.containerId] - ID of the container element
   * @param {CalculationManagerService} [options.calculationManager] - Calculation manager service
   * @param {Function} [options.onLoadCalculation] - Callback when a calculation is loaded
   * @param {Function} [options.onCompareCalculations] - Callback when calculations are compared
   */
  constructor(options = {}) {
    this.containerId = options.containerId || 'saved-calculations-container';
    this.calculationManager = options.calculationManager || new CalculationManagerService();
    this.onLoadCalculation = options.onLoadCalculation || (() => {});
    this.onCompareCalculations = options.onCompareCalculations || (() => {});
    
    this.container = null;
    this.calculationsList = null;
    this.comparisonView = null;
    this.isComparisonMode = false;
    
    this.initialize();
  }
  
  /**
   * Initialize the component
   */
  initialize() {
    // Find or create the container
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`Container with ID "${this.containerId}" not found`);
      return;
    }
    
    this.render();
    this.attachEventListeners();
  }
  
  /**
   * Render the component
   */
  render() {
    // Clear the container
    this.container.innerHTML = '';
    
    // Create the main structure
    const template = `
      <div class="saved-calculations-manager">
        <div class="saved-calculations-header">
          <h2>Saved Calculations</h2>
          <div class="saved-calculations-actions">
            <button id="compare-button" class="btn btn-secondary" disabled>Compare Selected</button>
            <button id="clear-selection-button" class="btn btn-outline-secondary" disabled>Clear Selection</button>
          </div>
        </div>
        
        <div class="saved-calculations-content">
          <div id="saved-calculations-list" class="saved-calculations-list">
            <p class="empty-state-message">No saved calculations yet. Save a calculation to see it here.</p>
          </div>
          
          <div id="comparison-view" class="comparison-view" style="display: none;">
            <div class="comparison-header">
              <h3>Comparison</h3>
              <button id="close-comparison-button" class="btn btn-outline-secondary">Close</button>
            </div>
            <div id="comparison-content" class="comparison-content"></div>
          </div>
        </div>
      </div>
    `;
    
    this.container.innerHTML = template;
    
    // Store references to elements
    this.calculationsList = document.getElementById('saved-calculations-list');
    this.comparisonView = document.getElementById('comparison-view');
    this.comparisonContent = document.getElementById('comparison-content');
    this.compareButton = document.getElementById('compare-button');
    this.clearSelectionButton = document.getElementById('clear-selection-button');
    
    // Load saved calculations
    this.loadCalculations();
  }
  
  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Compare button
    const compareButton = document.getElementById('compare-button');
    if (compareButton) {
      compareButton.addEventListener('click', () => this.showComparison());
    }
    
    // Clear selection button
    const clearSelectionButton = document.getElementById('clear-selection-button');
    if (clearSelectionButton) {
      clearSelectionButton.addEventListener('click', () => this.clearSelection());
    }
    
    // Close comparison button
    const closeComparisonButton = document.getElementById('close-comparison-button');
    if (closeComparisonButton) {
      closeComparisonButton.addEventListener('click', () => this.hideComparison());
    }
  }
  
  /**
   * Load and display saved calculations
   */
  loadCalculations() {
    const calculations = this.calculationManager.getAllCalculations();
    
    if (calculations.length === 0) {
      // Show empty state
      this.calculationsList.innerHTML = `
        <p class="empty-state-message">No saved calculations yet. Save a calculation to see it here.</p>
      `;
      return;
    }
    
    // Clear the list
    this.calculationsList.innerHTML = '';
    
    // Create a card for each calculation
    calculations.forEach(calc => {
      const card = this.createCalculationCard(calc);
      this.calculationsList.appendChild(card);
    });
    
    // Update button states
    this.updateButtonStates();
  }
  
  /**
   * Create a card element for a calculation
   * @param {Object} calculation - Calculation object
   * @returns {HTMLElement} Card element
   */
  createCalculationCard(calculation) {
    const { loan, savedAt, isSelected } = calculation;
    
    // Format currency
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    
    const card = document.createElement('div');
    card.className = `calculation-card ${isSelected ? 'selected' : ''}`;
    card.dataset.id = loan.id;
    
    card.innerHTML = `
      <div class="calculation-card-header">
        <h3 class="calculation-name">${loan.name || 'Unnamed Calculation'}</h3>
        <div class="calculation-date">${calculation.formattedDate}</div>
      </div>
      
      <div class="calculation-card-content">
        <div class="calculation-details">
          <div class="detail-row">
            <span class="detail-label">Loan Amount:</span>
            <span class="detail-value">${formatter.format(loan.totalLoanAmount)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Interest Rate:</span>
            <span class="detail-value">${loan.interestRate}%</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Term:</span>
            <span class="detail-value">${loan.term} months</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment:</span>
            <span class="detail-value">${formatter.format(loan.paymentAmount)}</span>
          </div>
        </div>
      </div>
      
      <div class="calculation-card-actions">
        <button class="btn btn-primary load-btn">Load</button>
        <button class="btn btn-outline-danger delete-btn">Delete</button>
        <div class="select-calculation">
          <input type="checkbox" id="select-${loan.id}" class="select-checkbox" ${isSelected ? 'checked' : ''}>
          <label for="select-${loan.id}">Select for comparison</label>
        </div>
      </div>
    `;
    
    // Add event listeners
    const loadBtn = card.querySelector('.load-btn');
    loadBtn.addEventListener('click', () => this.loadCalculation(loan.id));
    
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => this.deleteCalculation(loan.id));
    
    const selectCheckbox = card.querySelector('.select-checkbox');
    selectCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        this.selectCalculation(loan.id, card);
      } else {
        this.deselectCalculation(loan.id, card);
      }
    });
    
    return card;
  }
  
  /**
   * Load a calculation
   * @param {string} id - Calculation ID
   */
  loadCalculation(id) {
    const calculation = this.calculationManager.getCalculation(id);
    if (calculation) {
      this.onLoadCalculation(calculation);
    }
  }
  
  /**
   * Delete a calculation
   * @param {string} id - Calculation ID
   */
  deleteCalculation(id) {
    if (confirm('Are you sure you want to delete this calculation?')) {
      const success = this.calculationManager.deleteCalculation(id);
      if (success) {
        this.loadCalculations();
      }
    }
  }
  
  /**
   * Select a calculation for comparison
   * @param {string} id - Calculation ID
   * @param {HTMLElement} card - Card element
   */
  selectCalculation(id, card) {
    const success = this.calculationManager.selectCalculation(id);
    
    if (!success) {
      // If selection failed (e.g., max comparisons reached), uncheck the checkbox
      const checkbox = card.querySelector('.select-checkbox');
      checkbox.checked = false;
      
      alert(`You can only select up to ${this.calculationManager.maxComparisons} calculations for comparison.`);
      return;
    }
    
    // Add selected class to card
    card.classList.add('selected');
    
    // Update button states
    this.updateButtonStates();
  }
  
  /**
   * Deselect a calculation
   * @param {string} id - Calculation ID
   * @param {HTMLElement} card - Card element
   */
  deselectCalculation(id, card) {
    this.calculationManager.deselectCalculation(id);
    
    // Remove selected class from card
    card.classList.remove('selected');
    
    // Update button states
    this.updateButtonStates();
  }
  
  /**
   * Clear all selected calculations
   */
  clearSelection() {
    this.calculationManager.clearSelection();
    
    // Update UI
    const selectedCards = this.calculationsList.querySelectorAll('.calculation-card.selected');
    selectedCards.forEach(card => {
      card.classList.remove('selected');
      const checkbox = card.querySelector('.select-checkbox');
      checkbox.checked = false;
    });
    
    // Update button states
    this.updateButtonStates();
  }
  
  /**
   * Update button states based on selection
   */
  updateButtonStates() {
    const selectedCount = this.calculationManager.selectedCalculations.length;
    
    // Compare button
    this.compareButton.disabled = selectedCount < 2;
    
    // Clear selection button
    this.clearSelectionButton.disabled = selectedCount === 0;
  }
  
  /**
   * Show comparison view
   */
  showComparison() {
    const result = this.calculationManager.compareCalculations();
    
    if (!result.success) {
      alert(result.message);
      return;
    }
    
    // Switch to comparison mode
    this.isComparisonMode = true;
    this.calculationsList.style.display = 'none';
    this.comparisonView.style.display = 'block';
    
    // Render comparison
    this.renderComparison(result.comparison);
    
    // Notify parent component
    this.onCompareCalculations(result.comparison);
  }
  
  /**
   * Hide comparison view
   */
  hideComparison() {
    // Switch back to list mode
    this.isComparisonMode = false;
    this.calculationsList.style.display = 'block';
    this.comparisonView.style.display = 'none';
  }
  
  /**
   * Render comparison view
   * @param {Object} comparison - Comparison data
   */
  renderComparison(comparison) {
    const { calculations, metrics, differences } = comparison;
    
    // Format currency
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    
    // Create table header
    let tableHtml = `
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Metric</th>
            ${metrics.map(m => `<th>${m.name || 'Unnamed'}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;
    
    // Add rows for each metric
    const metricRows = [
      { label: 'Loan Amount', key: 'loanAmount', format: val => formatter.format(val) },
      { label: 'Interest Rate', key: 'interestRate', format: val => `${val}%` },
      { label: 'Term', key: 'term', format: val => `${val} months` },
      { label: 'Payment Frequency', key: 'paymentFrequency', format: val => val },
      { label: 'Payment Amount', key: 'paymentAmount', format: val => formatter.format(val) },
      { label: 'Total Interest', key: 'totalInterest', format: val => formatter.format(val) },
      { label: 'Total Payment', key: 'totalPayment', format: val => formatter.format(val) }
    ];
    
    metricRows.forEach(row => {
      tableHtml += `
        <tr>
          <td>${row.label}</td>
          ${metrics.map(m => `<td>${row.format(m[row.key])}</td>`).join('')}
        </tr>
      `;
    });
    
    // Add difference rows if there are multiple calculations
    if (metrics.length > 1) {
      tableHtml += `
        <tr class="comparison-separator">
          <td colspan="${metrics.length + 1}">Differences (compared to ${metrics[0].name || 'first calculation'})</td>
        </tr>
      `;
      
      // Skip the first calculation (baseline)
      for (let i = 1; i < metrics.length; i++) {
        const metric = metrics[i];
        const diff = differences[metric.id];
        
        if (diff) {
          tableHtml += `
            <tr>
              <td>Monthly Payment Difference</td>
              ${Array(i).fill('<td></td>').join('')}
              <td class="${diff.paymentDifference < 0 ? 'positive' : 'negative'}">${formatter.format(diff.paymentDifference)}</td>
              ${Array(metrics.length - i - 1).fill('<td></td>').join('')}
            </tr>
            <tr>
              <td>Total Interest Difference</td>
              ${Array(i).fill('<td></td>').join('')}
              <td class="${diff.interestDifference < 0 ? 'positive' : 'negative'}">${formatter.format(diff.interestDifference)}</td>
              ${Array(metrics.length - i - 1).fill('<td></td>').join('')}
            </tr>
            <tr>
              <td>Total Payment Difference</td>
              ${Array(i).fill('<td></td>').join('')}
              <td class="${diff.totalPaymentDifference < 0 ? 'positive' : 'negative'}">${formatter.format(diff.totalPaymentDifference)}</td>
              ${Array(metrics.length - i - 1).fill('<td></td>').join('')}
            </tr>
          `;
        }
      }
    }
    
    tableHtml += `
        </tbody>
      </table>
    `;
    
    this.comparisonContent.innerHTML = tableHtml;
  }
  
  /**
   * Refresh the component
   */
  refresh() {
    this.loadCalculations();
  }
}

export default SavedCalculationsManager;