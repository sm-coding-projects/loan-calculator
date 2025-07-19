import Loan from '../src/js/models/loan.model';
import { AmortizationSchedule, Payment } from '../src/js/models/amortization.model';

describe('AmortizationSchedule Model', () => {
  it('should create an amortization schedule for a loan', () => {
    const loan = new Loan({
      principal: 200000,
      interestRate: 5,
      term: 360,
      downPayment: 40000,
    });

    const schedule = new AmortizationSchedule(loan);
    expect(schedule).toBeDefined();
    expect(schedule.payments.length).toBeGreaterThan(0);
  });

  it('should calculate total interest correctly', () => {
    const loan = new Loan({
      principal: 200000,
      interestRate: 5,
      term: 360,
      downPayment: 40000,
    });

    const schedule = new AmortizationSchedule(loan);
    const totalInterest = schedule.totalInterest();
    expect(totalInterest).toBeGreaterThan(0);
  });

  it('should calculate payoff date correctly', () => {
    const startDate = new Date(2023, 0, 1); // January 1, 2023
    const loan = new Loan({
      principal: 200000,
      interestRate: 5,
      term: 12, // 1 year
      downPayment: 40000,
      startDate,
    });

    const schedule = new AmortizationSchedule(loan);
    const payoffDate = schedule.payoffDate();

    // Should be approximately 1 year later
    const expectedDate = new Date(2023, 11, 1); // December 1, 2023
    expect(payoffDate.getFullYear()).toBe(expectedDate.getFullYear());
    expect(payoffDate.getMonth()).toBeGreaterThanOrEqual(11); // December or later
  });
});

describe('Payment Model', () => {
  it('should create a payment with correct properties', () => {
    const date = new Date(2023, 0, 15);
    const payment = new Payment(1, date, 1000, 800, 200, 199200);

    expect(payment.number).toBe(1);
    expect(payment.date).toEqual(date);
    expect(payment.amount).toBe(1000);
    expect(payment.principal).toBe(800);
    expect(payment.interest).toBe(200);
    expect(payment.balance).toBe(199200);
  });

  it('should convert payment to JSON and back', () => {
    const date = new Date(2023, 0, 15);
    const payment = new Payment(1, date, 1000, 800, 200, 199200);

    const json = payment.toJSON();
    const restoredPayment = Payment.fromJSON(json);

    expect(restoredPayment.number).toBe(payment.number);
    expect(restoredPayment.amount).toBe(payment.amount);
    expect(restoredPayment.principal).toBe(payment.principal);
    expect(restoredPayment.interest).toBe(payment.interest);
    expect(restoredPayment.balance).toBe(payment.balance);
    expect(restoredPayment.date.getTime()).toBe(payment.date.getTime());
  });
});
