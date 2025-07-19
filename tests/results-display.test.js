/**
 * Tests for Results Display Component
 */

import ResultsDisplay from '../src/js/components/results-display';
import Loan from '../src/js/models/loan.model';
import { AmortizationSchedule } from '../src/js/models/amortization.model';
import Charts from '../src/js/components/charts';

// Mock Charts class
jest.mock('../src/js/components/charts', () => jest.fn().mockImplementation(() => ({
  renderPrincipalVsInterestChart: jest.fn(),
  renderPaymentBreakdownPieChart: jest.fn(),
  renderComparisonChart: jest.fn(),
  updateChartTheme: jest.fn(),
  clear: jest.fn(),
})));

// Mock formatters
const mockFormatters = {
  currency: jest.fn((val) => `$${val.toFixed(2)}`),
  percentage: jest.fn((val) => `${(val * 100).toFixed(2)}%`),
  number: jest.fn((val) => val.toFixed(2)),
  date: jest.fn(() => '01/01/2025'),
  duration: jest.fn((months) => `${Math.floor(months / 12)} years ${months % 12} months`),
};

describe('ResultsDisplay Component', () => {
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
      formatters: mockFormatters,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('should initialize with default structure', () => {
    expect(container.querySelector('.results-display')).not.toBeNull();
    expect(container.querySelector('.results-header')).not.toBeNull();
    expect(container.querySelector('.results-content')).not.toBeNull();
    expect(container.querySelector('#results-summary')).not.toBeNull();
    expect(container.querySelector('#results-breakdown')).not.toBeNull();
  });

  test('should render loan calculation results', () => {
    // Create test loan
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      downPayment: 40000,
      additionalPayment: 100,
    });

    // Create amortization schedule
    const amortizationSchedule = new AmortizationSchedule(loan);

    // Render results
    resultsDisplay.render({ loan, amortizationSchedule });

    // Check summary section
    const summary = container.querySelector('#results-summary');
    expect(summary.textContent).toContain('Monthly Payment');
    expect(mockFormatters.currency).toHaveBeenCalledWith(loan.paymentAmount);

    // Check breakdown section
    const breakdown = container.querySelector('#results-breakdown');
    expect(breakdown.textContent).toContain('Payment Breakdown');
    expect(breakdown.querySelector('.breakdown-bar')).not.toBeNull();
    expect(breakdown.querySelector('.breakdown-principal')).not.toBeNull();
    expect(breakdown.querySelector('.breakdown-interest')).not.toBeNull();
  });

  test('should display interest rate indicators', () => {
    // Create loans with different interest rates
    const lowRateLoan = new Loan({
      principal: 200000,
      interestRate: 3.5,
      term: 360,
    });

    const mediumRateLoan = new Loan({
      principal: 200000,
      interestRate: 5.5,
      term: 360,
    });

    const highRateLoan = new Loan({
      principal: 200000,
      interestRate: 8.5,
      term: 360,
    });

    // Test low rate indicator
    resultsDisplay.render({ loan: lowRateLoan });
    let interestRateElement = container.querySelector('.summary-item:nth-child(6) .summary-value');
    expect(interestRateElement.classList.contains('rate-low')).toBe(true);

    // Test medium rate indicator
    resultsDisplay.render({ loan: mediumRateLoan });
    interestRateElement = container.querySelector('.summary-item:nth-child(6) .summary-value');
    expect(interestRateElement.classList.contains('rate-medium')).toBe(true);

    // Test high rate indicator
    resultsDisplay.render({ loan: highRateLoan });
    interestRateElement = container.querySelector('.summary-item:nth-child(6) .summary-value');
    expect(interestRateElement.classList.contains('rate-high')).toBe(true);
  });

  test('should display payment breakdown with correct percentages', () => {
    // Create test loan with known values
    const loan = new Loan({
      principal: 100000,
      interestRate: 5,
      term: 360,
      downPayment: 0,
    });

    // Mock amortization schedule with known values
    const mockAmortizationSchedule = {
      totalInterest: 93256, // Approximately for a 30-year loan at 5%
      totalPayment: 193256, // Principal + interest
      payoffDate: new Date('2055-01-01'),
    };

    // Render results
    resultsDisplay.render({ loan, amortizationSchedule: mockAmortizationSchedule });

    // Check breakdown percentages
    const principalBar = container.querySelector('.breakdown-principal');
    const interestBar = container.querySelector('.breakdown-interest');

    // Principal should be about 52% of total payment
    expect(principalBar.style.width).toBe('52%');

    // Interest should be about 48% of total payment
    expect(interestBar.style.width).toBe('48%');
  });

  test('should clear results', () => {
    // Create test loan
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
    });

    // Render results
    resultsDisplay.render({ loan });

    // Verify content exists
    expect(container.querySelector('#results-summary').innerHTML).not.toBe('');
    expect(container.querySelector('#results-breakdown').innerHTML).not.toBe('');

    // Clear results
    resultsDisplay.clear();

    // Verify content is cleared
    expect(container.querySelector('#results-summary').innerHTML).toBe('');
    expect(container.querySelector('#results-breakdown').innerHTML).toBe('');
    expect(container.style.display).toBe('none');
  });

  test('should update results with new calculation', () => {
    // Create initial loan
    const initialLoan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
    });

    // Create updated loan
    const updatedLoan = new Loan({
      principal: 250000,
      interestRate: 3.75,
      term: 360,
    });

    // Render initial results
    resultsDisplay.render({ loan: initialLoan });

    // Spy on render method
    const renderSpy = jest.spyOn(resultsDisplay, 'render');

    // Update results
    resultsDisplay.update({ loan: updatedLoan });

    // Verify render was called with updated loan
    expect(renderSpy).toHaveBeenCalledWith({ loan: updatedLoan });
  });

  test('should render charts when amortization schedule is available', () => {
    // Create test loan
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      downPayment: 40000,
    });

    // Create amortization schedule
    const amortizationSchedule = new AmortizationSchedule(loan);

    // Render results
    resultsDisplay.render({ loan, amortizationSchedule });

    // Verify charts were rendered
    expect(resultsDisplay.charts.renderPrincipalVsInterestChart).toHaveBeenCalledWith({
      loan, amortizationSchedule,
    });
    expect(resultsDisplay.charts.renderPaymentBreakdownPieChart).toHaveBeenCalledWith({
      loan, amortizationSchedule,
    });
  });

  test('should render comparison chart when comparison scenarios are available', () => {
    // Create test loan
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      name: 'Current Loan',
    });

    // Create amortization schedule
    const amortizationSchedule = new AmortizationSchedule(loan);

    // Create comparison scenario
    const comparisonScenarios = [
      {
        id: 'scenario1',
        name: 'Lower Rate',
        loan: new Loan({
          principal: 200000,
          interestRate: 3.5,
          term: 360,
          name: 'Lower Rate',
        }),
        amortizationSchedule: new AmortizationSchedule(new Loan({
          principal: 200000,
          interestRate: 3.5,
          term: 360,
        })),
      },
    ];

    // Render results with comparison
    resultsDisplay.render({ loan, amortizationSchedule, comparisonScenarios });

    // Verify comparison chart was rendered
    expect(resultsDisplay.charts.renderComparisonChart).toHaveBeenCalled();

    // Check that the first scenario in the comparison is the current loan
    const scenarios = resultsDisplay.charts.renderComparisonChart.mock.calls[0][0];
    expect(scenarios[0].name).toBe('Current Loan');
    expect(scenarios[1].name).toBe('Lower Rate');
  });

  test('should clear charts when results are cleared', () => {
    // Create test loan
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
    });

    // Create amortization schedule
    const amortizationSchedule = new AmortizationSchedule(loan);

    // Render results
    resultsDisplay.render({ loan, amortizationSchedule });

    // Clear results
    resultsDisplay.clear();

    // Verify charts were cleared
    expect(resultsDisplay.charts.clear).toHaveBeenCalled();
  });
});
