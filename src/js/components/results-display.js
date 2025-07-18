/**
 * Results Display Component
 * Displays loan calculation results
 * Implements requirements 2.1, 2.3
 */

import * as formatters from '../utils/formatters.js';
import Charts from './charts.js';

class ResultsDisplay {
  /**
   * Create a new results display component
   * @param {Object} options - Configuration options
   * @param {HTMLElement} [options.container] - Container element
   * @param {Object} [options.formatters] - Custom formatters
   */
  constructor(options = {}) {
    // Handle both container and containerId options
    this.container = options.container
                    || (options.containerId ? document.getElementById(options.containerId) : null)
                    || document.getElementById('results-display');

    this.formatters = {
      currency: formatters.formatCurrency,
      percentage: formatters.formatPercentage,
      number: formatters.formatNumber,
      date: formatters.formatDate,
      duration: formatters.formatDuration,
      ...options.formatters,
    };

    // Store onSave callback if provided
    this.onSave = options.onSave || null;

    this.init();
  }

  /**
   * Initialize the component
   */
  init() {
    if (!this.container) {
      console.error('Results display container not found');
      return;
    }

    // Create initial structure
    this.container.innerHTML = `
      <div class="results-display">
        <div class="results-header">
          <h2>Loan Summary</h2>
          <div class="results-actions">
            <button class="btn-save" id="save-calculation">Save</button>
            <button class="btn-export" id="export-calculation">Export</button>
          </div>
        </div>
        <div class="results-content">
          <div class="results-summary" id="results-summary"></div>
          <div class="results-breakdown" id="results-breakdown"></div>
          <div class="results-charts" id="charts-container"></div>
        </div>
      </div>
    `;

    // Initialize charts component
    this.charts = new Charts({
      container: this.container.querySelector('#charts-container'),
    });

    // Initialize event listeners
    this._initEventListeners();
  }

  /**
   * Initialize event listeners
   * @private
   */
  _initEventListeners() {
    const saveButton = this.container.querySelector('#save-calculation');
    const exportButton = this.container.querySelector('#export-calculation');

    if (saveButton) {
      saveButton.addEventListener('click', () => {
        // Use the onSave callback if provided
        if (typeof this.onSave === 'function' && this._currentLoan && this._currentAmortizationSchedule) {
          this.onSave(this._currentLoan, this._currentAmortizationSchedule);
        } else {
          console.log('Save calculation clicked, but no onSave handler or loan data available');
        }
      });
    }

    if (exportButton) {
      exportButton.addEventListener('click', () => {
        // This will be implemented in a future task
        console.log('Export calculation clicked');
      });
    }
  }

  /**
   * Render calculation results
   * @param {Object} calculationResults - Calculation results object
   * @param {Loan} calculationResults.loan - Loan object
   * @param {AmortizationSchedule} [calculationResults.amortizationSchedule] - Amortization schedule
   * @param {Object} [calculationResults.inflationAdjusted] - Inflation-adjusted payment data
   * @param {Array} [calculationResults.comparisonScenarios] - Array of comparison scenarios
   */
  render(calculationResults) {
    if (!this.container || !calculationResults || !calculationResults.loan) {
      return;
    }

    const {
      loan, amortizationSchedule, inflationAdjusted, comparisonScenarios,
    } = calculationResults;

    // Store current loan and amortization schedule for save functionality
    this._currentLoan = loan;
    this._currentAmortizationSchedule = amortizationSchedule;

    // Prepare summary data
    const summary = {
      loanAmount: loan.totalLoanAmount,
      paymentAmount: loan.paymentAmount,
      totalInterest: amortizationSchedule ? amortizationSchedule.totalInterest : loan.totalInterest,
      totalPayment: amortizationSchedule ? amortizationSchedule.totalPayment : (loan.paymentAmount * loan.numberOfPayments),
      term: loan.term,
      interestRate: loan.interestRate,
      paymentFrequency: loan.paymentFrequency,
      payoffDate: amortizationSchedule ? amortizationSchedule.payoffDate : loan.payoffDate,
      numberOfPayments: loan.numberOfPayments,
      inflationRate: loan.inflationRate,
      inflationAdjusted: inflationAdjusted ? {
        totalPayment: inflationAdjusted.summary.totalInflationAdjustedPayment,
        totalInterest: inflationAdjusted.summary.totalInflationAdjustedInterest,
        savingsFromInflation: inflationAdjusted.summary.savingsFromInflation,
      } : null,
    };

    // Prepare payment breakdown data
    const breakdown = {
      principal: loan.totalLoanAmount,
      interest: summary.totalInterest,
      total: summary.totalPayment,
      interestRatio: summary.totalInterest / summary.totalPayment,
      principalRatio: loan.totalLoanAmount / summary.totalPayment,
    };

    // Display results
    this.displaySummary(summary);
    this.displayPaymentBreakdown(breakdown);

    // Render charts if we have amortization schedule
    if (this.charts && amortizationSchedule) {
      // Clear any existing charts
      this.charts.clear();

      // Render principal vs interest chart
      this.charts.renderPrincipalVsInterestChart({ loan, amortizationSchedule });

      // Render payment breakdown pie chart
      this.charts.renderPaymentBreakdownPieChart({ loan, amortizationSchedule });

      // Render comparison chart if we have comparison scenarios
      if (comparisonScenarios && comparisonScenarios.length > 0) {
        // Add current calculation as first scenario if not already included
        const scenarios = [{
          id: 'current',
          name: loan.name || 'Current Calculation',
          loan,
          amortizationSchedule,
        }];

        // Add other scenarios
        comparisonScenarios.forEach((scenario) => {
          if (scenario.id !== 'current') {
            scenarios.push(scenario);
          }
        });

        // Only render if we have at least 2 scenarios
        if (scenarios.length >= 2) {
          this.charts.renderComparisonChart(scenarios);
        }
      }
    }

    // Show the results container
    this.container.style.display = 'block';
  }

