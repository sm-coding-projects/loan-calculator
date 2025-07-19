/**
 * Tests for inflation adjustment feature
 * Implements requirement 5.6
 */

import CalculatorService from '../src/js/services/calculator.service';
import Loan from '../src/js/models/loan.model';
import { AmortizationSchedule } from '../src/js/models/amortization.model';

describe('Inflation Adjustment Feature', () => {
  let calculatorService;
  let loan;
  let amortizationSchedule;

  beforeEach(() => {
    calculatorService = new CalculatorService();

    // Create a test loan
    loan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360, // 30 years
      paymentFrequency: 'monthly',
      downPayment: 40000,
      additionalPayment: 0,
      inflationRate: 2.5,
    });

    // Generate amortization schedule
    amortizationSchedule = new AmortizationSchedule(loan);
  });

  test('calculateInflationAdjusted should return correct structure', () => {
    const inflationRate = 2.5;
    const result = calculatorService.calculateInflationAdjusted(amortizationSchedule, inflationRate);

    expect(result).toBeDefined();
    expect(result.payments).toBeDefined();
    expect(Array.isArray(result.payments)).toBe(true);
    expect(result.summary).toBeDefined();
    expect(result.summary.inflationRate).toBe(inflationRate);
  });

  test('calculateInflationAdjusted should adjust payment values correctly', () => {
    const inflationRate = 2.5;
    const result = calculatorService.calculateInflationAdjusted(amortizationSchedule, inflationRate);

    // First payment should not be adjusted (factor = 1)
    const firstPayment = result.payments[0];
    expect(firstPayment.inflationAdjustedAmount).toBeCloseTo(firstPayment.originalAmount);

    // Later payments should be adjusted downward
    const laterPayment = result.payments[120]; // 10 years in
    expect(laterPayment.inflationAdjustedAmount).toBeLessThan(laterPayment.originalAmount);

    // Check inflation factor calculation (approximately)
    // After 10 years with 2.5% inflation, purchasing power is about 78% of original
    const expectedFactor = (1 + (inflationRate / 100 / 12)) ** -120;
    expect(laterPayment.inflationFactor).toBeCloseTo(expectedFactor, 4);
  });

  test('calculateInflationAdjusted should calculate correct totals', () => {
    const inflationRate = 2.5;
    const result = calculatorService.calculateInflationAdjusted(amortizationSchedule, inflationRate);

    // Total original payment should match amortization schedule total
    expect(result.summary.totalOriginalPayment).toBeCloseTo(amortizationSchedule.totalPayment);

    // Total inflation-adjusted payment should be less than original
    expect(result.summary.totalInflationAdjustedPayment).toBeLessThan(result.summary.totalOriginalPayment);

    // Savings from inflation should be positive
    expect(result.summary.savingsFromInflation).toBeGreaterThan(0);
    expect(result.summary.savingsFromInflation).toBeCloseTo(
      result.summary.totalOriginalPayment - result.summary.totalInflationAdjustedPayment,
    );
  });

  test('calculateInflationAdjusted should handle zero inflation rate', () => {
    const inflationRate = 0;
    const result = calculatorService.calculateInflationAdjusted(amortizationSchedule, inflationRate);

    // With zero inflation, adjusted values should equal original values
    expect(result.summary.totalInflationAdjustedPayment).toBeCloseTo(result.summary.totalOriginalPayment);
    expect(result.summary.savingsFromInflation).toBeCloseTo(0);

    // Check a sample payment
    const samplePayment = result.payments[50];
    expect(samplePayment.inflationAdjustedAmount).toBeCloseTo(samplePayment.originalAmount);
    expect(samplePayment.inflationFactor).toBeCloseTo(1);
  });

  test('calculateInflationAdjusted should handle high inflation rates', () => {
    const inflationRate = 10; // 10% inflation
    const result = calculatorService.calculateInflationAdjusted(amortizationSchedule, inflationRate);

    // With high inflation, savings should be substantial
    expect(result.summary.savingsFromInflation).toBeGreaterThan(0.5 * result.summary.totalOriginalPayment);

    // Later payments should be significantly reduced
    const laterPayment = result.payments[240]; // 20 years in
    expect(laterPayment.inflationAdjustedAmount).toBeLessThan(0.2 * laterPayment.originalAmount);
  });
});
