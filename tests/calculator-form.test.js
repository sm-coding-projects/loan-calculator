/**
 * Tests for Calculator Form Component
 * Implements requirements 1.1, 1.2, 2.1, 2.6
 */

import CalculatorForm from '../src/js/components/calculator-form';
import Loan, { LOAN_TYPES, PAYMENT_FREQUENCIES } from '../src/js/models/loan.model';
import * as validators from '../src/js/utils/validators';
import * as formatters from '../src/js/utils/formatters';
import { getTranslation } from '../src/js/utils/translations';
import { initTooltips } from '../src/js/utils/tooltips';
import MarketRates from '../src/js/components/market-rates';

// Mock dependencies
jest.mock('../src/js/utils/translations', () => ({
  getTranslation: jest.fn((key) => key),
}));

jest.mock('../src/js/utils/tooltips', () => ({
  initTooltips: jest.fn(),
}));

jest.mock('../src/js/components/market-rates', () => jest.fn().mockImplementation(() => ({
  updateLoanType: jest.fn(),
  updateCurrentRate: jest.fn(),
  updateLanguage: jest.fn(),
})));

// Mock validators
jest.mock('../src/js/utils/validators', () => ({
  isPositiveNumber: jest.fn(() => true),
  isValidInterestRate: jest.fn(() => true),
  isValidLoanTerm: jest.fn(() => true),
  isNumber: jest.fn(() => true),
  isValidInflationRate: jest.fn(() => true),
  getValidationErrorMessage: jest.fn(() => 'Invalid input'),
}));

// Mock formatters
jest.mock('../src/js/utils/formatters', () => ({
  formatCurrency: jest.fn((val) => `$${val}`),
  formatPercentage: jest.fn((val) => `${val}%`),
  formatNumber: jest.fn((val) => `${val}`),
  formatDate: jest.fn(() => '01/01/2025'),
  formatDuration: jest.fn((months) => `${Math.floor(months / 12)} years`),
  getLocaleFromLanguage: jest.fn(() => 'en-US'),
}));

// Mock Loan model
jest.mock('../src/js/models/loan.model', () => {
  const MockLoanTypes = {
    mortgage: {
      description: 'Mortgage',
      minAmount: 50000,
      maxAmount: 1000000,
      defaultTerm: 360,
      defaultRate: 4.5,
    },
    auto: {
      description: 'Auto Loan',
      minAmount: 5000,
      maxAmount: 100000,
      defaultTerm: 60,
      defaultRate: 3.5,
    },
  };

  const MockPaymentFrequencies = {
    monthly: { description: 'Monthly', paymentsPerYear: 12 },
    'bi-weekly': { description: 'Bi-Weekly', paymentsPerYear: 26 },
  };

  const mockLoan = {
    toJSON: jest.fn(() => ({
      type: 'mortgage',
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      paymentFrequency: 'monthly',
      downPayment: 40000,
      additionalPayment: 0,
      startDate: new Date('2025-01-01'),
      inflationRate: 2.5,
    })),
  };

  const MockLoan = jest.fn().mockImplementation(() => mockLoan);
  MockLoan.createDefault = jest.fn(() => mockLoan);
  MockLoan.fromJSON = jest.fn(() => mockLoan);
  MockLoan.calculateAffordableLoan = jest.fn(() => ({
    affordablePrincipal: 200000,
    totalPurchasePrice: 240000,
    downPayment: 40000,
    monthlyPayment: 1200,
    totalInterest: 150000,
    loan: mockLoan,
  }));

  return {
    __esModule: true,
    default: MockLoan,
    fromJSON: jest.fn(() => mockLoan),
    LOAN_TYPES: MockLoanTypes,
    PAYMENT_FREQUENCIES: MockPaymentFrequencies,
  };
});