  /**
   * Display loan summary information
   * @param {Object} summary - Summary data
   */
  displaySummary(summary) {
    const summaryContainer = this.container.querySelector('#results-summary');
    if (!summaryContainer) return;

    // Format values
    const formattedValues = {
      loanAmount: this.formatters.currency(summary.loanAmount),
      paymentAmount: this.formatters.currency(summary.paymentAmount),
      totalInterest: this.formatters.currency(summary.totalInterest),
      totalPayment: this.formatters.currency(summary.totalPayment),
      term: this.formatters.duration(summary.term),
      interestRate: this.formatters.percentage(summary.interestRate / 100),
      payoffDate: this.formatters.date(summary.payoffDate),
      numberOfPayments: summary.numberOfPayments,
    };

    // Format inflation-adjusted values if available
    let inflationSection = '';
    if (summary.inflationAdjusted && summary.inflationRate > 0) {
      const inflationValues = {
        inflationRate: this.formatters.percentage(summary.inflationRate / 100),
        totalAdjustedPayment: this.formatters.currency(summary.inflationAdjusted.totalPayment),
        savingsFromInflation: this.formatters.currency(summary.inflationAdjusted.savingsFromInflation),
        savingsPercentage: this.formatters.percentage(summary.inflationAdjusted.savingsFromInflation / summary.totalPayment),
      };

      inflationSection = `
        <div class="inflation-section">
          <h3>Inflation-Adjusted Values (${inflationValues.inflationRate} inflation)</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Inflation-Adjusted Total Payment</div>
              <div class="summary-value">${inflationValues.totalAdjustedPayment}</div>
            </div>
            <div class="summary-item highlight">
              <div class="summary-label">Real Savings Due to Inflation</div>
              <div class="summary-value">${inflationValues.savingsFromInflation} (${inflationValues.savingsPercentage})</div>
            </div>
          </div>
        </div>
      `;
    }

    // Get payment frequency description
    const paymentFrequencyMap = {
      monthly: 'Monthly',
      'bi-weekly': 'Bi-Weekly',
      weekly: 'Weekly',
    };

    const paymentFrequency = paymentFrequencyMap[summary.paymentFrequency] || 'Monthly';

    // Create summary HTML
    const summaryHtml = `
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-label">${paymentFrequency} Payment</div>
          <div class="summary-value highlight">${formattedValues.paymentAmount}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Loan Amount</div>
          <div class="summary-value">${formattedValues.loanAmount}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Interest</div>
          <div class="summary-value">${formattedValues.totalInterest}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Payment</div>
          <div class="summary-value">${formattedValues.totalPayment}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Loan Term</div>
          <div class="summary-value">${formattedValues.term}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Interest Rate</div>
          <div class="summary-value">${formattedValues.interestRate}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Number of Payments</div>
          <div class="summary-value">${formattedValues.numberOfPayments}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Payoff Date</div>
          <div class="summary-value">${formattedValues.payoffDate}</div>
        </div>
      </div>
      ${inflationSection}
    `;

    summaryContainer.innerHTML = summaryHtml;

    // Add interest rate indicator
    this._addInterestRateIndicator(summary.interestRate);
  }

