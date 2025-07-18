/**
 * Tests for Charts Component
 * Implements requirement 2.3
 */

import Charts from '../src/js/components/charts';
import Loan from '../src/js/models/loan.model';
import { AmortizationSchedule } from '../src/js/models/amortization.model';

// Mock Chart.js
jest.mock('chart.js/auto', () => {
  return {
    Chart: jest.fn().mockImplementation(() => {
      return {
        destroy: jest.fn(),
        update: jest.fn(),
        resize: jest.fn(),
        options: {
          scales: {
            x: {
              ticks: {},
              title: {}
            },
            y: {
              ticks: {},
              title: {}
            }
          },
          plugins: {
            legend: {
              labels: {}
            }
          }
        },
        config: {
          type: 'line',
          data: {
            datasets: [
              { borderColor: '#000000' }
            ]
          }
        }
      };
    })
  };
});

describe('Charts Component', () => {
  let container;
  let charts;
  
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div id="charts-container"></div>
    `;
    
    container = document.getElementById('charts-container');
    
    // Create component
    charts = new Charts({
      container
    });
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });
  
  test('should initialize with chart containers', () => {
    expect(container.querySelector('#principal-interest-chart')).not.toBeNull();
    expect(container.querySelector('#payment-breakdown-chart')).not.toBeNull();
    expect(container.querySelector('#comparison-chart')).not.toBeNull();
    expect(container.querySelector('#inflation-impact-chart')).not.toBeNull();
  });
  
  test('should render principal vs interest chart', () => {
    // Create test loan
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      downPayment: 40000
    });
    
    // Create mock amortization schedule with sample payments
    const amortizationSchedule = {
      payments: Array(360).fill().map((_, index) => ({
        number: index + 1,
        principal: 500,
        interest: 500 - (index * 1.2),
        balance: 200000 - (index * 500)
      })),
      totalInterest: 100000,
      totalPayment: 300000
    };
    
    // Render chart
    charts.renderPrincipalVsInterestChart({ loan, amortizationSchedule });
    
    // Check if chart container is visible
    const chartContainer = container.querySelector('#principal-interest-chart');
    expect(chartContainer.style.display).toBe('block');
    
    // Verify Chart.js was called
    expect(require('chart.js/auto').Chart).toHaveBeenCalled();
    
    // Verify chart instance was stored
    expect(charts.chartInstances.principalVsInterest).not.toBeNull();
  });
  
  test('should render payment breakdown pie chart', () => {
    // Create test loan
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      downPayment: 40000,
      totalLoanAmount: 160000
    });
    
    // Create mock amortization schedule
    const amortizationSchedule = {
      totalInterest: 100000,
      totalPayment: 260000
    };
    
    // Render chart
    charts.renderPaymentBreakdownPieChart({ loan, amortizationSchedule });
    
    // Check if chart container is visible
    const chartContainer = container.querySelector('#payment-breakdown-chart');
    expect(chartContainer.style.display).toBe('block');
    
    // Verify Chart.js was called
    expect(require('chart.js/auto').Chart).toHaveBeenCalled();
    
    // Verify chart instance was stored
    expect(charts.chartInstances.paymentBreakdown).not.toBeNull();
  });
  
  test('should render comparison chart', () => {
    // Create test scenarios
    const scenarios = [
      {
        id: 'scenario1',
        name: 'Original Loan',
        loan: new Loan({
          principal: 200000,
          interestRate: 4.5,
          term: 360,
          paymentAmount: 1013
        }),
        amortizationSchedule: {
          totalInterest: 100000,
          totalPayment: 300000
        }
      },
      {
        id: 'scenario2',
        name: 'Refinanced Loan',
        loan: new Loan({
          principal: 200000,
          interestRate: 3.5,
          term: 360,
          paymentAmount: 898
        }),
        amortizationSchedule: {
          totalInterest: 80000,
          totalPayment: 280000
        }
      }
    ];
    
    // Render chart
    charts.renderComparisonChart(scenarios);
    
    // Check if chart container is visible
    const chartContainer = container.querySelector('#comparison-chart');
    expect(chartContainer.style.display).toBe('block');
    
    // Verify Chart.js was called
    expect(require('chart.js/auto').Chart).toHaveBeenCalled();
    
    // Verify chart instance was stored
    expect(charts.chartInstances.comparison).not.toBeNull();
  });
  
  test('should render inflation impact chart', () => {
    // Create test loan
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      downPayment: 40000,
      inflationRate: 2.5
    });
    
    // Create mock amortization schedule
    const amortizationSchedule = {
      totalInterest: 100000,
      totalPayment: 300000
    };
    
    // Create mock inflation-adjusted data
    const inflationAdjusted = {
      summary: {
        inflationRate: 2.5,
        totalOriginalPayment: 300000,
        totalInflationAdjustedPayment: 220000,
        savingsFromInflation: 80000
      },
      payments: Array(360).fill().map((_, index) => ({
        number: index + 1,
        originalAmount: 1000,
        inflationAdjustedAmount: 1000 * Math.pow(0.9975, index),
        inflationFactor: Math.pow(0.9975, index)
      }))
    };
    
    // Render chart
    charts.renderInflationImpactChart({ loan, amortizationSchedule, inflationAdjusted });
    
    // Check if chart container is visible
    const chartContainer = container.querySelector('#inflation-impact-chart');
    expect(chartContainer.style.display).toBe('block');
    
    // Verify Chart.js was called
    expect(require('chart.js/auto').Chart).toHaveBeenCalled();
    
    // Verify chart instance was stored
    expect(charts.chartInstances.inflationImpact).not.toBeNull();
  });
  
  test('should update chart theme', () => {
    // Create test loan
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360
    });
    
    // Create mock amortization schedule
    const amortizationSchedule = {
      payments: Array(360).fill().map((_, index) => ({
        number: index + 1,
        principal: 500,
        interest: 500 - (index * 1.2),
        balance: 200000 - (index * 500)
      })),
      totalInterest: 100000,
      totalPayment: 300000
    };
    
    // Render chart
    charts.renderPrincipalVsInterestChart({ loan, amortizationSchedule });
    
    // Update theme to dark
    charts.updateChartTheme('dark');
    
    // Verify theme was updated
    expect(charts.theme).toBe('dark');
    
    // Verify chart was updated
    expect(charts.chartInstances.principalVsInterest.update).toHaveBeenCalled();
  });
  
  test('should clear all charts', () => {
    // Create test loan
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360
    });
    
    // Create mock amortization schedule
    const amortizationSchedule = {
      payments: [],
      totalInterest: 100000,
      totalPayment: 300000
    };
    
    // Render charts
    charts.renderPrincipalVsInterestChart({ loan, amortizationSchedule });
    charts.renderPaymentBreakdownPieChart({ loan, amortizationSchedule });
    
    // Clear charts
    charts.clear();
    
    // Verify chart instances were destroyed
    expect(charts.chartInstances.principalVsInterest).toBeNull();
    expect(charts.chartInstances.paymentBreakdown).toBeNull();
    
    // Verify chart containers are hidden
    expect(container.querySelector('#principal-interest-chart').style.display).toBe('none');
    expect(container.querySelector('#payment-breakdown-chart').style.display).toBe('none');
  });
  
  test('should resize charts on window resize', () => {
    // Create test loan
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360
    });
    
    // Create mock amortization schedule
    const amortizationSchedule = {
      payments: [],
      totalInterest: 100000,
      totalPayment: 300000
    };
    
    // Render chart
    charts.renderPrincipalVsInterestChart({ loan, amortizationSchedule });
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    
    // Verify chart was resized
    expect(charts.chartInstances.principalVsInterest.resize).toHaveBeenCalled();
  });
  
  test('should handle missing data gracefully', () => {
    // Attempt to render chart with no data
    charts.renderPrincipalVsInterestChart();
    
    // Verify no chart was created
    expect(charts.chartInstances.principalVsInterest).toBeNull();
    
    // Attempt to render with partial data
    charts.renderPrincipalVsInterestChart({ loan: {} });
    
    // Verify no chart was created
    expect(charts.chartInstances.principalVsInterest).toBeNull();
  });
});