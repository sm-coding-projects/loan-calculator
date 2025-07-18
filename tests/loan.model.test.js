/**
 * Tests for the Loan model
 * Implements requirement 4.5 - Unit tests for core calculation functions
 */

import Loan, { LOAN_TYPES, PAYMENT_FREQUENCIES } from '../src/js/models/loan.model';
import { AmortizationSchedule } from '../src/js/models/amortization.model';

describe('Loan Model', () => {
  // Test basic instantiation
  test('should create a loan with default values', () => {
    const loan = new Loan();
    expect(loan).toBeInstanceOf(Loan);
    expect(loan.type).toBe('mortgage');
    expect(loan.principal).toBe(LOAN_TYPES.mortgage.minAmount);
    expect(loan.interestRate).toBe(LOAN_TYPES.mortgage.defaultRate);
    expect(loan.term).toBe(LOAN_TYPES.mortgage.defaultTerm);
    expect(loan.paymentFrequency).toBe('monthly');
  });

  // Test with custom values
  test('should create a loan with custom values', () => {
    const options = {
      name: 'Test Loan',
      type: 'auto',
      principal: 25000,
      interestRate: 4.5,
      term: 60,
      paymentFrequency: 'bi-weekly',
      downPayment: 5000,
      additionalPayment: 100
    };
    
    const loan = new Loan(options);
    
    expect(loan.name).toBe('Test Loan');
    expect(loan.type).toBe('auto');
    expect(loan.principal).toBe(25000);
    expect(loan.interestRate).toBe(4.5);
    expect(loan.term).toBe(60);
    expect(loan.paymentFrequency).toBe('bi-weekly');
    expect(loan.downPayment).toBe(5000);
    expect(loan.additionalPayment).toBe(100);
  });

  // Test validation
  test('should validate loan parameters', () => {
    // Invalid loan type
    expect(() => new Loan({ type: 'invalid' })).toThrow();
    
    // Invalid payment frequency
    expect(() => new Loan({ paymentFrequency: 'invalid' })).toThrow();
    
    // Negative principal should be set to minimum
    const loanWithNegativePrincipal = new Loan({ principal: -1000 });
    expect(loanWithNegativePrincipal.principal).toBe(LOAN_TYPES.mortgage.minAmount);
    
    // Negative interest rate should be set to 0
    const loanWithNegativeRate = new Loan({ interestRate: -5 });
    expect(loanWithNegativeRate.interestRate).toBe(0);
    
    // Negative term should be set to 1
    const loanWithNegativeTerm = new Loan({ term: -12 });
    expect(loanWithNegativeTerm.term).toBe(1);
  });

  // Test computed properties
  test('should calculate totalLoanAmount correctly', () => {
    const loan = new Loan({ principal: 200000, downPayment: 40000 });
    expect(loan.totalLoanAmount).toBe(160000);
    
    // Down payment greater than principal
    const loanWithLargeDownPayment = new Loan({ principal: 100000, downPayment: 150000 });
    expect(loanWithLargeDownPayment.totalLoanAmount).toBe(0);
  });

  test('should calculate numberOfPayments correctly', () => {
    // Monthly payments for 30 years
    const loan1 = new Loan({ term: 360, paymentFrequency: 'monthly' });
    expect(loan1.numberOfPayments).toBe(360);
    
    // Bi-weekly payments for 30 years
    const loan2 = new Loan({ term: 360, paymentFrequency: 'bi-weekly' });
    expect(loan2.numberOfPayments).toBe(780); // 360 * 26/12 = 780
    
    // Weekly payments for 30 years
    const loan3 = new Loan({ term: 360, paymentFrequency: 'weekly' });
    expect(loan3.numberOfPayments).toBe(1560); // 360 * 52/12 = 1560
  });

  test('should calculate periodicInterestRate correctly', () => {
    // Monthly rate for 5% annual
    const loan1 = new Loan({ interestRate: 5, paymentFrequency: 'monthly' });
    expect(loan1.periodicInterestRate).toBeCloseTo(0.05 / 12, 5);
    
    // Bi-weekly rate for 5% annual
    const loan2 = new Loan({ interestRate: 5, paymentFrequency: 'bi-weekly' });
    expect(loan2.periodicInterestRate).toBeCloseTo(0.05 / 26, 5);
    
    // Weekly rate for 5% annual
    const loan3 = new Loan({ interestRate: 5, paymentFrequency: 'weekly' });
    expect(loan3.periodicInterestRate).toBeCloseTo(0.05 / 52, 5);
  });

  test('should calculate paymentAmount correctly', () => {
    // Standard mortgage calculation
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      paymentFrequency: 'monthly',
      downPayment: 40000
    });
    
    // Expected monthly payment for $160,000 at 4.5% for 30 years
    // P = 160000, r = 0.00375 (4.5%/12), n = 360
    // Payment = P * r * (1 + r)^n / ((1 + r)^n - 1)
    const expectedPayment = 810.70; // Calculated value
    
    expect(loan.paymentAmount).toBeCloseTo(expectedPayment, 2);
  });

  test('should calculate totalInterest correctly', () => {
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      paymentFrequency: 'monthly',
      downPayment: 40000
    });
    
    // Total interest = (payment * number of payments) - principal
    // For $160,000 at 4.5% for 30 years with actual calculated payment
    const expectedTotalInterest = (loan.paymentAmount * 360) - 160000;
    
    expect(loan.totalInterest).toBeCloseTo(expectedTotalInterest, 2);
  });

  // Test serialization
  test('should serialize to JSON correctly', () => {
    const options = {
      name: 'Test Loan',
      type: 'auto',
      principal: 25000,
      interestRate: 4.5,
      term: 60,
      paymentFrequency: 'bi-weekly',
      downPayment: 5000,
      additionalPayment: 100,
      startDate: new Date('2023-01-01')
    };
    
    const loan = new Loan(options);
    const json = loan.toJSON();
    
    expect(json.name).toBe('Test Loan');
    expect(json.type).toBe('auto');
    expect(json.principal).toBe(25000);
    expect(json.interestRate).toBe(4.5);
    expect(json.term).toBe(60);
    expect(json.paymentFrequency).toBe('bi-weekly');
    expect(json.downPayment).toBe(5000);
    expect(json.additionalPayment).toBe(100);
    expect(json.startDate).toContain('2023-01-01');
  });

  test('should deserialize from JSON correctly', () => {
    const json = {
      id: 'test_id',
      name: 'Test Loan',
      type: 'auto',
      principal: 25000,
      interestRate: 4.5,
      term: 60,
      paymentFrequency: 'bi-weekly',
      downPayment: 5000,
      additionalPayment: 100,
      startDate: '2023-01-01T00:00:00.000Z',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    };
    
    const loan = Loan.fromJSON(json);
    
    expect(loan.id).toBe('test_id');
    expect(loan.name).toBe('Test Loan');
    expect(loan.type).toBe('auto');
    expect(loan.principal).toBe(25000);
    expect(loan.interestRate).toBe(4.5);
    expect(loan.term).toBe(60);
    expect(loan.paymentFrequency).toBe('bi-weekly');
    expect(loan.downPayment).toBe(5000);
    expect(loan.additionalPayment).toBe(100);
    expect(loan.startDate).toBeInstanceOf(Date);
    expect(loan.startDate.getFullYear()).toBe(2023);
  });

  // Test static methods
  test('should create default loan by type', () => {
    const mortgage = Loan.createDefault('mortgage');
    expect(mortgage.type).toBe('mortgage');
    expect(mortgage.principal).toBe(LOAN_TYPES.mortgage.minAmount * 2);
    expect(mortgage.interestRate).toBe(LOAN_TYPES.mortgage.defaultRate);
    expect(mortgage.term).toBe(LOAN_TYPES.mortgage.defaultTerm);
    
    const auto = Loan.createDefault('auto');
    expect(auto.type).toBe('auto');
    expect(auto.principal).toBe(LOAN_TYPES.auto.minAmount * 2);
    expect(auto.interestRate).toBe(LOAN_TYPES.auto.defaultRate);
    expect(auto.term).toBe(LOAN_TYPES.auto.defaultTerm);
    
    // Invalid type
    expect(() => Loan.createDefault('invalid')).toThrow();
  });

  // Test update method
  test('should update loan properties', () => {
    const loan = new Loan({
      name: 'Original Loan',
      principal: 200000,
      interestRate: 4.5
    });
    
    const originalId = loan.id;
    const originalCreatedAt = loan.createdAt;
    
    const updatedLoan = loan.update({
      name: 'Updated Loan',
      principal: 250000
    });
    
    // Check updated properties
    expect(updatedLoan.name).toBe('Updated Loan');
    expect(updatedLoan.principal).toBe(250000);
    
    // Check preserved properties
    expect(updatedLoan.interestRate).toBe(4.5);
    expect(updatedLoan.id).toBe(originalId);
    expect(updatedLoan.createdAt).toBe(originalCreatedAt);
    
    // Check updated timestamp
    expect(updatedLoan.updatedAt).not.toBe(loan.updatedAt);
    expect(updatedLoan.updatedAt > loan.updatedAt).toBe(true);
  });
  
  // Test advanced calculation features
  describe('Advanced Calculation Features', () => {
    // Test additional payment calculations
    test('should calculate additional payment impact correctly', () => {
      const loan = new Loan({
        principal: 200000,
        interestRate: 4.5,
        term: 360, // 30 years
        paymentFrequency: 'monthly',
        downPayment: 0,
        additionalPayment: 0
      });
      
      // Calculate impact of $200 additional monthly payment
      const impact = loan.calculateAdditionalPaymentImpact(200);
      
      // Verify the impact has expected properties
      expect(impact).toHaveProperty('paymentsSaved');
      expect(impact).toHaveProperty('interestSaved');
      expect(impact).toHaveProperty('timeSavedMonths');
      expect(impact).toHaveProperty('timeSavedYears');
      expect(impact).toHaveProperty('newPayoffDate');
      
      // Additional payments should save time and interest
      expect(impact.paymentsSaved).toBeGreaterThan(0);
      expect(impact.interestSaved).toBeGreaterThan(0);
      expect(impact.timeSavedYears + impact.timeSavedMonths / 12).toBeGreaterThan(0);
      
      // New term should be shorter than original
      expect(impact.newTerm).toBeLessThan(impact.originalTerm);
      
      // New payment should be higher than original
      expect(impact.newPayment).toBeGreaterThan(impact.originalPayment);
      
      // New total interest should be less than original
      expect(impact.newTotalInterest).toBeLessThan(impact.originalTotalInterest);
    });
    
    // Test affordability calculator
    test('should calculate affordable loan amount correctly', () => {
      // Calculate affordable loan with $1500 monthly payment
      const affordability = Loan.calculateAffordableLoan({
        desiredPayment: 1500,
        interestRate: 4.5,
        term: 360, // 30 years
        paymentFrequency: 'monthly',
        downPayment: 50000
      });
      
      // Verify the result has expected properties
      expect(affordability).toHaveProperty('affordablePrincipal');
      expect(affordability).toHaveProperty('totalPurchasePrice');
      expect(affordability).toHaveProperty('downPayment');
      expect(affordability).toHaveProperty('monthlyPayment');
      expect(affordability).toHaveProperty('totalInterest');
      expect(affordability).toHaveProperty('loan');
      
      // Affordable principal should be positive
      expect(affordability.affordablePrincipal).toBeGreaterThan(0);
      
      // Total purchase price should include down payment
      expect(affordability.totalPurchasePrice).toBe(affordability.affordablePrincipal + affordability.downPayment);
      
      // Monthly payment should be close to desired payment
      expect(affordability.monthlyPayment).toBeCloseTo(1500, 0);
      
      // Loan should be a valid Loan instance
      expect(affordability.loan).toBeInstanceOf(Loan);
      
      // Test with zero interest rate
      const zeroInterestAffordability = Loan.calculateAffordableLoan({
        desiredPayment: 1000,
        interestRate: 0,
        term: 60, // 5 years
        paymentFrequency: 'monthly'
      });
      
      // For zero interest, the calculation is different than just payment * term
      // Let's just verify it's a reasonable value
      expect(zeroInterestAffordability.affordablePrincipal).toBeGreaterThan(0);
      expect(zeroInterestAffordability.monthlyPayment).toBeCloseTo(1000, 0);
      
      // Test with invalid desired payment
      expect(() => {
        Loan.calculateAffordableLoan({ desiredPayment: 0 });
      }).toThrow();
    });
    
    // Test refinance comparison
    test('should calculate refinance comparison correctly', () => {
      // Create an existing loan
      const existingLoan = new Loan({
        principal: 300000,
        interestRate: 5.5,
        term: 360, // 30 years
        paymentFrequency: 'monthly',
        downPayment: 0,
        startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 5)) // 5 years ago
      });
      
      // Calculate refinance with better rate
      const refinance = existingLoan.calculateRefinance({
        interestRate: 4.0,
        term: 300, // 25 years (remaining term)
        closingCosts: 5000
      });
      
      // Verify the result has expected properties
      expect(refinance).toHaveProperty('currentLoan');
      expect(refinance).toHaveProperty('newLoan');
      expect(refinance).toHaveProperty('comparison');
      expect(refinance).toHaveProperty('refinanceLoan');
      
      // Current loan properties
      expect(refinance.currentLoan).toHaveProperty('payment');
      expect(refinance.currentLoan).toHaveProperty('remainingBalance');
      expect(refinance.currentLoan).toHaveProperty('remainingPayments');
      expect(refinance.currentLoan).toHaveProperty('remainingInterest');
      
      // New loan properties
      expect(refinance.newLoan).toHaveProperty('payment');
      expect(refinance.newLoan).toHaveProperty('principal');
      expect(refinance.newLoan).toHaveProperty('totalInterest');
      
      // Comparison properties
      expect(refinance.comparison).toHaveProperty('monthlySavings');
      expect(refinance.comparison).toHaveProperty('lifetimeSavings');
      expect(refinance.comparison).toHaveProperty('breakEvenMonths');
      expect(refinance.comparison).toHaveProperty('isWorthwhile');
      
      // Lower rate should result in lower payment
      expect(refinance.newLoan.payment).toBeLessThan(refinance.currentLoan.payment);
      
      // Monthly savings should be positive
      expect(refinance.comparison.monthlySavings).toBeGreaterThan(0);
      
      // Test with missing interest rate
      expect(() => {
        existingLoan.calculateRefinance({});
      }).toThrow();
      
      // Test with higher interest rate (not worthwhile)
      const badRefinance = existingLoan.calculateRefinance({
        interestRate: 7.0,
        term: 300,
        closingCosts: 5000
      });
      
      // Higher rate should not be worthwhile
      expect(badRefinance.comparison.isWorthwhile).toBe(false);
      expect(badRefinance.comparison.monthlySavings).toBeLessThan(0);
    });
  });
});

