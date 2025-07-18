/**
 * Integration Tests for Loan Calculator
 * Tests interaction between components and data flow through the application
 * Implements requirements 4.5, 4.7
 */

import CalculatorForm from '../src/js/components/calculator-form';
import ResultsDisplay from '../src/js/components/results-display';
import AmortizationTable from '../src/js/components/amortization-table';
import CalculatorService from '../src/js/services/calculator.service';
import StorageService from '../src/js/services/storage.service';
import Loan from '../src/js/models/loan.model';
import { AmortizationSchedule } from '../src/js/models/amortization.model';

// Mock Chart.js to avoid canvas issues in tests
jest.mock('chart.js/auto', () => {
  return {
    Chart: jest.fn().mockImplementation(() => {
      return {
        destroy: jest.fn(),
        update: jest.fn(),
        resize: jest.fn()
      };
    })
  };
});

describe('Loan Calculator Integration', () => {
  let calculatorForm;
  let resultsDisplay;
  let amortizationTable;
  let calculatorService;
  let storageService;
  
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div id="calculator-form-container"></div>
      <div id="results-display"></div>
      <div id="amortization-table-container"></div>
    `;
    
    // Initialize services
    calculatorService = new CalculatorService();
    storageService = new StorageService();
    
    // Initialize components
    resultsDisplay = new ResultsDisplay({
      container: document.getElementById('results-display')
    });
    
    amortizationTable = new AmortizationTable({
      container: document.getElementById('amortization-table-container')
    });
    
    // Initialize calculator form with callback to update results
    calculatorForm = new CalculatorForm({
      container: document.getElementById('calculator-form-container'),
      onCalculate: (loan) => {
        // Calculate amortization schedule
        const amortizationSchedule = calculatorService.calculateAmortizationSchedule(loan);
        
        // Calculate inflation-adjusted values if inflation rate is set
        let inflationAdjusted = null;
        if (loan.inflationRate > 0) {
          inflationAdjusted = calculatorService.calculateInflationAdjusted(amortizationSchedule, loan.inflationRate);
        }
        
        // Update results display
        resultsDisplay.render({ loan, amortizationSchedule, inflationAdjusted });
        
        // Update amortization table
        amortizationTable.render({ loan, amortizationSchedule, inflationAdjusted });
      }
    });
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    
    // Clear local storage
    localStorage.clear();
  });
  
  test('should update results when form values change', () => {
    // Spy on results display render method
    const renderSpy = jest.spyOn(resultsDisplay, 'render');
    
    // Get principal input
    const principalInput = document.querySelector('#principal');
    
    // Change principal value
    principalInput.value = '300000';
    principalInput.dispatchEvent(new Event('input'));
    
    // Verify results were updated
    expect(renderSpy).toHaveBeenCalled();
    
    // Verify the loan object passed to render has the updated principal
    const renderCall = renderSpy.mock.calls[0][0];
    expect(renderCall.loan.principal).toBe(300000);
  });
  
  test('should update amortization table when form values change', () => {
    // Spy on amortization table render method
    const renderSpy = jest.spyOn(amortizationTable, 'render');
    
    // Get term input
    const termInput = document.querySelector('#term');
    
    // Change term value
    termInput.value = '180'; // 15 years
    termInput.dispatchEvent(new Event('input'));
    
    // Verify amortization table was updated
    expect(renderSpy).toHaveBeenCalled();
    
    // Verify the loan object passed to render has the updated term
    const renderCall = renderSpy.mock.calls[0][0];
    expect(renderCall.loan.term).toBe(180);
  });
  
  test('should pass inflation-adjusted data when inflation rate is set', () => {
    // Spy on results display render method
    const renderSpy = jest.spyOn(resultsDisplay, 'render');
    
    // Get inflation rate input
    const inflationRateInput = document.querySelector('#inflationRate');
    
    // Set inflation rate
    inflationRateInput.value = '3.5';
    inflationRateInput.dispatchEvent(new Event('input'));
    
    // Verify results were updated
    expect(renderSpy).toHaveBeenCalled();
    
    // Verify inflation-adjusted data was passed to render
    const renderCall = renderSpy.mock.calls[0][0];
    expect(renderCall.inflationAdjusted).not.toBeNull();
    expect(renderCall.inflationAdjusted.summary.inflationRate).toBe(3.5);
  });
  
  test('should not pass inflation-adjusted data when inflation rate is zero', () => {
    // Spy on results display render method
    const renderSpy = jest.spyOn(resultsDisplay, 'render');
    
    // Get inflation rate input
    const inflationRateInput = document.querySelector('#inflationRate');
    
    // Set inflation rate to zero
    inflationRateInput.value = '0';
    inflationRateInput.dispatchEvent(new Event('input'));
    
    // Verify results were updated
    expect(renderSpy).toHaveBeenCalled();
    
    // Verify inflation-adjusted data was not passed to render
    const renderCall = renderSpy.mock.calls[0][0];
    expect(renderCall.inflationAdjusted).toBeNull();
  });
  
  test('should update loan parameters when loan type changes', () => {
    // Spy on calculator service
    const calculateSpy = jest.spyOn(calculatorService, 'calculateAmortizationSchedule');
    
    // Get loan type select
    const loanTypeSelect = document.querySelector('#loan-type');
    
    // Change loan type to auto
    loanTypeSelect.value = 'auto';
    loanTypeSelect.dispatchEvent(new Event('change'));
    
    // Verify calculation was performed with updated loan type
    expect(calculateSpy).toHaveBeenCalled();
    
    // Verify the loan passed to calculate has the auto loan type
    const loanArg = calculateSpy.mock.calls[0][0];
    expect(loanArg.type).toBe('auto');
  });
  
  test('should save and load calculations', () => {
    // Create a test loan
    const loan = new Loan({
      principal: 250000,
      interestRate: 4.25,
      term: 360,
      name: 'Test Calculation'
    });
    
    // Calculate amortization schedule
    const amortizationSchedule = calculatorService.calculateAmortizationSchedule(loan);
    
    // Save calculation
    const savedId = storageService.saveCalculation({ loan, amortizationSchedule });
    
    // Load calculation
    const loadedCalculation = storageService.getCalculationById(savedId);
    
    // Verify loaded calculation matches saved calculation
    expect(loadedCalculation.loan.principal).toBe(loan.principal);
    expect(loadedCalculation.loan.interestRate).toBe(loan.interestRate);
    expect(loadedCalculation.loan.term).toBe(loan.term);
    expect(loadedCalculation.amortizationSchedule.totalInterest).toBe(amortizationSchedule.totalInterest);
  });
  
  test('should handle complete user workflow', () => {
    // Spy on results display and amortization table
    const resultsRenderSpy = jest.spyOn(resultsDisplay, 'render');
    const tableRenderSpy = jest.spyOn(amortizationTable, 'render');
    
    // 1. Set loan type
    const loanTypeSelect = document.querySelector('#loan-type');
    loanTypeSelect.value = 'mortgage';
    loanTypeSelect.dispatchEvent(new Event('change'));
    
    // 2. Set loan amount
    const principalInput = document.querySelector('#principal');
    principalInput.value = '350000';
    principalInput.dispatchEvent(new Event('input'));
    
    // 3. Set down payment
    const downPaymentInput = document.querySelector('#downPayment');
    downPaymentInput.value = '70000';
    downPaymentInput.dispatchEvent(new Event('input'));
    
    // 4. Set interest rate
    const interestRateInput = document.querySelector('#interestRate');
    interestRateInput.value = '3.75';
    interestRateInput.dispatchEvent(new Event('input'));
    
    // 5. Set term (15 years)
    const termInput = document.querySelector('#term');
    termInput.value = '180';
    termInput.dispatchEvent(new Event('input'));
    
    // 6. Set additional payment
    const additionalPaymentInput = document.querySelector('#additionalPayment');
    additionalPaymentInput.value = '200';
    additionalPaymentInput.dispatchEvent(new Event('input'));
    
    // 7. Set inflation rate
    const inflationRateInput = document.querySelector('#inflationRate');
    inflationRateInput.value = '2.5';
    inflationRateInput.dispatchEvent(new Event('input'));
    
    // 8. Submit form
    const form = document.querySelector('#loan-calculator-form');
    form.dispatchEvent(new Event('submit'));
    
    // Verify results and amortization table were updated
    expect(resultsRenderSpy).toHaveBeenCalled();
    expect(tableRenderSpy).toHaveBeenCalled();
    
    // Verify the final loan object has all the correct values
    const finalRenderCall = resultsRenderSpy.mock.calls[resultsRenderSpy.mock.calls.length - 1][0];
    const finalLoan = finalRenderCall.loan;
    
    expect(finalLoan.type).toBe('mortgage');
    expect(finalLoan.principal).toBe(350000);
    expect(finalLoan.downPayment).toBe(70000);
    expect(finalLoan.interestRate).toBe(3.75);
    expect(finalLoan.term).toBe(180);
    expect(finalLoan.additionalPayment).toBe(200);
    expect(finalLoan.inflationRate).toBe(2.5);
    
    // Verify inflation-adjusted data was calculated
    expect(finalRenderCall.inflationAdjusted).not.toBeNull();
  });
  
  test('should handle error conditions gracefully', () => {
    // Mock console.error to catch errors
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Force an error by making calculator service throw
    jest.spyOn(calculatorService, 'calculateAmortizationSchedule').mockImplementation(() => {
      throw new Error('Test error');
    });
    
    // Try to calculate with invalid data
    const form = document.querySelector('#loan-calculator-form');
    form.dispatchEvent(new Event('submit'));
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Verify application didn't crash (DOM still exists)
    expect(document.querySelector('#calculator-form-container')).not.toBeNull();
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});