  /**
   * Add visual indicator for interest rate
   * @param {number} interestRate - Interest rate
   * @private
   */
  _addInterestRateIndicator(interestRate) {
    const interestRateElement = this.container.querySelector('.summary-item:nth-child(6) .summary-value');
    if (!interestRateElement) return;

    // Remove any existing indicators
    interestRateElement.classList.remove('rate-low', 'rate-medium', 'rate-high');

    // Add indicator based on rate
    if (interestRate < 4) {
      interestRateElement.classList.add('rate-low');
      interestRateElement.setAttribute('title', 'This is a low interest rate');
    } else if (interestRate < 7) {
      interestRateElement.classList.add('rate-medium');
      interestRateElement.setAttribute('title', 'This is an average interest rate');
    } else {
      interestRateElement.classList.add('rate-high');
      interestRateElement.setAttribute('title', 'This is a high interest rate');
    }
  }

  /**
   * Display payment breakdown with visual indicators
   * @param {Object} breakdown - Payment breakdown data
   */
  displayPaymentBreakdown(breakdown) {
    const breakdownContainer = this.container.querySelector('#results-breakdown');
    if (!breakdownContainer) return;

    // Format values
    const formattedValues = {
      principal: this.formatters.currency(breakdown.principal),
      interest: this.formatters.currency(breakdown.interest),
      total: this.formatters.currency(breakdown.total),
      interestPercentage: this.formatters.percentage(breakdown.interestRatio),
      principalPercentage: this.formatters.percentage(breakdown.principalRatio),
    };

    // Calculate percentages for visual representation
    const principalPercent = Math.round(breakdown.principalRatio * 100);
    const interestPercent = Math.round(breakdown.interestRatio * 100);

    // Create breakdown HTML
    const breakdownHtml = `
      <h3>Payment Breakdown</h3>
      <div class="breakdown-chart">
        <div class="breakdown-bar">
          <div class="breakdown-principal" style="width: ${principalPercent}%" title="Principal: ${formattedValues.principalPercentage}">
            <span class="breakdown-label">Principal</span>
          </div>
          <div class="breakdown-interest" style="width: ${interestPercent}%" title="Interest: ${formattedValues.interestPercentage}">
            <span class="breakdown-label">Interest</span>
          </div>
        </div>
        <div class="breakdown-legend">
          <div class="legend-item">
            <div class="legend-color principal-color"></div>
            <div class="legend-label">Principal: ${formattedValues.principal} (${formattedValues.principalPercentage})</div>
          </div>
          <div class="legend-item">
            <div class="legend-color interest-color"></div>
            <div class="legend-label">Interest: ${formattedValues.interest} (${formattedValues.interestPercentage})</div>
          </div>
        </div>
      </div>
      <div class="breakdown-total">
        <span>Total Payment: ${formattedValues.total}</span>
      </div>
    `;

    breakdownContainer.innerHTML = breakdownHtml;
  }

  /**
   * Clear all results
   */
  clear() {
    if (!this.container) return;

    const summaryContainer = this.container.querySelector('#results-summary');
    const breakdownContainer = this.container.querySelector('#results-breakdown');

    if (summaryContainer) {
      summaryContainer.innerHTML = '';
    }

    if (breakdownContainer) {
      breakdownContainer.innerHTML = '';
    }

    // Clear charts if they exist
    if (this.charts) {
      this.charts.clear();
    }

    // Hide the results container
    this.container.style.display = 'none';
  }

  /**
   * Update results with new calculation
   * @param {Object} calculationResults - Calculation results object
   */
  update(calculationResults) {
    this.render(calculationResults);
  }

  /**
   * Update results with loan and amortization schedule
   * @param {Loan} loan - Loan object
   * @param {AmortizationSchedule} amortizationSchedule - Amortization schedule
   * @param {Object} [inflationAdjusted] - Inflation-adjusted payment data
   */
  updateResults(loan, amortizationSchedule, inflationAdjusted = null) {
    this.render({
      loan,
      amortizationSchedule,
      inflationAdjusted,
    });
  }
}

export default ResultsDisplay;
