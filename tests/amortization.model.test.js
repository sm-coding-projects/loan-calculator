/**
 * Tests for the Amortization Schedule model
 * Implements requirement 4.5 - Unit tests for core calculation functions
 */

import Loan from '../src/js/models/loan.model';
import { AmortizationSchedule, Payment } from '../src/js/models/amortization.model';

describe('Amortization Schedule Model', () => {
  // Test basic instantiation
  test('should create an amortization schedule for a loan', () => {
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      paymentFrequency: 'monthly',
      downPayment: 40000
    });
    
    const schedule = new AmortizationSchedule(loan);
    expect(schedule).toBeInstanceOf(AmortizationSchedule);
    expect(schedule.loan).toBe(loan);
    expect(Array.isArray(schedule.payments)).toBe(true);
    expect(schedule.payments.length).toBeGreaterThan(0);
  });

  // Test schedule generation
  test('should generate correct number of payments for monthly frequency', () => {
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 30, // 30 months
      paymentFrequency: 'monthly',
      downPayment: 0
    });
    
    const schedule = new AmortizationSchedule(loan);
    expect(schedule.payments.length).toBe(30);
  });

  test('should generate correct number of payments for bi-weekly frequency', () => {
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 12, // 12 months
      paymentFrequency: 'bi-weekly',
      downPayment: 0
    });
    
    const schedule = new AmortizationSchedule(loan);
    // 12 months * 26/12 payments per month = 26 payments
    expect(schedule.payments.length).toBe(26);
  });

  test('should generate correct number of payments for weekly frequency', () => {
    const loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 12, // 12 months
      paymentFrequency: 'weekly',
      downPayment: 0
    });
    
    const schedule = new AmortizationSchedule(loan);
    // 12 months * 52/12 payments per month = 52 payments
    expect(schedule.payments.length).toBe(52);
  });

  // Test payment calculation
  test('should calculate payment amounts correctly', () => {
    const loan = new Loan({
      principal: 100000,
      interestRate: 6,
      term: 12,
      paymentFrequency: 'monthly',
      downPayment: 0
    });
    
    const schedule = new AmortizationSchedule(loan);
    const firstPayment = schedule.payments[0];
    
    // First payment should have correct structure
    expect(firstPayment).toBeInstanceOf(Payment);
    expect(firstPayment.number).toBe(1);
    expect(firstPayment.date).toBeInstanceOf(Date);
    expect(typeof firstPayment.amount).toBe('number');
    expect(typeof firstPayment.principal).toBe('number');
    expect(typeof firstPayment.interest).toBe('number');
    expect(typeof firstPayment.balance).toBe('number');
    
    // First payment interest should be principal * monthly rate
    const expectedFirstInterest = 100000 * (0.06 / 12);
    expect(firstPayment.interest).toBeCloseTo(expectedFirstInterest, 2);
    
    // Last payment should have zero balance
    const lastPayment = schedule.payments[schedule.payments.length - 1];
    expect(lastPayment.balance).toBeCloseTo(0, 2);
  });

  // Test additional payments
  test('should handle additional payments correctly', () => {
    const loanWithoutAdditional = new Loan({
      principal: 100000,
      interestRate: 6,
      term: 60,
      paymentFrequency: 'monthly',
      downPayment: 0,
      additionalPayment: 0
    });
    
    const scheduleWithoutAdditional = new AmortizationSchedule(loanWithoutAdditional);
    
    const loanWithAdditional = new Loan({
      principal: 100000,
      interestRate: 6,
      term: 60,
      paymentFrequency: 'monthly',
      downPayment: 0,
      additionalPayment: 100
    });
    
    const scheduleWithAdditional = new AmortizationSchedule(loanWithAdditional);
    
    // Schedule with additional payments should have fewer payments
    expect(scheduleWithAdditional.payments.length).toBeLessThan(scheduleWithoutAdditional.payments.length);
    
    // Total interest should be less with additional payments
    expect(scheduleWithAdditional.totalInterest).toBeLessThan(scheduleWithoutAdditional.totalInterest);
  });

  // Test edge cases
  test('should handle zero loan amount', () => {
    const loan = new Loan({
      principal: 0,
      interestRate: 4.5,
      term: 360,
      paymentFrequency: 'monthly'
    });
    
    // Force the totalLoanAmount to be 0 for this test
    jest.spyOn(loan, 'totalLoanAmount', 'get').mockReturnValue(0);
    
    const schedule = new AmortizationSchedule(loan);
    expect(schedule.payments.length).toBe(0);
  });

  test('should handle zero interest rate', () => {
    const loan = new Loan({
      principal: 100000,
      interestRate: 0,
      term: 12,
      paymentFrequency: 'monthly',
      downPayment: 0
    });
    
    const schedule = new AmortizationSchedule(loan);
    expect(schedule.payments.length).toBe(12);
    
    // Each payment should be principal / term
    const expectedPayment = 100000 / 12;
    expect(schedule.payments[0].amount).toBeCloseTo(expectedPayment, 2);
    expect(schedule.payments[0].interest).toBeCloseTo(0, 2);
  });

  // Test computed properties
  test('should calculate totalInterest correctly', () => {
    const loan = new Loan({
      principal: 100000,
      interestRate: 6,
      term: 12,
      paymentFrequency: 'monthly',
      downPayment: 0
    });
    
    const schedule = new AmortizationSchedule(loan);
    
    // Calculate expected total interest manually
    const manualTotalInterest = schedule.payments.reduce((sum, payment) => sum + payment.interest, 0);
    
    expect(schedule.totalInterest).toBeCloseTo(manualTotalInterest, 2);
  });

  test('should calculate totalPayment correctly', () => {
    const loan = new Loan({
      principal: 100000,
      interestRate: 6,
      term: 12,
      paymentFrequency: 'monthly',
      downPayment: 0
    });
    
    const schedule = new AmortizationSchedule(loan);
    
    // Calculate expected total payment manually
    const manualTotalPayment = schedule.payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    expect(schedule.totalPayment).toBeCloseTo(manualTotalPayment, 2);
    expect(schedule.totalPayment).toBeCloseTo(loan.totalLoanAmount + schedule.totalInterest, 2);
  });

  test('should calculate payoffDate correctly', () => {
    const startDate = new Date('2023-01-01');
    const loan = new Loan({
      principal: 100000,
      interestRate: 6,
      term: 12,
      paymentFrequency: 'monthly',
      downPayment: 0,
      startDate: startDate
    });
    
    const schedule = new AmortizationSchedule(loan);
    
    // Payoff date should be the date of the last payment
    const lastPayment = schedule.payments[schedule.payments.length - 1];
    expect(schedule.payoffDate).toEqual(lastPayment.date);
    
    // For monthly payments over 12 months, payoff date should be in the expected range
    // Note: The actual date might vary slightly due to how the payments are calculated
    const payoffDate = schedule.payoffDate;
    
    // Check that the payoff date is approximately 12 months after the start date
    const monthDiff = (payoffDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (payoffDate.getMonth() - startDate.getMonth());
    
    expect(monthDiff).toBeGreaterThanOrEqual(11);
    expect(monthDiff).toBeLessThanOrEqual(13);
  });

  // Test serialization
  test('should serialize to JSON correctly', () => {
    const loan = new Loan({
      principal: 100000,
      interestRate: 6,
      term: 12,
      paymentFrequency: 'monthly',
      downPayment: 0
    });
    
    const schedule = new AmortizationSchedule(loan);
    const json = schedule.toJSON();
    
    expect(json.loanId).toBe(loan.id);
    expect(Array.isArray(json.payments)).toBe(true);
    expect(json.payments.length).toBe(schedule.payments.length);
    
    // Check first payment serialization
    const firstPaymentJson = json.payments[0];
    expect(firstPaymentJson.number).toBe(1);
    expect(typeof firstPaymentJson.date).toBe('string');
    expect(typeof firstPaymentJson.amount).toBe('number');
    expect(typeof firstPaymentJson.principal).toBe('number');
    expect(typeof firstPaymentJson.interest).toBe('number');
    expect(typeof firstPaymentJson.balance).toBe('number');
  });

  test('should deserialize from JSON correctly', () => {
    const loan = new Loan({
      principal: 100000,
      interestRate: 6,
      term: 12,
      paymentFrequency: 'monthly',
      downPayment: 0
    });
    
    const originalSchedule = new AmortizationSchedule(loan);
    const json = originalSchedule.toJSON();
    
    // Create a new schedule from the JSON
    const deserializedSchedule = AmortizationSchedule.fromJSON(json, loan);
    
    expect(deserializedSchedule.payments.length).toBe(originalSchedule.payments.length);
    
    // Compare first payment
    const originalPayment = originalSchedule.payments[0];
    const deserializedPayment = deserializedSchedule.payments[0];
    
    expect(deserializedPayment.number).toBe(originalPayment.number);
    expect(deserializedPayment.date.getTime()).toBe(originalPayment.date.getTime());
    expect(deserializedPayment.amount).toBeCloseTo(originalPayment.amount, 2);
    expect(deserializedPayment.principal).toBeCloseTo(originalPayment.principal, 2);
    expect(deserializedPayment.interest).toBeCloseTo(originalPayment.interest, 2);
    expect(deserializedPayment.balance).toBeCloseTo(originalPayment.balance, 2);
  });
});

