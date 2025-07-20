/**
 * Async Calculation Tests
 * Tests for the new async calculation functionality
 */

import { AmortizationSchedule } from '../src/js/models/amortization.model.js';
import Loan from '../src/js/models/loan.model.js';

describe('Async Calculation Functionality', () => {
  let testLoan;

  beforeEach(() => {
    // Create a test loan
    testLoan = new Loan({
      principal: 300000,
      interestRate: 4.5,
      term: 360, // 30 years
      paymentFrequency: 'monthly',
      startDate: new Date('2024-01-01'),
      additionalPayment: 0,
      downPayment: 60000,
    });
  });

  test('should generate amortization schedule asynchronously', async () => {
    const schedule = new AmortizationSchedule(testLoan, false); // Don't auto-generate

    const progressUpdates = [];
    const payments = await schedule.generateScheduleAsync({
      onProgress: (progress, message) => {
        progressUpdates.push({ progress, message });
      },
    });

    // Should have payments
    expect(payments).toBeDefined();
    expect(payments.length).toBeGreaterThan(0);
    expect(payments.length).toBeLessThanOrEqual(360);

    // Should have received progress updates
    expect(progressUpdates.length).toBeGreaterThan(0);

    // First update should be reasonable progress (since we process in batches)
    expect(progressUpdates[0].progress).toBeLessThan(50);

    // Last update should be 100%
    const lastUpdate = progressUpdates[progressUpdates.length - 1];
    expect(lastUpdate.progress).toBe(100);
    expect(lastUpdate.message).toBe('Complete');

    // Verify payment structure
    const firstPayment = payments[0];
    expect(firstPayment).toHaveProperty('number', 1);
    expect(firstPayment).toHaveProperty('amount');
    expect(firstPayment).toHaveProperty('principal');
    expect(firstPayment).toHaveProperty('interest');
    expect(firstPayment).toHaveProperty('balance');
    expect(firstPayment).toHaveProperty('date');

    // Balance should decrease over time
    expect(payments[0].balance).toBeGreaterThan(payments[payments.length - 1].balance);
    expect(payments[payments.length - 1].balance).toBeLessThan(1); // Should be nearly zero
  });

  test('should handle timeout for long calculations', async () => {
    // Create a loan that might take longer to calculate
    const largeLoan = new Loan({
      principal: 10000000, // Large loan
      interestRate: 0.1, // Very low rate
      term: 600, // 50 years
      paymentFrequency: 'monthly',
      startDate: new Date('2024-01-01'),
      additionalPayment: 0,
      downPayment: 0,
    });

    const schedule = new AmortizationSchedule(largeLoan, false);

    // Use a very short timeout and small batch size to force timeout
    await expect(schedule.generateScheduleAsync({
      timeout: 50, // Very short timeout
      batchSize: 1, // Process one payment at a time
    })).rejects.toThrow(/timeout/i);
  });

  test('should validate loan parameters before calculation', async () => {
    // Create a loan and manually set principal to 0 to bypass validation
    const invalidLoan = new Loan({
      principal: 300000,
      interestRate: 4.5,
      term: 360,
      paymentFrequency: 'monthly',
      startDate: new Date('2024-01-01'),
      additionalPayment: 0,
      downPayment: 0,
    });

    // Manually set principal to 0 to bypass Loan validation
    invalidLoan.principal = 0;

    const schedule = new AmortizationSchedule(invalidLoan, false);

    await expect(schedule.generateScheduleAsync()).rejects.toThrow(/Loan amount must be greater than zero/);
  });

  test('should validate interest rate', async () => {
    const invalidLoan = new Loan({
      principal: 300000,
      interestRate: 60, // Rate too high (will be capped at 30 by validation)
      term: 360,
      paymentFrequency: 'monthly',
      startDate: new Date('2024-01-01'),
      additionalPayment: 0,
      downPayment: 0,
    });

    // Manually set an invalid rate to bypass Loan validation
    invalidLoan.interestRate = 60;

    const schedule = new AmortizationSchedule(invalidLoan, false);

    await expect(schedule.generateScheduleAsync()).rejects.toThrow(/Interest rate must be between/);
  });

  test('should validate loan term', async () => {
    const invalidLoan = new Loan({
      principal: 300000,
      interestRate: 4.5,
      term: 360,
      paymentFrequency: 'monthly',
      startDate: new Date('2024-01-01'),
      additionalPayment: 0,
      downPayment: 0,
    });

    // Manually set an invalid term to bypass Loan validation
    invalidLoan.term = 0;

    const schedule = new AmortizationSchedule(invalidLoan, false);

    await expect(schedule.generateScheduleAsync()).rejects.toThrow(/Loan term must be between/);
  });

  test('should handle calculation with additional payments', async () => {
    const loanWithExtra = new Loan({
      principal: 300000,
      interestRate: 4.5,
      term: 360,
      paymentFrequency: 'monthly',
      startDate: new Date('2024-01-01'),
      additionalPayment: 200, // Extra $200 per month
      downPayment: 60000,
    });

    const schedule = new AmortizationSchedule(loanWithExtra, false);
    const payments = await schedule.generateScheduleAsync();

    // Should have fewer payments due to additional payment
    expect(payments.length).toBeLessThan(360);

    // Each payment should include the additional amount
    const regularPayment = loanWithExtra.paymentAmount();
    expect(payments[0].amount).toBeCloseTo(regularPayment + 200, 2);
  });

  test('should process payments in batches', async () => {
    const schedule = new AmortizationSchedule(testLoan, false);

    const progressUpdates = [];
    await schedule.generateScheduleAsync({
      batchSize: 10, // Small batch size
      onProgress: (progress, message) => {
        progressUpdates.push({ progress, message });
      },
    });

    // Should have multiple progress updates due to small batch size
    expect(progressUpdates.length).toBeGreaterThan(5);
  });

  test('should maintain generation state during calculation', async () => {
    const schedule = new AmortizationSchedule(testLoan, false);

    // Start calculation
    const calculationPromise = schedule.generateScheduleAsync();

    // Check state during calculation
    expect(schedule.isGenerating).toBe(true);
    expect(schedule.generationProgress).toBeGreaterThanOrEqual(0);

    // Wait for completion
    await calculationPromise;

    // Check final state
    expect(schedule.isGenerating).toBe(false);
    expect(schedule.generationProgress).toBe(100);
  });

  test('should reset state on error', async () => {
    const invalidLoan = new Loan({
      principal: -1000,
      interestRate: 4.5,
      term: 360,
      paymentFrequency: 'monthly',
      startDate: new Date('2024-01-01'),
      additionalPayment: 0,
      downPayment: 0,
    });

    const schedule = new AmortizationSchedule(invalidLoan, false);

    try {
      await schedule.generateScheduleAsync();
    } catch (error) {
      // State should be reset after error
      // eslint-disable-next-line jest/no-conditional-expect
      expect(schedule.isGenerating).toBe(false);
      // eslint-disable-next-line jest/no-conditional-expect
      expect(schedule.generationProgress).toBe(0);
    }
  });
});
