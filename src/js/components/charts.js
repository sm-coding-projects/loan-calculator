/**
 * Charts Component
 * Creates interactive charts for loan data visualization
 * Implements requirement 2.3
 */

import { Chart } from 'chart.js/auto';
import animationManager from '../utils/animation-manager.js';

class Charts {
  /**
   * Create a new charts component
   * @param {Object} options - Configuration options
   * @param {HTMLElement} [options.container] - Container element
   * @param {Object} [options.colorScheme] - Custom color scheme
   */
  constructor(options = {}) {
    this.container = options.container || document.getElementById('charts-container');
    this.colorScheme = options.colorScheme || {
      principal: '#007bff',
      interest: '#dc3545',
      balance: '#28a745',
      comparison: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'],
    };

    this.chartInstances = {
      principalVsInterest: null,
      paymentBreakdown: null,
      comparison: null,
    };

    this.theme = 'light';

    this.init();
  }

  /**
   * Initialize the component
   */
  init() {
    if (!this.container) {
      console.error('Charts container not found');
      return;
    }

    // Create chart containers if they don't exist
    this._createChartContainers();

    // Register event listeners
    this._initEventListeners();
  }

  /**
   * Create chart containers if they don't exist
   * @private
   */
  _createChartContainers() {
    // Check if containers already exist
    if (!this.container.querySelector('#principal-interest-chart')) {
      const principalInterestContainer = document.createElement('div');
      principalInterestContainer.id = 'principal-interest-chart';
      principalInterestContainer.className = 'chart-container';
      principalInterestContainer.innerHTML = `
        <div class="chart-title">Principal vs. Interest Over Time</div>
        <canvas></canvas>
        <div class="chart-legend"></div>
      `;
      this.container.appendChild(principalInterestContainer);
    }

    if (!this.container.querySelector('#payment-breakdown-chart')) {
      const paymentBreakdownContainer = document.createElement('div');
      paymentBreakdownContainer.id = 'payment-breakdown-chart';
      paymentBreakdownContainer.className = 'chart-container';
      paymentBreakdownContainer.innerHTML = `
        <div class="chart-title">Payment Breakdown</div>
        <canvas></canvas>
        <div class="chart-legend"></div>
      `;
      this.container.appendChild(paymentBreakdownContainer);
    }

    if (!this.container.querySelector('#comparison-chart')) {
      const comparisonContainer = document.createElement('div');
      comparisonContainer.id = 'comparison-chart';
      comparisonContainer.className = 'chart-container';
      comparisonContainer.style.display = 'none'; // Hidden by default
      comparisonContainer.innerHTML = `
        <div class="chart-title">Loan Comparison</div>
        <canvas></canvas>
        <div class="chart-legend"></div>
      `;
      this.container.appendChild(comparisonContainer);
    }

    if (!this.container.querySelector('#inflation-impact-chart')) {
      const inflationImpactContainer = document.createElement('div');
      inflationImpactContainer.id = 'inflation-impact-chart';
      inflationImpactContainer.className = 'chart-container';
      inflationImpactContainer.style.display = 'none'; // Hidden by default
      inflationImpactContainer.innerHTML = `
        <div class="chart-title">Inflation Impact on Payments</div>
        <canvas></canvas>
        <div class="chart-legend"></div>
      `;
      this.container.appendChild(inflationImpactContainer);
    }
  }

  /**
   * Initialize event listeners
   * @private
   */
  _initEventListeners() {
    // Add responsive behavior for charts
    window.addEventListener('resize', () => {
      this._resizeCharts();
    });
  }

  /**
   * Resize charts when window size changes
   * @private
   */
  _resizeCharts() {
    // Update chart sizes if they exist
    Object.values(this.chartInstances).forEach((chart) => {
      if (chart) {
        chart.resize();
      }
    });
  }

