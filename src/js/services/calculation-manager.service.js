/**
 * Calculation Manager Service
 * Manages saved loan calculations with naming, organization, and comparison features
 * Implements requirements 1.4, 3.3
 */

import StorageService from './storage.service.js';
import Loan from '../models/loan.model.js';
import { AmortizationSchedule } from '../models/amortization.model.js';

class CalculationManagerService {
  /**
   * Create a new calculation manager service
   * @param {Object} options - Configuration options
   * @param {StorageService} [options.storageService] - Storage service instance
   * @param {number} [options.maxComparisons] - Maximum number of calculations that can be compared
   */
  constructor(options = {}) {
    this.storageService = options.storageService || new StorageService();
    this.maxComparisons = options.maxComparisons || 3;
    this.selectedCalculations = [];
  }

  /**
   * Get all saved calculations with additional metadata
   * @returns {Array} Array of calculation objects with metadata
   */
  getAllCalculations() {
    const calculations = this.storageService.getCalculations();
    
    // Add additional metadata and sort by date (newest first)
    return calculations
      .map(calc => ({
        ...calc,
        isSelected: this.isSelected(calc.loan.id),
        formattedDate: this._formatDate(calc.savedAt)
      }))
      .sort((a, b) => b.savedAt - a.savedAt);
  }

  /**
   * Get a calculation by ID with full details
   * @param {string} id - Calculation ID
   * @returns {Object|null} Calculation object with loan and amortization schedule
   */
  getCalculation(id) {
    return this.storageService.getCalculationById(id);
  }

  /**
   * Save a calculation with a custom name
   * @param {Loan} loan - Loan object
   * @param {AmortizationSchedule} [amortizationSchedule] - Amortization schedule
   * @param {string} [name] - Custom name for the calculation
   * @returns {string} ID of the saved calculation
   */
  saveCalculation(loan, amortizationSchedule = null, name = null) {
    // Update the loan name if provided
    if (name && name.trim()) {
      loan = loan.update({ name: name.trim() });
    }
    
    return this.storageService.saveCalculation(loan, amortizationSchedule);
  }

  /**
   * Update an existing calculation
   * @param {string} id - Calculation ID
   * @param {Object} updates - Updates to apply
   * @param {string} [updates.name] - New name
   * @param {Object} [updates.loanUpdates] - Updates to apply to the loan
   * @returns {boolean} Success status
   */
  updateCalculation(id, updates = {}) {
    // Get the existing calculation
    const calculation = this.storageService.getCalculationById(id);
    if (!calculation) {
      return false;
    }

    // Apply updates
    let updatedLoan = calculation.loan;
    
    // Update name if provided
    if (updates.name) {
      updatedLoan = updatedLoan.update({ name: updates.name.trim() });
    }
    
    // Apply other loan updates if provided
    if (updates.loanUpdates) {
      updatedLoan = updatedLoan.update(updates.loanUpdates);
    }
    
    // Generate new amortization schedule if needed
    let updatedSchedule = calculation.amortizationSchedule;
    if (updates.loanUpdates) {
      updatedSchedule = new AmortizationSchedule(updatedLoan);
    }
    
    // Save the updated calculation
    return this.storageService.updateCalculation(id, updatedLoan, updatedSchedule);
  }

  /**
   * Delete a calculation
   * @param {string} id - Calculation ID
   * @returns {boolean} Success status
   */
  deleteCalculation(id) {
    // Remove from selected calculations if present
    this.deselectCalculation(id);
    
    // Delete from storage
    return this.storageService.deleteCalculation(id);
  }

  /**
   * Select a calculation for comparison
   * @param {string} id - Calculation ID
   * @returns {boolean} Success status
   */
  selectCalculation(id) {
    // Check if already selected
    if (this.isSelected(id)) {
      return true;
    }
    
    // Check if we've reached the maximum number of comparisons
    if (this.selectedCalculations.length >= this.maxComparisons) {
      return false;
    }
    
    // Add to selected calculations
    this.selectedCalculations.push(id);
    return true;
  }