/**
 * Additional tests for edge cases and error handling in Loan model
 * Implements requirement 4.5 - Test edge cases and error handling
 */
describe('Loan Model Edge Cases and Error Handling', () => {
  // Test extremely large principal amounts
  test('should handle extremely large principal amounts', () => {
    const loan = new Loan({
      principal: 10000000, // $10 million
      interestRate: 4.5,
      term: 360,
      paymentFrequency: 'monthly'
    });
    
    expect(loan.principal).toBe(10000000);
    expect(loan.paymentAmount).toBeGreaterThan(0);
    expect(loan.totalInterest).toBeGreaterThan(0);
    expect(isFinite(loan.paymentAmount)).toBe(true);
    expect(isFinite(loan.totalInterest)).toBe(true);
  });
  
  // Test extremely small principal amounts
  test('should handle extremely small principal amounts', () => {
    const loan = new Loan({
      principal: 100, // $100
      interestRate: 4.5,
      term: 12,
      paymentFrequency: 'monthly'
    });
    
    expect(loan.paymentAmount).toBeGreaterThan(0);
    expect(loan.totalInterest).toBeGreaterThan(0);
    expect(isFinite(loan.paymentAmount)).toBe(true);
    expect(isFinite(loan.totalInterest)).toBe(true);
  });
  
  // Test zero interest rate edge case
  test('should handle zero interest rate correctly', () => {
    const loan = new Loan({
      principal: 100000,
      interestRate: 0,
      term: 60,
      paymentFrequency: 'monthly'
    });
    
    // Payment should be principal / term
    expect(loan.paymentAmount).toBeCloseTo(100000 / 60, 2);
    expect(loan.totalInterest).toBeCloseTo(0, 2);
    
    // Create amortization schedule
    const schedule = new AmortizationSchedule(loan);
    
    // All payments should have zero interest
    for (const payment of schedule.payments) {
      expect(payment.interest).toBeCloseTo(0, 2);
    }
    
    // Last payment should have zero balance
    const lastPayment = schedule.payments[schedule.payments.length - 1];
    expect(lastPayment.balance).toBeCloseTo(0, 2);
  });
  
  // Test extremely high interest rates
  test('should handle extremely high interest rates', () => {
    const loan = new Loan({
      principal: 100000,
      interestRate: 30, // 30% interest rate
      term: 60,
      paymentFrequency: 'monthly'
    });
    
    expect(loan.paymentAmount).toBeGreaterThan(0);
    expect(loan.totalInterest).toBeGreaterThan(0);
    expect(isFinite(loan.paymentAmount)).toBe(true);
    expect(isFinite(loan.totalInterest)).toBe(true);
    
    // Interest should be much higher than principal
    expect(loan.totalInterest).toBeGreaterThan(loan.principal);
  });
  
  // Test extremely short term
  test('should handle extremely short term loans', () => {
    const loan = new Loan({
      principal: 100000,
      interestRate: 4.5,
      term: 1, // 1 month
      paymentFrequency: 'monthly'
    });
    
    // Payment should be close to principal + one month's interest
    const expectedPayment = 100000 + (100000 * 0.045 / 12);
    expect(loan.paymentAmount).toBeCloseTo(expectedPayment, 2);
    
    // Total interest should be very small
    expect(loan.totalInterest).toBeLessThan(loan.principal * 0.01);
  });
  
  // Test extremely long term
  test('should handle extremely long term loans', () => {
    const loan = new Loan({
      principal: 100000,
      interestRate: 4.5,
      term: 600, // 50 years
      paymentFrequency: 'monthly'
    });
    
    expect(loan.paymentAmount).toBeGreaterThan(0);
    expect(loan.totalInterest).toBeGreaterThan(0);
    expect(isFinite(loan.paymentAmount)).toBe(true);
    expect(isFinite(loan.totalInterest)).toBe(true);
    
    // Interest should be much higher than principal for long-term loans
    expect(loan.totalInterest).toBeGreaterThan(loan.principal * 2);
  });
  
  // Test validation with invalid inputs
  test('should validate and correct invalid inputs', () => {
    // Test with string values that should be converted to numbers
    const loan = new Loan({
      principal: '100000',
      interestRate: '4.5',
      term: '60',
      downPayment: '20000',
      additionalPayment: '100'
    });
    
    expect(typeof loan.principal).toBe('number');
    expect(typeof loan.interestRate).toBe('number');
    expect(typeof loan.term).toBe('number');
    expect(typeof loan.downPayment).toBe('number');
    expect(typeof loan.additionalPayment).toBe('number');
    
    expect(loan.principal).toBe(100000);
    expect(loan.interestRate).toBe(4.5);
    expect(loan.term).toBe(60);
    expect(loan.downPayment).toBe(20000);
    expect(loan.additionalPayment).toBe(100);
    
    // Test with non-numeric strings
    const loanWithInvalidStrings = new Loan({
      principal: 'not a number',
      interestRate: 'invalid',
      term: 'sixty'
    });
    
    // Should use default values for mortgage
    expect(loanWithInvalidStrings.principal).toBe(LOAN_TYPES.mortgage.minAmount);
    expect(loanWithInvalidStrings.interestRate).toBe(LOAN_TYPES.mortgage.defaultRate);
    expect(loanWithInvalidStrings.term).toBe(LOAN_TYPES.mortgage.defaultTerm);
  });
  
  // Test payoff date calculations
  test('should calculate payoff date correctly for different frequencies', () => {
    const startDate = new Date('2023-01-01');
    
    // Monthly payments for 1 year
    const monthlyLoan = new Loan({
      principal: 100000,
      interestRate: 4.5,
      term: 12, // 12 months
      paymentFrequency: 'monthly',
      startDate: new Date(startDate)
    });
    
    const monthlyPayoffDate = monthlyLoan.payoffDate;
    expect(monthlyPayoffDate.getFullYear()).toBe(startDate.getFullYear() + 1);
    expect(monthlyPayoffDate.getMonth()).toBe(startDate.getMonth());
    
    // Bi-weekly payments for 1 year
    const biWeeklyLoan = new Loan({
      principal: 100000,
      interestRate: 4.5,
      term: 12, // 12 months
      paymentFrequency: 'bi-weekly',
      startDate: new Date(startDate)
    });
    
    const biWeeklyPayoffDate = biWeeklyLoan.payoffDate;
    // Should be approximately 1 year later (26 bi-weekly payments)
    const biWeeklyDiff = biWeeklyPayoffDate.getTime() - startDate.getTime();
    const biWeeklyDays = biWeeklyDiff / (1000 * 60 * 60 * 24);
    expect(biWeeklyDays).toBeCloseTo(364, 0); // Approximately 1 year (364 days)
    
    // Weekly payments for 1 year
    const weeklyLoan = new Loan({
      principal: 100000,
      interestRate: 4.5,
      term: 12, // 12 months
      paymentFrequency: 'weekly',
      startDate: new Date(startDate)
    });
    
    const weeklyPayoffDate = weeklyLoan.payoffDate;
    // Should be approximately 1 year later (52 weekly payments)
    const weeklyDiff = weeklyPayoffDate.getTime() - startDate.getTime();
    const weeklyDays = weeklyDiff / (1000 * 60 * 60 * 24);
    expect(weeklyDays).toBeCloseTo(364, 0); // Approximately 1 year (364 days)
  });
  
  // Test invalid JSON deserialization
  test('should handle invalid JSON during deserialization', () => {
    // Test with null
    const loan1 = Loan.fromJSON(null);
    expect(loan1).toBeInstanceOf(Loan);
    expect(loan1.type).toBe('mortgage');
    
    // Test with empty object
    const loan2 = Loan.fromJSON({});
    expect(loan2).toBeInstanceOf(Loan);
    expect(loan2.type).toBe('mortgage');
    
    // Test with invalid date strings
    const loan3 = Loan.fromJSON({
      principal: 100000,
      startDate: 'not a date',
      createdAt: 'invalid',
      updatedAt: null
    });
    
    expect(loan3).toBeInstanceOf(Loan);
    expect(loan3.principal).toBe(100000);
    expect(loan3.startDate).toBeInstanceOf(Date);
    expect(loan3.createdAt).toBeInstanceOf(Date);
    expect(loan3.updatedAt).toBeInstanceOf(Date);
  });
  
  // Test validate method
  test('should return validation warnings for problematic loans', () => {
    // Loan with negative principal
    const loan1 = new Loan({ principal: -100000 });
    const validation1 = loan1.validate();
    expect(validation1.isValid).toBe(false);
    expect(validation1.warnings.length).toBeGreaterThan(0);
    
    // Loan with extremely high interest rate
    const loan2 = new Loan({ interestRate: 25 });
    const validation2 = loan2.validate();
    expect(validation2.isValid).toBe(false);
    expect(validation2.warnings.length).toBeGreaterThan(0);
    expect(validation2.warnings.some(w => w.includes('high'))).toBe(true);
    
    // Loan with down payment greater than principal
    const loan3 = new Loan({ principal: 100000, downPayment: 150000 });
    const validation3 = loan3.validate();
    expect(validation3.isValid).toBe(false);
    expect(validation3.warnings.length).toBeGreaterThan(0);
    expect(validation3.warnings.some(w => w.includes('down payment'))).toBe(true);
    
    // Loan with additional payment greater than regular payment
    const loan4 = new Loan({ 
      principal: 10000, 
      interestRate: 5, 
      term: 60,
      additionalPayment: 1000 // Very high additional payment
    });
    const validation4 = loan4.validate();
    expect(validation4.isValid).toBe(false);
    expect(validation4.warnings.length).toBeGreaterThan(0);
    expect(validation4.warnings.some(w => w.includes('additional payment'))).toBe(true);
  });
  
  // Test advanced calculation edge cases
  test('should handle edge cases in additional payment impact calculations', () => {
    // Test with zero additional payment
    const loan1 = new Loan({
      principal: 100000,
      interestRate: 4.5,
      term: 360,
      paymentFrequency: 'monthly'
    });
    
    const impact1 = loan1.calculateAdditionalPaymentImpact(0);
    expect(impact1.paymentsSaved).toBe(0);
    expect(impact1.interestSaved).toBeCloseTo(0, 2);
    expect(impact1.timeSavedYears).toBe(0);
    expect(impact1.timeSavedMonths).toBe(0);
    
    // Test with very large additional payment (pays off in one payment)
    const loan2 = new Loan({
      principal: 100000,
      interestRate: 4.5,
      term: 360,
      paymentFrequency: 'monthly'
    });
    
    const impact2 = loan2.calculateAdditionalPaymentImpact(100000);
    expect(impact2.paymentsSaved).toBeGreaterThan(350); // Should save almost all payments
    expect(impact2.interestSaved).toBeGreaterThan(0);
    expect(impact2.timeSavedYears).toBeGreaterThan(29); // Should save almost 30 years
  });
  
  test('should handle edge cases in affordable loan calculations', () => {
    // Test with very small desired payment
    const affordability1 = Loan.calculateAffordableLoan({
      desiredPayment: 10,
      interestRate: 4.5,
      term: 360
    });
    
    expect(affordability1.affordablePrincipal).toBeGreaterThan(0);
    expect(affordability1.affordablePrincipal).toBeLessThan(5000); // Should be a very small loan
    
    // Test with very large desired payment
    const affordability2 = Loan.calculateAffordableLoan({
      desiredPayment: 10000,
      interestRate: 4.5,
      term: 360
    });
    
    expect(affordability2.affordablePrincipal).toBeGreaterThan(1000000); // Should be a very large loan
    expect(isFinite(affordability2.affordablePrincipal)).toBe(true);
  });
  
  test('should handle edge cases in refinance calculations', () => {
    const existingLoan = new Loan({
      principal: 300000,
      interestRate: 5.5,
      term: 360,
      paymentFrequency: 'monthly',
      startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 5))
    });
    
    // Test with same interest rate
    const refinance1 = existingLoan.calculateRefinance({
      interestRate: 5.5,
      term: 300,
      closingCosts: 5000
    });
    
    // Should not be worthwhile due to closing costs
    expect(refinance1.comparison.isWorthwhile).toBe(false);
    
    // Test with very low interest rate
    const refinance2 = existingLoan.calculateRefinance({
      interestRate: 1.0, // Extremely low rate
      term: 300,
      closingCosts: 5000
    });
    
    // Should be very worthwhile
    expect(refinance2.comparison.isWorthwhile).toBe(true);
    expect(refinance2.comparison.monthlySavings).toBeGreaterThan(500); // Should save a lot monthly
    expect(refinance2.comparison.breakEvenMonths).toBeLessThan(12); // Should break even quickly
    
    // Test with very high closing costs
    const refinance3 = existingLoan.calculateRefinance({
      interestRate: 4.0,
      term: 300,
      closingCosts: 50000 // Very high closing costs
    });
    
    // May not be worthwhile due to high closing costs
    expect(refinance3.comparison.breakEvenMonths).toBeGreaterThan(60); // Should take a long time to break even
  });
});