describe('Payment Model', () => {
  test('should create a payment with correct properties', () => {
    const date = new Date('2023-01-15');
    const payment = new Payment(1, date, 1000, 800, 200, 99000);
    
    expect(payment.number).toBe(1);
    expect(payment.date).toBe(date);
    expect(payment.amount).toBe(1000);
    expect(payment.principal).toBe(800);
    expect(payment.interest).toBe(200);
    expect(payment.balance).toBe(99000);
  });

  test('should calculate month and year correctly', () => {
    const date = new Date('2023-05-15');
    const payment = new Payment(1, date, 1000, 800, 200, 99000);
    
    expect(payment.month).toBe(5); // May is month 5
    expect(payment.year).toBe(2023);
  });

  test('should serialize to JSON correctly', () => {
    const date = new Date('2023-01-15');
    const payment = new Payment(1, date, 1000, 800, 200, 99000);
    
    const json = payment.toJSON();
    
    expect(json.number).toBe(1);
    expect(json.date).toBe(date.toISOString());
    expect(json.amount).toBe(1000);
    expect(json.principal).toBe(800);
    expect(json.interest).toBe(200);
    expect(json.balance).toBe(99000);
  });

  test('should deserialize from JSON correctly', () => {
    const date = new Date('2023-01-15');
    const originalPayment = new Payment(1, date, 1000, 800, 200, 99000);
    
    const json = originalPayment.toJSON();
    const deserializedPayment = Payment.fromJSON(json);
    
    expect(deserializedPayment.number).toBe(originalPayment.number);
    expect(deserializedPayment.date.getTime()).toBe(originalPayment.date.getTime());
    expect(deserializedPayment.amount).toBe(originalPayment.amount);
    expect(deserializedPayment.principal).toBe(originalPayment.principal);
    expect(deserializedPayment.interest).toBe(originalPayment.interest);
    expect(deserializedPayment.balance).toBe(originalPayment.balance);
  });

  test('should handle null JSON input', () => {
    const deserializedPayment = Payment.fromJSON(null);
    expect(deserializedPayment).toBeNull();
  });
});