  /**
   * Deselect a calculation
   * @param {string} id - Calculation ID
   * @returns {boolean} Success status
   */
  deselectCalculation(id) {
    const index = this.selectedCalculations.indexOf(id);
    if (index !== -1) {
      this.selectedCalculations.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Check if a calculation is selected
   * @param {string} id - Calculation ID
   * @returns {boolean} Whether the calculation is selected
   */
  isSelected(id) {
    return this.selectedCalculations.includes(id);
  }

  /**
   * Clear all selected calculations
   */
  clearSelection() {
    this.selectedCalculations = [];
  }

  /**
   * Get selected calculations for comparison
   * @returns {Array} Array of selected calculation objects
   */
  getSelectedCalculations() {
    return this.selectedCalculations.map(id => {
      const calculation = this.storageService.getCalculationById(id);
      return calculation ? {
        id,
        loan: calculation.loan,
        amortizationSchedule: calculation.amortizationSchedule,
        savedAt: calculation.savedAt
      } : null;
    }).filter(calc => calc !== null);
  }

  /**
   * Compare selected calculations
   * @returns {Object} Comparison results
   */
  compareCalculations() {
    const selected = this.getSelectedCalculations();
    
    if (selected.length < 2) {
      return {
        success: false,
        message: 'At least two calculations must be selected for comparison'
      };
    }
    
    // Create comparison data structure
    const comparison = {
      calculations: selected,
      metrics: this._generateComparisonMetrics(selected),
      differences: this._calculateDifferences(selected)
    };
    
    return {
      success: true,
      comparison
    };
  }

  /**
   * Generate metrics for comparison
   * @param {Array} calculations - Array of calculation objects
   * @returns {Object} Comparison metrics
   * @private
   */
  _generateComparisonMetrics(calculations) {
    return calculations.map(calc => {
      const loan = calc.loan;
      const schedule = calc.amortizationSchedule;
      
      return {
        id: calc.id,
        name: loan.name,
        principal: loan.principal,
        downPayment: loan.downPayment,
        loanAmount: loan.totalLoanAmount,
        interestRate: loan.interestRate,
        term: loan.term,
        paymentFrequency: loan.paymentFrequency,
        paymentAmount: loan.paymentAmount,
        totalInterest: schedule ? schedule.totalInterest : loan.totalInterest,
        totalPayment: schedule ? schedule.totalPayment : (loan.paymentAmount * loan.numberOfPayments),
        payoffDate: schedule ? schedule.payoffDate : loan.payoffDate
      };
    });
  }

  /**
   * Calculate differences between calculations
   * @param {Array} calculations - Array of calculation objects
   * @returns {Object} Differences between calculations
   * @private
   */
  _calculateDifferences(calculations) {
    if (calculations.length < 2) {
      return {};
    }
    
    // Use the first calculation as the baseline
    const baseline = calculations[0];
    const differences = {};
    
    // Compare each calculation to the baseline
    for (let i = 1; i < calculations.length; i++) {
      const current = calculations[i];
      const diff = {
        paymentDifference: current.loan.paymentAmount - baseline.loan.paymentAmount,
        interestDifference: 0,
        totalPaymentDifference: 0,
        termDifference: current.loan.term - baseline.loan.term
      };
      
      // Calculate interest and total payment differences if schedules are available
      if (baseline.amortizationSchedule && current.amortizationSchedule) {
        diff.interestDifference = 
          current.amortizationSchedule.totalInterest - baseline.amortizationSchedule.totalInterest;
        diff.totalPaymentDifference = 
          current.amortizationSchedule.totalPayment - baseline.amortizationSchedule.totalPayment;
      } else {
        // Estimate if schedules aren't available
        diff.interestDifference = 
          (current.loan.paymentAmount * current.loan.numberOfPayments) - 
          (baseline.loan.paymentAmount * baseline.loan.numberOfPayments);
        diff.totalPaymentDifference = diff.interestDifference;
      }
      
      differences[current.id] = diff;
    }
    
    return differences;
  }

  /**
   * Format a date for display
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   * @private
   */
  _formatDate(date) {
    if (!date) return '';
    
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Organize calculations by creating categories/folders (for future implementation)
   * @param {Array} calculationIds - Array of calculation IDs
   * @param {string} category - Category name
   * @returns {boolean} Success status
   */
  organizeCalculations(calculationIds, category) {
    // This is a placeholder for future implementation
    // Would require extending the storage service to support categories
    console.log(`Organizing calculations ${calculationIds.join(', ')} into category "${category}"`);
    return true;
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  getStorageStats() {
    return this.storageService.getStorageStats();
  }
}

export default CalculationManagerService;