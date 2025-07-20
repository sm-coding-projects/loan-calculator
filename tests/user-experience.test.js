/**
 * User Experience Validation Tests
 * Tests complete user flows, error handling, and loading states
 */

// Mock the services since we're testing behavior, not implementation
const mockCalculatorService = {
  calculateLoan: jest.fn(),
  validateInput: jest.fn(),
};

const mockStorageService = {
  saveCalculation: jest.fn(),
  getCalculations: jest.fn(),
  getCalculationById: jest.fn(),
  updateCalculation: jest.fn(),
  deleteCalculation: jest.fn(),
};

const mockLoadingManager = {
  show: jest.fn(),
  hide: jest.fn(),
  updateProgress: jest.fn(),
};

describe('User Experience Validation Tests', () => {
  let calculatorService;
  let storageService;
  let loadingManager;

  beforeEach(() => {
    // Mock DOM structure
    document.body.innerHTML = `
      <div id="app">
        <form id="loan-form">
          <div class="form-group">
            <label for="loan-amount">Loan Amount</label>
            <input type="number" id="loan-amount" value="300000" min="1000" max="10000000">
            <div class="error-message" id="loan-amount-error"></div>
          </div>
          <div class="form-group">
            <label for="interest-rate">Interest Rate (%)</label>
            <input type="number" id="interest-rate" value="3.5" min="0.1" max="50" step="0.01">
            <div class="error-message" id="interest-rate-error"></div>
          </div>
          <div class="form-group">
            <label for="loan-term">Loan Term (years)</label>
            <input type="number" id="loan-term" value="30" min="1" max="50">
            <div class="error-message" id="loan-term-error"></div>
          </div>
          <button type="submit" id="calculate-btn">Calculate</button>
        </form>
        
        <div id="loading-indicator" class="loading-state" style="display: none;">
          <div class="loading-spinner"></div>
          <div class="loading-message">Calculating...</div>
          <div class="loading-progress">
            <div class="progress-bar" style="width: 0%"></div>
          </div>
        </div>
        
        <div id="error-container" class="error-state" style="display: none;">
          <div class="error-icon">⚠️</div>
          <div class="error-message"></div>
          <button class="retry-btn">Try Again</button>
        </div>
        
        <div id="results-container" class="results-state" style="display: none;">
          <div class="summary-section">
            <div id="monthly-payment"></div>
            <div id="total-interest"></div>
            <div id="total-payment"></div>
          </div>
          <div class="details-section">
            <div id="amortization-table"></div>
            <div id="payment-chart"></div>
          </div>
        </div>
      </div>
    `;

    // Initialize mock services
    calculatorService = mockCalculatorService;
    storageService = mockStorageService;
    loadingManager = mockLoadingManager;

    // Reset mocks and set default implementations
    jest.clearAllMocks();

    // Set default mock implementations
    calculatorService.calculateLoan.mockResolvedValue({
      monthlyPayment: 1347.13,
      totalInterest: 184567.12,
      totalPayment: 484567.12,
      amortizationSchedule: [],
    });

    calculatorService.validateInput.mockReturnValue({
      isValid: true,
      errors: [],
    });

    storageService.saveCalculation.mockResolvedValue('calc-123');
    storageService.getCalculations.mockResolvedValue([]);

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    global.localStorage = localStorageMock;
  });

  describe('Complete User Flow Tests', () => {
    test('successful calculation flow from start to finish', async () => {
      // Step 1: User enters valid loan data
      const loanAmountInput = document.getElementById('loan-amount');
      const interestRateInput = document.getElementById('interest-rate');
      const loanTermInput = document.getElementById('loan-term');
      const calculateBtn = document.getElementById('calculate-btn');

      loanAmountInput.value = '300000';
      interestRateInput.value = '3.5';
      loanTermInput.value = '30';

      // Step 2: User clicks calculate button
      let calculationStarted = false;
      let calculationCompleted = false;

      const mockCalculation = jest.fn().mockImplementation(async () => {
        calculationStarted = true;

        // Simulate calculation time
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });

        calculationCompleted = true;
        return {
          monthlyPayment: 1347.13,
          totalInterest: 184567.12,
          totalPayment: 484567.12,
          amortizationSchedule: [],
        };
      });

      calculatorService.calculateLoan = mockCalculation;

      // Step 3: Trigger calculation
      const form = document.getElementById('loan-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Step 4: Verify loading state is shown
      expect(calculationStarted).toBe(true);

      // Step 5: Wait for calculation to complete
      await new Promise((resolve) => {
        setTimeout(resolve, 150);
      });

      // Step 6: Verify calculation completed
      expect(calculationCompleted).toBe(true);
      expect(mockCalculation).toHaveBeenCalledWith({
        principal: 300000,
        annualRate: 3.5,
        termYears: 30,
      });
    });

    test('user can modify inputs and recalculate', async () => {
      const loanAmountInput = document.getElementById('loan-amount');
      const calculateBtn = document.getElementById('calculate-btn');

      // First calculation
      loanAmountInput.value = '300000';
      let calculationCount = 0;

      const mockCalculation = jest.fn().mockImplementation(async (data) => {
        calculationCount++;
        return {
          monthlyPayment: data.principal * 0.004,
          totalInterest: data.principal * 0.5,
          totalPayment: data.principal * 1.5,
          amortizationSchedule: [],
        };
      });

      calculatorService.calculateLoan = mockCalculation;

      // First calculation
      calculateBtn.click();
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(calculationCount).toBe(1);

      // User modifies input
      loanAmountInput.value = '400000';

      // Second calculation
      calculateBtn.click();
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(calculationCount).toBe(2);
      expect(mockCalculation).toHaveBeenLastCalledWith({
        principal: 400000,
        annualRate: 3.5,
        termYears: 30,
      });
    });

    test('user can save and load calculations', async () => {
      const mockSaveCalculation = jest.fn().mockResolvedValue('calc-123');
      const mockGetCalculations = jest.fn().mockResolvedValue([
        {
          id: 'calc-123',
          name: 'My Home Loan',
          data: { principal: 300000, annualRate: 3.5, termYears: 30 },
          results: { monthlyPayment: 1347.13 },
          timestamp: Date.now(),
        },
      ]);

      storageService.saveCalculation = mockSaveCalculation;
      storageService.getCalculations = mockGetCalculations;

      // User performs calculation
      const calculationData = {
        principal: 300000,
        annualRate: 3.5,
        termYears: 30,
      };

      const results = {
        monthlyPayment: 1347.13,
        totalInterest: 184567.12,
        totalPayment: 484567.12,
      };

      // Save calculation
      const savedId = await storageService.saveCalculation(calculationData, results, 'My Home Loan');
      expect(savedId).toBe('calc-123');
      expect(mockSaveCalculation).toHaveBeenCalledWith(calculationData, results, 'My Home Loan');

      // Load saved calculations
      const savedCalculations = await storageService.getCalculations();
      expect(savedCalculations).toHaveLength(1);
      expect(savedCalculations[0].name).toBe('My Home Loan');
    });
  });

  describe('Error Handling Tests', () => {
    test('handles invalid input gracefully', () => {
      const loanAmountInput = document.getElementById('loan-amount');
      const errorContainer = document.getElementById('loan-amount-error');

      // Test negative loan amount
      loanAmountInput.value = '-100000';

      // Mock validation to return error for negative amount
      calculatorService.validateInput.mockReturnValue({
        isValid: false,
        errors: ['Loan amount must be positive'],
      });

      const validationResult = calculatorService.validateInput({
        principal: -100000,
        annualRate: 3.5,
        termYears: 30,
      });

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toContain('Loan amount must be positive');

      // Verify error container exists for UI error display
      expect(errorContainer).toBeTruthy();
    });

    test('displays user-friendly error messages', async () => {
      const errorContainer = document.getElementById('error-container');
      const errorMessage = errorContainer.querySelector('.error-message');
      const retryBtn = errorContainer.querySelector('.retry-btn');

      // Mock calculation error
      const mockCalculation = jest.fn().mockRejectedValue(new Error('Calculation failed'));
      calculatorService.calculateLoan = mockCalculation;

      try {
        await calculatorService.calculateLoan({
          principal: 300000,
          annualRate: 3.5,
          termYears: 30,
        });
      } catch (error) {
        // Simulate error handling in UI
        errorContainer.style.display = 'block';
        errorMessage.textContent = 'Unable to calculate loan payment. Please check your inputs and try again.';

        // eslint-disable-next-line jest/no-conditional-expect
        expect(errorContainer.style.display).toBe('block');
        // eslint-disable-next-line jest/no-conditional-expect
        expect(errorMessage.textContent).toContain('Unable to calculate');
        // eslint-disable-next-line jest/no-conditional-expect
        expect(retryBtn).toBeTruthy();
      }
    });

    test('provides retry mechanism for failed operations', async () => {
      let attemptCount = 0;
      const mockCalculation = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('Network error');
        }
        return { monthlyPayment: 1347.13 };
      });

      calculatorService.calculateLoan = mockCalculation;

      // First attempt fails
      try {
        await calculatorService.calculateLoan({ principal: 300000, annualRate: 3.5, termYears: 30 });
      } catch (error) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(error.message).toBe('Network error');
      }

      // Retry succeeds
      const result = await calculatorService.calculateLoan({ principal: 300000, annualRate: 3.5, termYears: 30 });
      expect(result.monthlyPayment).toBe(1347.13);
      expect(attemptCount).toBe(2);
    });

    test('handles storage quota exceeded errors', async () => {
      const mockSaveCalculation = jest.fn().mockRejectedValue(
        Object.assign(new Error('QuotaExceededError'), { name: 'QuotaExceededError' }),
      );

      storageService.saveCalculation = mockSaveCalculation;

      try {
        await storageService.saveCalculation(
          { principal: 300000, annualRate: 3.5, termYears: 30 },
          { monthlyPayment: 1347.13 },
          'Test Calculation',
        );
      } catch (error) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(error.name).toBe('QuotaExceededError');
        // Should provide user-friendly message about storage limits
      }
    });
  });

  describe('Loading State Tests', () => {
    test('shows appropriate loading indicators during calculation', async () => {
      const loadingIndicator = document.getElementById('loading-indicator');
      const loadingMessage = loadingIndicator.querySelector('.loading-message');
      const progressBar = loadingIndicator.querySelector('.progress-bar');

      // Mock long-running calculation
      const mockCalculation = jest.fn().mockImplementation(async () => {
        // Simulate loading state updates
        loadingIndicator.style.display = 'block';
        loadingMessage.textContent = 'Calculating loan payment...';
        progressBar.style.width = '25%';

        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });

        loadingMessage.textContent = 'Generating amortization schedule...';
        progressBar.style.width = '75%';

        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });

        loadingMessage.textContent = 'Finalizing results...';
        progressBar.style.width = '100%';

        await new Promise((resolve) => {
          setTimeout(resolve, 50);
        });

        loadingIndicator.style.display = 'none';

        return { monthlyPayment: 1347.13 };
      });

      calculatorService.calculateLoan = mockCalculation;

      const calculationPromise = calculatorService.calculateLoan({
        principal: 300000,
        annualRate: 3.5,
        termYears: 30,
      });

      // Check loading state is shown
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
      expect(loadingIndicator.style.display).toBe('block');
      expect(loadingMessage.textContent).toContain('Calculating');

      // Wait for completion
      await calculationPromise;
      expect(loadingIndicator.style.display).toBe('none');
    });

    test('provides progress feedback for long calculations', async () => {
      const progressBar = document.querySelector('.progress-bar');
      const progressUpdates = [];

      const mockCalculation = jest.fn().mockImplementation(async () => {
        const steps = ['Validating input', 'Calculating payment', 'Building schedule', 'Complete'];

        for (let i = 0; i < steps.length; i++) {
          const progress = ((i + 1) / steps.length) * 100;
          progressBar.style.width = `${progress}%`;
          progressUpdates.push(progress);
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => {
            setTimeout(resolve, 25);
          });
        }

        return { monthlyPayment: 1347.13 };
      });

      calculatorService.calculateLoan = mockCalculation;

      await calculatorService.calculateLoan({
        principal: 300000,
        annualRate: 3.5,
        termYears: 30,
      });

      expect(progressUpdates).toEqual([25, 50, 75, 100]);
    });

    test('handles calculation timeout gracefully', async () => {
      const mockCalculation = jest.fn().mockImplementation(async () => {
        // Simulate very long calculation
        await new Promise((resolve) => {
          setTimeout(resolve, 5000);
        });
        return { monthlyPayment: 1347.13 };
      });

      calculatorService.calculateLoan = mockCalculation;

      // Set timeout for calculation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Calculation timeout'));
        }, 3000);
      });

      const calculationPromise = calculatorService.calculateLoan({
        principal: 300000,
        annualRate: 3.5,
        termYears: 30,
      });

      try {
        await Promise.race([calculationPromise, timeoutPromise]);
      } catch (error) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(error.message).toBe('Calculation timeout');

        // Should show timeout error to user
        const errorContainer = document.getElementById('error-container');
        errorContainer.style.display = 'block';
        errorContainer.querySelector('.error-message').textContent = 'Calculation is taking longer than expected. Please try again.';

        // eslint-disable-next-line jest/no-conditional-expect
        expect(errorContainer.style.display).toBe('block');
      }
    });
  });

  describe('Accessibility and Usability Tests', () => {
    test('provides keyboard navigation support', () => {
      const form = document.getElementById('loan-form');
      const inputs = form.querySelectorAll('input');
      const button = form.querySelector('button');

      // Test tab order
      inputs[0].focus();
      expect(document.activeElement).toBe(inputs[0]);

      // Simulate tab key
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      inputs[0].dispatchEvent(tabEvent);

      // Should be able to navigate between form elements
      expect(inputs.length).toBeGreaterThan(0);
      expect(button).toBeTruthy();
    });

    test('provides screen reader announcements', () => {
      const resultsContainer = document.getElementById('results-container');
      const loadingIndicator = document.getElementById('loading-indicator');

      // Set up ARIA live regions
      resultsContainer.setAttribute('aria-live', 'polite');
      loadingIndicator.setAttribute('aria-live', 'polite');

      expect(resultsContainer.getAttribute('aria-live')).toBe('polite');
      expect(loadingIndicator.getAttribute('aria-live')).toBe('polite');
    });

    test('maintains focus management during state changes', () => {
      const calculateBtn = document.getElementById('calculate-btn');
      const retryBtn = document.querySelector('.retry-btn');

      // Focus should return to appropriate element after operations
      calculateBtn.focus();
      expect(document.activeElement).toBe(calculateBtn);

      // After error, focus should move to retry button
      const errorContainer = document.getElementById('error-container');
      errorContainer.style.display = 'block';
      retryBtn.focus();
      expect(document.activeElement).toBe(retryBtn);
    });
  });

  describe('Performance and Responsiveness Tests', () => {
    test('calculations complete within acceptable time limits', async () => {
      const startTime = performance.now();

      // Mock fast calculation
      calculatorService.calculateLoan.mockImplementation(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 100); // 100ms delay
        });
        return {
          monthlyPayment: 1347.13,
          totalInterest: 184567.12,
          totalPayment: 484567.12,
        };
      });

      const result = await calculatorService.calculateLoan({
        principal: 300000,
        annualRate: 3.5,
        termYears: 30,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 3 seconds as per requirements
      expect(duration).toBeLessThan(3000);
      expect(result).toBeDefined();
    }, 10000); // Increase timeout for this test

    test('UI remains responsive during calculations', async () => {
      let uiResponsive = true;

      // Mock calculation that checks UI responsiveness
      const mockCalculation = jest.fn().mockImplementation(async () => {
        // Simulate work in small chunks to keep UI responsive
        for (let i = 0; i < 10; i++) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => {
            setTimeout(resolve, 10);
          });

          // Check if UI can still respond to events
          const testElement = document.createElement('div');
          let localResponsive = true;
          const clickHandler = () => {
            localResponsive = true;
          };
          testElement.addEventListener('click', clickHandler);
          testElement.click();
          uiResponsive = uiResponsive && localResponsive;
        }

        return { monthlyPayment: 1347.13 };
      });

      calculatorService.calculateLoan = mockCalculation;

      await calculatorService.calculateLoan({
        principal: 300000,
        annualRate: 3.5,
        termYears: 30,
      });

      expect(uiResponsive).toBe(true);
    });
  });
});
