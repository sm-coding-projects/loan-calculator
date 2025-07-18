/**
 * Tests for Results Display Component - Inflation Adjustment Feature
 * Implements requirement 5.6
 */

import ResultsDisplay from '../src/js/components/results-display';
import Loan from '../src/js/models/loan.model';
import { AmortizationSchedule } from '../src/js/models/amortization.model';
import Charts from '../src/js/components/charts';

// Mock Charts class
jest.mock('../src/js/components/charts', () => {
  return jest.fn().mockImplementation(() => {
    return {
      renderPrincipalVsInterestChart: jest.fn(),
      renderPaymentBreakdownPieChart: jest.fn(),
      renderComparisonChart: jest.fn(),
      renderInflationImpactChart: jest.fn(),
      updateChartTheme: jest.fn(),
      clear: jest.fn()
    };
  });
});

// Mock formatters
const mockFormatters = {
  currency: jest.fn(val => `$${val.toFixed(2)}`),
  percentage: jest.fn(val => `${(val * 100).toFixed(2)}%`),
  number: jest.fn(val => val.toFixed(2)),
  date: jest.fn(() => '01/01/2025'),
  duration: jest.fn(months => `${Math.floor(months / 12)} years ${months % 12} months`)
};

describe('ResultsDisplay Component - Inflation Adjustment', () => {
  let container;
  let resultsDisplay;
  
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div id="results-display"></div>
    `;
    
    container = document.getElementById('results-display');
    
    // Create component with mock formatters
    resultsDisplay = new ResultsDisplay({
      container,
      formatters: mockFormatters
    });
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });
  
  test('should display inflation-adjusted values when provided', () => {
    // Create test loan with inflation rate
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      downPayment: 40000,
      inflationRate: 2.5
    });
    
    // Create amortization schedule
    const amortizationSchedule = new AmortizationSchedule(loan);
    
    // Create mock inflation-adjusted data
    const inflationAdjusted = {
      summary: {
        inflationRate: 2.5,
        totalOriginalPayment: 300000,
        totalInflationAdjustedPayment: 220000,
        totalInflationAdjustedInterest: 60000,
        savingsFromInflation: 80000
      },
      payments: [
        { number: 1, originalAmount: 1000, inflationAdjustedAmount: 1000, inflationFactor: 1 },
        { number: 120, originalAmount: 1000, inflationAdjustedAmount: 780, inflationFactor: 0.78 }
      ]
    };
    
    // Render results with inflation data
    resultsDisplay.render({ loan, amortizationSchedule, inflationAdjusted });
    
    // Check if inflation section is displayed
    const inflationSection = container.querySelector('.inflation-section');
    expect(inflationSection).not.toBeNull();
    expect(inflationSection.textContent).toContain('Inflation-Adjusted Values');
    expect(inflationSection.textContent).toContain('2.5');
    
    // Check if inflation-adjusted values are displayed
    expect(inflationSection.textContent).toContain('Inflation-Adjusted Total Payment');
    expect(inflationSection.textContent).toContain('Real Savings Due to Inflation');
    
    // Verify formatters were called with correct values
    expect(mockFormatters.percentage).toHaveBeenCalledWith(0.025); // 2.5%
    expect(mockFormatters.currency).toHaveBeenCalledWith(220000); // Adjusted payment
    expect(mockFormatters.currency).toHaveBeenCalledWith(80000); // Savings
  });
  
  test('should not display inflation section when inflation rate is zero', () => {
    // Create test loan with zero inflation rate
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      downPayment: 40000,
      inflationRate: 0
    });
    
    // Create amortization schedule
    const amortizationSchedule = new AmortizationSchedule(loan);
    
    // Create mock inflation-adjusted data with zero inflation
    const inflationAdjusted = {
      summary: {
        inflationRate: 0,
        totalOriginalPayment: 300000,
        totalInflationAdjustedPayment: 300000,
        totalInflationAdjustedInterest: 100000,
        savingsFromInflation: 0
      },
      payments: [
        { number: 1, originalAmount: 1000, inflationAdjustedAmount: 1000, inflationFactor: 1 },
        { number: 120, originalAmount: 1000, inflationAdjustedAmount: 1000, inflationFactor: 1 }
      ]
    };
    
    // Render results with inflation data
    resultsDisplay.render({ loan, amortizationSchedule, inflationAdjusted });
    
    // Check that inflation section is not displayed
    const inflationSection = container.querySelector('.inflation-section');
    expect(inflationSection).toBeNull();
  });
  
  test('should render inflation impact chart when inflation data is provided', () => {
    // Create test loan with inflation rate
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      downPayment: 40000,
      inflationRate: 2.5
    });
    
    // Create amortization schedule
    const amortizationSchedule = new AmortizationSchedule(loan);
    
    // Create mock inflation-adjusted data
    const inflationAdjusted = {
      summary: {
        inflationRate: 2.5,
        totalOriginalPayment: 300000,
        totalInflationAdjustedPayment: 220000,
        totalInflationAdjustedInterest: 60000,
        savingsFromInflation: 80000
      },
      payments: [
        { number: 1, originalAmount: 1000, inflationAdjustedAmount: 1000, inflationFactor: 1 },
        { number: 120, originalAmount: 1000, inflationAdjustedAmount: 780, inflationFactor: 0.78 }
      ]
    };
    
    // Render results with inflation data
    resultsDisplay.render({ loan, amortizationSchedule, inflationAdjusted });
    
    // Verify inflation impact chart was rendered
    expect(resultsDisplay.charts.renderInflationImpactChart).toHaveBeenCalledWith({
      loan, amortizationSchedule, inflationAdjusted
    });
  });
  
  test('should not render inflation impact chart when inflation data is not provided', () => {
    // Create test loan without inflation rate
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      downPayment: 40000
    });
    
    // Create amortization schedule
    const amortizationSchedule = new AmortizationSchedule(loan);
    
    // Render results without inflation data
    resultsDisplay.render({ loan, amortizationSchedule });
    
    // Verify inflation impact chart was not rendered
    expect(resultsDisplay.charts.renderInflationImpactChart).not.toHaveBeenCalled();
  });
  
  test('should format inflation savings percentage correctly', () => {
    // Create test loan with inflation rate
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      downPayment: 40000,
      inflationRate: 2.5
    });
    
    // Create amortization schedule
    const amortizationSchedule = new AmortizationSchedule(loan);
    
    // Create mock inflation-adjusted data with known values
    const inflationAdjusted = {
      summary: {
        inflationRate: 2.5,
        totalOriginalPayment: 400000,
        totalInflationAdjustedPayment: 300000,
        totalInflationAdjustedInterest: 100000,
        savingsFromInflation: 100000 // 25% of original payment
      },
      payments: []
    };
    
    // Render results with inflation data
    resultsDisplay.render({ loan, amortizationSchedule, inflationAdjusted });
    
    // Verify percentage formatter was called with correct value (0.25 for 25%)
    expect(mockFormatters.percentage).toHaveBeenCalledWith(0.25);
  });
});