/**
 * Additional tests for edge cases and error handling
 * Implements requirement 4.5 - Test edge cases and error handling
 */
describe('Amortization Schedule Edge Cases and Error Handling', () => {
  // Test extremely large loan amounts
  test('should handle extremely large loan amounts', () => {
    const loan = new Loan({
      principal: 100000000, // $100 million
      interestRate: 4.5,
      term: 360,
      paymentFrequency: 'monthly',
      downPayment: 0
    });
    
    const schedule = new AmortizationSchedule(loan);
    expect(schedule.payments.length).toBeGreaterThan(0);
    expect(schedule.totalInterest).toBeGreaterThan(0);
    expect(schedule.totalPayment).toBeGreaterThan(loan.totalLoanAmount);
    
    // Last payment should still have zero balance
    const lastPayment = schedule.payments[schedule.payments.length - 1];
    expect(lastPayment.balance).toBeCloseTo(0, 2);
  });
  
  // Test extremely high interest rates
  test('should handle extremely high interest rates', () => {
    const loan = new Loan({
      principal: 100000,
      interestRate: 30, // 30% interest rate
      term: 12,
      paymentFrequency: 'monthly',
      downPayment: 0
    });
    
    const schedule = new AmortizationSchedule(loan);
    expect(schedule.payments.length).toBe(12);
    
    // First payment interest should be principal * monthly rate
    const expectedFirstInterest = 100000 * (0.30 / 12);
    expect(schedule.payments[0].interest).toBeCloseTo(expectedFirstInterest, 2);
    
    // Last payment should have zero balance
    const lastPayment = schedule.payments[schedule.payments.length - 1];
    expect(lastPayment.balance).toBeCloseTo(0, 2);
  });
  
  // Test extremely short term
  test('should handle extremely short term loans', () => {
    const loan = new Loan({
      principal: 100000,
      interestRate: 4.5,
      term: 1, // 1 month
      paymentFrequency: 'monthly',
      downPayment: 0
    });
    
    const schedule = new AmortizationSchedule(loan);
    expect(schedule.payments.length).toBe(1);
    
    // Single payment should pay off the entire loan
    const payment = schedule.payments[0];
    expect(payment.principal).toBeCloseTo(loan.totalLoanAmount, 2);
    expect(payment.balance).toBeCloseTo(0, 2);
  });
  
  // Test extremely long term
  test('should handle extremely long term loans', () => {
    const loan = new Loan({
      principal: 100000,
      interestRate: 4.5,
      term: 600, // 50 years
      paymentFrequency: 'monthly',
      downPayment: 0
    });
    
    const schedule = new AmortizationSchedule(loan);
    expect(schedule.payments.length).toBe(600);
    
    // Last payment should have zero balance
    const lastPayment = schedule.payments[schedule.payments.length - 1];
    expect(lastPayment.balance).toBeCloseTo(0, 2);
  });
  
  // Test invalid schedule generation options
  test('should handle invalid schedule generation options', () => {
    const loan = new Loan({
      principal: 100000,
      interestRate: 4.5,
      term: 12,
      paymentFrequency: 'monthly',
      additionalPayment: 100
    });
    
    // Test with null options
    const schedule1 = new AmortizationSchedule(loan);
    schedule1.generateSchedule(null);
    expect(schedule1.payments.length).toBeGreaterThan(0);
    
    // Test with invalid options
    const schedule2 = new AmortizationSchedule(loan);
    schedule2.generateSchedule({ includeAdditionalPayments: 'invalid' });
    expect(schedule2.payments.length).toBeGreaterThan(0);
    
    // Test with explicitly disabled additional payments
    const schedule3 = new AmortizationSchedule(loan);
    schedule3.generateSchedule({ includeAdditionalPayments: false });
    expect(schedule3.payments.length).toBe(12); // Should be full term without additional payments
  });
  
  // Test invalid JSON deserialization
  test('should handle invalid JSON during deserialization', () => {
    const loan = new Loan({
      principal: 100000,
      interestRate: 4.5,
      term: 12
    });
    
    // Test with empty object
    const schedule1 = AmortizationSchedule.fromJSON({}, loan);
    expect(schedule1).toBeInstanceOf(AmortizationSchedule);
    expect(schedule1.payments.length).toBeGreaterThan(0);
    
    // Test with invalid payments array
    const schedule2 = AmortizationSchedule.fromJSON({ payments: 'not an array' }, loan);
    expect(schedule2).toBeInstanceOf(AmortizationSchedule);
    expect(schedule2.payments.length).toBeGreaterThan(0);
    
    // Test with empty payments array
    const schedule3 = AmortizationSchedule.fromJSON({ payments: [] }, loan);
    expect(schedule3).toBeInstanceOf(AmortizationSchedule);
    expect(schedule3.payments.length).toBeGreaterThan(0);
  });
  
  // Test payment date calculations
  test('should calculate payment dates correctly for different frequencies', () => {
    const startDate = new Date('2023-01-01');
    
    // Monthly payments
    const monthlyLoan = new Loan({
      principal: 100000,
      interestRate: 4.5,
      term: 3,
      paymentFrequency: 'monthly',
      startDate: new Date(startDate)
    });
    
    const monthlySchedule = new AmortizationSchedule(monthlyLoan);
    expect(monthlySchedule.payments[0].date.getMonth()).toBe(startDate.getMonth());
    expect(monthlySchedule.payments[1].date.getMonth()).toBe((startDate.getMonth() + 1) % 12);
    expect(monthlySchedule.payments[2].date.getMonth()).toBe((startDate.getMonth() + 2) % 12);
    
    // Bi-weekly payments
    const biWeeklyLoan = new Loan({
      principal: 100000,
      interestRate: 4.5,
      term: 3,
      paymentFrequency: 'bi-weekly',
      startDate: new Date(startDate)
    });
    
    const biWeeklySchedule = new AmortizationSchedule(biWeeklyLoan);
    const twoWeeksLater = new Date(startDate);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    
    expect(biWeeklySchedule.payments[1].date.getDate()).toBe(twoWeeksLater.getDate());
    
    // Weekly payments
    const weeklyLoan = new Loan({
      principal: 100000,
      interestRate: 4.5,
      term: 3,
      paymentFrequency: 'weekly',
      startDate: new Date(startDate)
    });
    
    const weeklySchedule = new AmortizationSchedule(weeklyLoan);
    const oneWeekLater = new Date(startDate);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    
    expect(weeklySchedule.payments[1].date.getDate()).toBe(oneWeekLater.getDate());
  });
  
  // Test payment calculations with rounding
  test('should handle rounding correctly in payment calculations', () => {
    const loan = new Loan({
      principal: 100000,
      interestRate: 4.5,
      term: 12,
      paymentFrequency: 'monthly',
      downPayment: 0
    });
    
    const schedule = new AmortizationSchedule(loan);
    
    // Sum of all principal payments should equal the loan amount
    const totalPrincipal = schedule.payments.reduce((sum, payment) => sum + payment.principal, 0);
    expect(totalPrincipal).toBeCloseTo(loan.totalLoanAmount, 2);
    
    // Sum of all payments should equal principal + interest
    const totalPayments = schedule.payments.reduce((sum, payment) => sum + payment.amount, 0);
    expect(totalPayments).toBeCloseTo(loan.totalLoanAmount + schedule.totalInterest, 2);
  });
});