  /**
   * Render principal vs interest chart
   * @param {Object} data - Calculation data
   * @param {Loan} data.loan - Loan object
   * @param {AmortizationSchedule} data.amortizationSchedule - Amortization schedule
   */
  renderPrincipalVsInterestChart(data) {
    if (!this.container || !data || !data.loan || !data.amortizationSchedule) {
      return;
    }

    const chartContainer = this.container.querySelector('#principal-interest-chart');
    if (!chartContainer) return;

    // Show the chart container
    chartContainer.style.display = 'block';

    // Get the canvas element
    const canvas = chartContainer.querySelector('canvas');
    if (!canvas) return;

    // Prepare data for the chart
    const { loan, amortizationSchedule } = data;
    const { payments } = amortizationSchedule;

    // We'll sample the payments to avoid too many data points
    // For loans with many payments, we'll sample to have around 60 data points
    const sampleInterval = Math.max(1, Math.floor(payments.length / 60));
    const sampledPayments = payments.filter((_, index) => index % sampleInterval === 0 || index === payments.length - 1);

    // Prepare datasets
    const labels = sampledPayments.map((payment) => payment.number);
    const principalData = sampledPayments.map((payment) => payment.principal);
    const interestData = sampledPayments.map((payment) => payment.interest);
    const balanceData = sampledPayments.map((payment) => payment.balance);

    // Destroy previous chart if it exists
    if (this.chartInstances.principalVsInterest) {
      this.chartInstances.principalVsInterest.destroy();
    }

    // Create the chart
    this.chartInstances.principalVsInterest = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Principal',
            data: principalData,
            backgroundColor: this.colorScheme.principal,
            borderColor: this.colorScheme.principal,
            borderWidth: 2,
            fill: false,
            tension: 0.1,
          },
          {
            label: 'Interest',
            data: interestData,
            backgroundColor: this.colorScheme.interest,
            borderColor: this.colorScheme.interest,
            borderWidth: 2,
            fill: false,
            tension: 0.1,
          },
          {
            label: 'Remaining Balance',
            data: balanceData,
            backgroundColor: this.colorScheme.balance,
            borderColor: this.colorScheme.balance,
            borderWidth: 2,
            fill: false,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(context.parsed.y);
                }
                return label;
              },
            },
          },
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 15,
            },
          },
          title: {
            display: false,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Payment Number',
            },
            ticks: {
              maxTicksLimit: 10,
            },
          },
          y: {
            title: {
              display: true,
              text: 'Amount ($)',
            },
            ticks: {
              callback(value) {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(value);
              },
            },
          },
        },
      },
    });

    // Apply theme
    this._applyChartTheme(this.chartInstances.principalVsInterest);

    // Animate chart reveal
    this._animateChartReveal(chartContainer, 'principal-interest');
  }

  /**
   * Render payment breakdown pie chart
   * @param {Object} data - Calculation data
   * @param {Loan} data.loan - Loan object
   * @param {AmortizationSchedule} data.amortizationSchedule - Amortization schedule
   */
  renderPaymentBreakdownPieChart(data) {
    if (!this.container || !data || !data.loan || !data.amortizationSchedule) {
      return;
    }

    const chartContainer = this.container.querySelector('#payment-breakdown-chart');
    if (!chartContainer) return;

    // Show the chart container
    chartContainer.style.display = 'block';

    // Get the canvas element
    const canvas = chartContainer.querySelector('canvas');
    if (!canvas) return;

    // Prepare data for the chart
    const { loan, amortizationSchedule } = data;
    const principal = loan.totalLoanAmount;
    const interest = amortizationSchedule.totalInterest;

    // Destroy previous chart if it exists
    if (this.chartInstances.paymentBreakdown) {
      this.chartInstances.paymentBreakdown.destroy();
    }

    // Create the chart
    this.chartInstances.paymentBreakdown = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['Principal', 'Interest'],
        datasets: [{
          data: [principal, interest],
          backgroundColor: [
            this.colorScheme.principal,
            this.colorScheme.interest,
          ],
          borderColor: [
            this.theme === 'dark' ? '#2c3034' : '#ffffff',
            this.theme === 'dark' ? '#2c3034' : '#ffffff',
          ],
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label(context) {
                const label = context.label || '';
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);

                return `${label}: ${new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(value)} (${percentage}%)`;
              },
            },
          },
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 15,
            },
          },
        },
      },
    });

    // Apply theme
    this._applyChartTheme(this.chartInstances.paymentBreakdown);

    // Animate chart reveal
    this._animateChartReveal(chartContainer, 'payment-breakdown');
  }

  /**
   * Render comparison chart for multiple loan scenarios
   * @param {Array} scenarios - Array of loan scenarios
   */
  renderComparisonChart(scenarios) {
    if (!this.container || !scenarios || scenarios.length < 2) {
      return;
    }

    const chartContainer = this.container.querySelector('#comparison-chart');
    if (!chartContainer) return;

    // Show the chart container
    chartContainer.style.display = 'block';

    // Get the canvas element
    const canvas = chartContainer.querySelector('canvas');
    if (!canvas) return;

    // Prepare data for the chart
    const labels = ['Monthly Payment', 'Total Interest', 'Total Payment'];
    const datasets = scenarios.map((scenario, index) => {
      const { loan, amortizationSchedule } = scenario;
      const monthlyPayment = loan.paymentAmount;
      const totalInterest = amortizationSchedule ? amortizationSchedule.totalInterest : loan.totalInterest;
      const totalPayment = amortizationSchedule ? amortizationSchedule.totalPayment : (loan.paymentAmount * loan.numberOfPayments);

      return {
        label: scenario.name || `Scenario ${index + 1}`,
        data: [monthlyPayment, totalInterest, totalPayment],
        backgroundColor: this.colorScheme.comparison[index % this.colorScheme.comparison.length],
        borderColor: this.theme === 'dark' ? '#2c3034' : '#ffffff',
        borderWidth: 1,
      };
    });

    // Destroy previous chart if it exists
    if (this.chartInstances.comparison) {
      this.chartInstances.comparison.destroy();
    }

    // Create the chart
    this.chartInstances.comparison = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(context.parsed.y);
                }
                return label;
              },
            },
          },
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 15,
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Metrics',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Amount ($)',
            },
            ticks: {
              callback(value) {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(value);
              },
            },
          },
        },
      },
    });

    // Apply theme
    this._applyChartTheme(this.chartInstances.comparison);
  }

  /**
   * Update chart theme
   * @param {string} theme - Theme name ('light' or 'dark')
   */
  updateChartTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      return;
    }

    this.theme = theme;

    // Update all charts
    Object.values(this.chartInstances).forEach((chart) => {
      if (chart) {
        this._applyChartTheme(chart);
      }
    });
  }

  /**
   * Apply theme to a chart
   * @param {Chart} chart - Chart instance
   * @private
   */
  _applyChartTheme(chart) {
    if (!chart) return;

    const isDark = this.theme === 'dark';
    const textColor = isDark ? '#e9ecef' : '#212529';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    // Update chart options
    if (chart.options.scales) {
      // For line and bar charts
      Object.values(chart.options.scales).forEach((scale) => {
        if (scale.ticks) {
          scale.ticks.color = textColor;
        }
        if (scale.title) {
          scale.title.color = textColor;
        }
        if (scale.grid) {
          scale.grid.color = gridColor;
        }
      });
    }

    // Update legend
    if (chart.options.plugins && chart.options.plugins.legend) {
      chart.options.plugins.legend.labels.color = textColor;
    }

    // Update border colors for pie/doughnut charts
    if (chart.config.type === 'pie' || chart.config.type === 'doughnut') {
      chart.data.datasets.forEach((dataset) => {
        dataset.borderColor = isDark ? '#2c3034' : '#ffffff';
      });
    }

    // Update the chart
    chart.update();
  }

  /**
   * Render inflation impact chart
   * @param {Object} data - Calculation data
   * @param {Loan} data.loan - Loan object
   * @param {AmortizationSchedule} data.amortizationSchedule - Amortization schedule
   * @param {Object} data.inflationAdjusted - Inflation-adjusted payment data
   */
  renderInflationImpactChart(data) {
    if (!this.container || !data || !data.loan || !data.amortizationSchedule || !data.inflationAdjusted) {
      return;
    }

    const chartContainer = this.container.querySelector('#inflation-impact-chart');
    if (!chartContainer) return;

    // Show the chart container
    chartContainer.style.display = 'block';

    // Get the canvas element
    const canvas = chartContainer.querySelector('canvas');
    if (!canvas) return;

    // Prepare data for the chart
    const { loan, amortizationSchedule, inflationAdjusted } = data;
    const { payments } = inflationAdjusted;

    // We'll sample the payments to avoid too many data points
    // For loans with many payments, we'll sample to have around 60 data points
    const sampleInterval = Math.max(1, Math.floor(payments.length / 60));
    const sampledPayments = payments.filter((_, index) => index % sampleInterval === 0 || index === payments.length - 1);

    // Prepare datasets
    const labels = sampledPayments.map((payment) => payment.number);
    const nominalPayments = sampledPayments.map((payment) => payment.originalAmount);
    const inflationAdjustedPayments = sampledPayments.map((payment) => payment.inflationAdjustedAmount);

    // Destroy previous chart if it exists
    if (this.chartInstances.inflationImpact) {
      this.chartInstances.inflationImpact.destroy();
    }

    // Create the chart
    this.chartInstances.inflationImpact = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Nominal Payment',
            data: nominalPayments,
            backgroundColor: this.colorScheme.principal,
            borderColor: this.colorScheme.principal,
            borderWidth: 2,
            fill: false,
            tension: 0.1,
          },
          {
            label: 'Inflation-Adjusted Payment',
            data: inflationAdjustedPayments,
            backgroundColor: this.colorScheme.balance,
            borderColor: this.colorScheme.balance,
            borderWidth: 2,
            fill: false,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(context.parsed.y);
                }
                return label;
              },
            },
          },
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 15,
            },
          },
          title: {
            display: true,
            text: `Inflation Rate: ${inflationAdjusted.summary.inflationRate}%`,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Payment Number',
            },
            ticks: {
              maxTicksLimit: 10,
            },
          },
          y: {
            title: {
              display: true,
              text: 'Payment Amount ($)',
            },
            ticks: {
              callback(value) {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(value);
              },
            },
          },
        },
      },
    });

    // Apply theme
    this._applyChartTheme(this.chartInstances.inflationImpact);

    // Add summary information below the chart
    const legendContainer = chartContainer.querySelector('.chart-legend');
    if (legendContainer) {
      const savings = inflationAdjusted.summary.savingsFromInflation;
      const originalTotal = inflationAdjusted.summary.totalOriginalPayment;
      const adjustedTotal = inflationAdjusted.summary.totalInflationAdjustedPayment;
      const savingsPercentage = (savings / originalTotal) * 100;

      legendContainer.innerHTML = `
        <div class="inflation-summary">
          <div class="summary-item">
            <span class="label">Total Nominal Payments:</span>
            <span class="value">${new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(originalTotal)}</span>
          </div>
          <div class="summary-item">
            <span class="label">Total Inflation-Adjusted Payments:</span>
            <span class="value">${new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(adjustedTotal)}</span>
          </div>
          <div class="summary-item highlight">
            <span class="label">Real Savings Due to Inflation:</span>
            <span class="value">${new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(savings)} (${savingsPercentage.toFixed(1)}%)</span>
          </div>
        </div>
      `;
    }
  }

  /**
   * Clear all charts
   */
  clear() {
    // Destroy all chart instances
    Object.keys(this.chartInstances).forEach((key) => {
      if (this.chartInstances[key]) {
        this.chartInstances[key].destroy();
        this.chartInstances[key] = null;
      }
    });

    // Hide chart containers
    const containers = [
      '#principal-interest-chart',
      '#payment-breakdown-chart',
      '#comparison-chart',
      '#inflation-impact-chart',
    ];

    containers.forEach((selector) => {
      const container = this.container.querySelector(selector);
      if (container) {
        container.style.display = 'none';
      }
    });
  }

  /**
   * Animate chart reveal with scale and fade effect
   * @param {HTMLElement} chartContainer - Chart container element
   * @param {string} chartType - Type of chart for specific animations
   * @private
   */
  _animateChartReveal(chartContainer, chartType) {
    if (!chartContainer) return;

    animationManager.respectfulAnimate(() => {
      // Set initial state
      chartContainer.style.opacity = '0';
      chartContainer.style.transform = 'scale(0.9) translateY(20px)';
      chartContainer.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

      // Animate reveal
      setTimeout(() => {
        chartContainer.style.opacity = '1';
        chartContainer.style.transform = 'scale(1) translateY(0)';
      }, 100);

      // Add chart-specific animations
      setTimeout(() => {
        this._addChartSpecificAnimations(chartContainer, chartType);
      }, 700);
    }, () => {
      // Fallback for reduced motion
      chartContainer.style.opacity = '1';
      chartContainer.style.transform = 'none';
    });
  }

  /**
   * Add chart-specific animations and interactions
   * @param {HTMLElement} chartContainer - Chart container element
   * @param {string} chartType - Type of chart
   * @private
   */
  _addChartSpecificAnimations(chartContainer, chartType) {
    // Add hover effects to chart container
    chartContainer.addEventListener('mouseenter', () => {
      if (!animationManager.prefersReducedMotion()) {
        chartContainer.style.transform = 'scale(1.02)';
        chartContainer.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
        chartContainer.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      }
    });

    chartContainer.addEventListener('mouseleave', () => {
      if (!animationManager.prefersReducedMotion()) {
        chartContainer.style.transform = 'scale(1)';
        chartContainer.style.boxShadow = '';
      }
    });

    // Add specific animations based on chart type
    switch (chartType) {
      case 'principal-interest':
        this._animatePrincipalInterestChart(chartContainer);
        break;
      case 'payment-breakdown':
        this._animatePaymentBreakdownChart(chartContainer);
        break;
      default:
        break;
    }
  }

  /**
   * Add specific animations for principal vs interest chart
   * @param {HTMLElement} chartContainer - Chart container element
   * @private
   */
  _animatePrincipalInterestChart(chartContainer) {
    // Add subtle pulse animation to highlight the crossover point
    const canvas = chartContainer.querySelector('canvas');
    if (canvas && this.chartInstances.principalVsInterest) {
      // Add a subtle glow effect that pulses occasionally
      setInterval(() => {
        if (!animationManager.prefersReducedMotion() && Math.random() < 0.1) {
          canvas.style.filter = 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))';
          setTimeout(() => {
            canvas.style.filter = '';
          }, 1000);
        }
      }, 5000);
    }
  }

  /**
   * Add specific animations for payment breakdown chart
   * @param {HTMLElement} chartContainer - Chart container element
   * @private
   */
  _animatePaymentBreakdownChart(chartContainer) {
    // Add rotation animation on hover for pie chart
    const canvas = chartContainer.querySelector('canvas');
    if (canvas) {
      chartContainer.addEventListener('mouseenter', () => {
        if (!animationManager.prefersReducedMotion()) {
          canvas.style.transform = 'rotate(2deg)';
          canvas.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }
      });

      chartContainer.addEventListener('mouseleave', () => {
        if (!animationManager.prefersReducedMotion()) {
          canvas.style.transform = 'rotate(0deg)';
        }
      });
    }
  }
}

export default Charts;
