import Loan, { LOAN_TYPES, PAYMENT_FREQUENCIES } from '../src/js/models/loan.model';

describe('Loan Model', () => {
  it('should create a loan with default values', () => {
    const loan = new Loan();
    expect(loan).toBeDefined();
    expect(loan.type).toBe('mortgage');
    expect(loan.paymentFrequency).toBe('monthly');
  });

  it('should calculate total loan amount correctly', () => {
    const loan = new Loan({
      principal: 200000,
      downPayment: 40000
    });
    expect(loan.totalLoanAmount()).toBe(160000);
  });

  it('should calculate payment amount correctly', () => {
    const loan = new Loan({
      principal: 200000,
      interestRate: 5,
      term: 360,
      downPayment: 40000
    });
    const payment = loan.paymentAmount();
    expect(payment).toBeCloseTo(858.91, 2);
  });

  it('should create a default loan for a specific type', () => {
    const loan = Loan.createDefault('auto');
    expect(loan.type).toBe('auto');
    expect(loan.term).toBe(LOAN_TYPES.auto.defaultTerm);
    expect(loan.interestRate).toBe(LOAN_TYPES.auto.defaultRate);
  });

  it('should calculate affordable loan amount', () => {
    const result = Loan.calculateAffordableLoan({
      desiredPayment: 1000,
      interestRate: 4.5,
      term: 360
    });
    
    expect(result.affordablePrincipal).toBeGreaterThan(0);
    expect(result.loan).toBeInstanceOf(Loan);
    expect(result.loan.paymentAmount()).toBeCloseTo(1000, 0);
  });
});