describe('CalculatorForm Component', () => {
  let container;
  let calculatorForm;
  let onCalculateMock;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div id="calculator-form-container"></div>
      <div id="market-rates-container"></div>
    `;

    container = document.getElementById('calculator-form-container');
    onCalculateMock = jest.fn();

    // Create component
    calculatorForm = new CalculatorForm({
      container,
      onCalculate: onCalculateMock,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('should initialize with default structure', () => {
    expect(container.querySelector('.calculator-form')).not.toBeNull();
    expect(container.querySelector('#loan-calculator-form')).not.toBeNull();
    expect(container.querySelector('#loan-type')).not.toBeNull();
    expect(container.querySelector('#principal')).not.toBeNull();
    expect(container.querySelector('#interestRate')).not.toBeNull();
    expect(container.querySelector('#term')).not.toBeNull();
    expect(container.querySelector('#inflationRate')).not.toBeNull();
  });

  test('should initialize market rates component', () => {
    expect(MarketRates).toHaveBeenCalled();
    expect(calculatorForm.marketRatesComponent).not.toBeNull();
  });

  test('should trigger initial calculation on init', () => {
    expect(onCalculateMock).toHaveBeenCalled();
    expect(Loan.fromJSON).toHaveBeenCalled();
  });

  test('should update loan type parameters when loan type changes', () => {
    // Get loan type select
    const loanTypeSelect = container.querySelector('#loan-type');
    expect(loanTypeSelect).not.toBeNull();

    // Change loan type to auto
    loanTypeSelect.value = 'auto';
    loanTypeSelect.dispatchEvent(new Event('change'));

    // Verify principal min/max were updated
    const principalInput = container.querySelector('#principal');
    const principalSlider = container.querySelector('#principal-slider');

    expect(principalInput.min).toBe('5000');
    expect(principalInput.max).toBe('100000');
    expect(principalSlider.min).toBe('5000');
    expect(principalSlider.max).toBe('100000');

    // Verify term was updated
    const termInput = container.querySelector('#term');
    expect(termInput.value).toBe('60');

    // Verify interest rate was updated
    const interestRateInput = container.querySelector('#interestRate');
    expect(interestRateInput.value).toBe('3.5');

    // Verify market rates component was updated
    expect(calculatorForm.marketRatesComponent.updateLoanType).toHaveBeenCalledWith('auto');
    expect(calculatorForm.marketRatesComponent.updateCurrentRate).toHaveBeenCalledWith('3.5');

    // Verify calculation was triggered
    expect(onCalculateMock).toHaveBeenCalled();
  });

  test('should sync slider and input values', () => {
    // Get principal input and slider
    const principalInput = container.querySelector('#principal');
    const principalSlider = container.querySelector('#principal-slider');

    // Change slider value
    principalSlider.value = '250000';
    principalSlider.dispatchEvent(new Event('input'));

    // Verify input was updated
    expect(principalInput.value).toBe('250000');

    // Change input value
    principalInput.value = '300000';
    principalInput.dispatchEvent(new Event('input'));

    // Verify slider was updated
    expect(principalSlider.value).toBe('300000');
  });

  test('should validate fields on input', () => {
    // Mock validator to return false for interest rate
    validators.isValidInterestRate.mockReturnValueOnce(false);

    // Get interest rate input
    const interestRateInput = container.querySelector('#interestRate');

    // Change interest rate to invalid value
    interestRateInput.value = '50';
    interestRateInput.dispatchEvent(new Event('input'));

    // Verify validation was called
    expect(validators.isValidInterestRate).toHaveBeenCalledWith('50');

    // Verify error message was displayed
    const errorElement = container.querySelector('#interestRate-error');
    expect(errorElement.textContent).toBe('Invalid input');

    // Verify input has error class
    expect(interestRateInput.classList.contains('is-invalid')).toBe(true);
  });

  test('should handle term preset buttons', () => {
    // Get term input and slider
    const termInput = container.querySelector('#term');
    const termSlider = container.querySelector('#term-slider');

    // Get 15-year preset button
    const preset15Year = container.querySelector('.term-preset[data-term="180"]');

    // Click 15-year preset
    preset15Year.click();

    // Verify term was updated
    expect(termInput.value).toBe('180');
    expect(termSlider.value).toBe('180');

    // Verify calculation was triggered
    expect(onCalculateMock).toHaveBeenCalled();
  });

  test('should update down payment max when principal changes', () => {
    // Get principal and down payment inputs
    const principalInput = container.querySelector('#principal');
    const downPaymentInput = container.querySelector('#downPayment');
    const downPaymentSlider = container.querySelector('#downPayment-slider');

    // Change principal to new value
    principalInput.value = '300000';
    principalInput.dispatchEvent(new Event('input'));

    // Verify down payment max was updated
    expect(downPaymentInput.max).toBe('300000');
    expect(downPaymentSlider.max).toBe('300000');
  });

  test('should adjust down payment if it exceeds new principal', () => {
    // Get principal and down payment inputs
    const principalInput = container.querySelector('#principal');
    const downPaymentInput = container.querySelector('#downPayment');
    const downPaymentSlider = container.querySelector('#downPayment-slider');

    // Set down payment to high value
    downPaymentInput.value = '150000';
    downPaymentSlider.value = '150000';

    // Change principal to lower value
    principalInput.value = '100000';
    principalInput.dispatchEvent(new Event('input'));

    // Verify down payment was adjusted
    expect(downPaymentInput.value).toBe('100000');
    expect(downPaymentSlider.value).toBe('100000');
  });

  test('should reset form to defaults', () => {
    // Get reset button
    const resetButton = container.querySelector('#reset-button');

    // Change some values
    const principalInput = container.querySelector('#principal');
    principalInput.value = '300000';
    principalInput.dispatchEvent(new Event('input'));

    // Click reset button
    resetButton.click();

    // Verify values were reset
    expect(Loan.createDefault).toHaveBeenCalled();
    expect(principalInput.value).toBe('200000');

    // Verify calculation was triggered
    expect(onCalculateMock).toHaveBeenCalled();
  });

  test('should update language and re-render', () => {
    // Spy on render method
    const renderSpy = jest.spyOn(calculatorForm, 'render');
    const bindEventsSpy = jest.spyOn(calculatorForm, 'bindEvents');

    // Update language
    calculatorForm.updateLanguage('es');

    // Verify language was updated
    expect(calculatorForm.language).toBe('es');
    expect(formatters.getLocaleFromLanguage).toHaveBeenCalledWith('es');

    // Verify component was re-rendered
    expect(renderSpy).toHaveBeenCalled();
    expect(bindEventsSpy).toHaveBeenCalled();

    // Verify market rates component was updated
    expect(calculatorForm.marketRatesComponent.updateLanguage).toHaveBeenCalledWith('es');
  });

  test('should update currency format and re-render', () => {
    // Spy on render method
    const renderSpy = jest.spyOn(calculatorForm, 'render');
    const bindEventsSpy = jest.spyOn(calculatorForm, 'bindEvents');

    // Update currency
    calculatorForm.updateCurrencyFormat('EUR');

    // Verify currency was updated
    expect(calculatorForm.formData.currency).toBe('EUR');

    // Verify component was re-rendered
    expect(renderSpy).toHaveBeenCalled();
    expect(bindEventsSpy).toHaveBeenCalled();
  });

  test('should handle form submission', () => {
    // Get form
    const form = container.querySelector('#loan-calculator-form');

    // Submit form
    form.dispatchEvent(new Event('submit'));

    // Verify default was prevented (no page reload)
    expect(onCalculateMock).toHaveBeenCalled();
  });

  test('should get form data from inputs', () => {
    // Get form data
    const formData = calculatorForm.getFormData();

    // Verify form data structure
    expect(formData).toHaveProperty('principal');
    expect(formData).toHaveProperty('interestRate');
    expect(formData).toHaveProperty('term');
    expect(formData).toHaveProperty('downPayment');
    expect(formData).toHaveProperty('additionalPayment');
    expect(formData).toHaveProperty('inflationRate');
  });

  test('should set form data and update UI', () => {
    // New form data
    const newData = {
      principal: 350000,
      interestRate: 3.75,
      term: 240,
    };

    // Set form data
    calculatorForm.setFormData(newData);

    // Verify form inputs were updated
    const principalInput = container.querySelector('#principal');
    const interestRateInput = container.querySelector('#interestRate');
    const termInput = container.querySelector('#term');

    expect(principalInput.value).toBe('350000');
    expect(interestRateInput.value).toBe('3.75');
    expect(termInput.value).toBe('240');

    // Verify calculation was triggered
    expect(onCalculateMock).toHaveBeenCalled();
  });
});
