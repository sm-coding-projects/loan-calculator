/**
 * Amortization Schedule Model
 * Represents a loan amortization schedule with payment details
 * Implements requirements 1.1, 1.3, 4.3
 */

class AmortizationSchedule {
  /**
   * Create a new amortization schedule for a loan
   * @param {Loan} loan - The loan to create a schedule for
   */
  constructor(loan) {
    this.loan = loan;
    this.payments = [];

    // Generate the schedule when the object is created
    this.generateSchedule();
  }

  /**
   * Generate the amortization schedule for the loan
   * @param {Object} options - Options for schedule generation
   * @param {boolean} [options.includeAdditionalPayments=true] - Whether to include additional payments in the calculation
   * @returns {Array} Array of Payment objects
   */
  generateSchedule(options = {}) {
    const includeAdditionalPayments = options.includeAdditionalPayments !== false;

    // Clear existing payments
    this.payments = [];

    // If loan amount is zero, return empty schedule
    if (this.loan.totalLoanAmount() <= 0) {
      return this.payments;
    }

    // Get loan parameters
    const principal = this.loan.totalLoanAmount();
    const periodicRate = this.loan.periodicInterestRate();
    const regularPayment = this.loan.paymentAmount();
    const additionalPayment = includeAdditionalPayments ? this.loan.additionalPayment : 0;

    // Initialize variables for the schedule calculation
    let balance = principal;
    let paymentNumber = 1;
    const currentDate = new Date(this.loan.startDate);

    // Calculate payment interval based on frequency
    const paymentInterval = this.getPaymentInterval();

    // Generate payments until the balance is paid off
    while (balance > 0) {
      // Calculate interest for this period
      const interestPayment = balance * periodicRate;

      // Calculate principal for this period (ensure we don't overpay)
      const totalPayment = Math.min(regularPayment + additionalPayment, balance + interestPayment);
      const principalPayment = totalPayment - interestPayment;

      // Update balance
      balance = Math.max(0, balance - principalPayment);

      // Create payment object
      const payment = new Payment(
        paymentNumber,
        new Date(currentDate),
        totalPayment,
        principalPayment,
        interestPayment,
        balance,
      );

      // Add to payments array
      this.payments.push(payment);

      // Increment payment number
      paymentNumber++;

      // Advance date to next payment
      this.advanceDate(currentDate, paymentInterval);

      // Safety check to prevent infinite loops
      if (paymentNumber > this.loan.numberOfPayments() * 2) {
        // Maximum payment count exceeded, possible calculation error
        break;
      }

      // If we're down to a very small balance, just pay it off
      if (balance > 0 && balance < 0.01) {
        balance = 0;
      }
    }

    return this.payments;
  }

  /**
   * Get the payment interval in days based on payment frequency
   * @returns {Object} Object with days and type properties
   */
  getPaymentInterval() {
    switch (this.loan.paymentFrequency) {
      case 'weekly':
        return { days: 7, type: 'days' };
      case 'bi-weekly':
        return { days: 14, type: 'days' };
      case 'monthly':
        return { days: 1, type: 'months' };
      default:
        return { days: 1, type: 'months' };
    }
  }

  /**
   * Advance a date by the specified interval
   * @param {Date} date - Date to advance (modified in place)
   * @param {Object} interval - Interval object with days and type properties
   */
  advanceDate(date, interval) {
    if (interval.type === 'days') {
      date.setDate(date.getDate() + interval.days);
    } else if (interval.type === 'months') {
      date.setMonth(date.getMonth() + interval.days);
    }
  }

  /**
   * Calculate the total interest paid over the life of the loan
   * @returns {number} Total interest
   */
  totalInterest() {
    return this.payments.reduce((sum, payment) => sum + payment.interest, 0);
  }

  /**
   * Calculate the total amount paid over the life of the loan
   * @returns {number} Total payment
   */
  totalPayment() {
    return this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  /**
   * Get the payoff date (date of the last payment)
   * @returns {Date} Payoff date
   */
  payoffDate() {
    if (this.payments.length === 0) {
      return new Date(this.loan.startDate);
    }

    return new Date(this.payments[this.payments.length - 1].date);
  }

  /**
   * Convert the amortization schedule to JSON for storage
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      loanId: this.loan.id,
      payments: this.payments.map((payment) => payment.toJSON()),
    };
  }

  /**
   * Create an amortization schedule from JSON data
   * @param {Object} json - JSON data
   * @param {Loan} loan - Associated loan object
   * @returns {AmortizationSchedule} New amortization schedule
   */
  static fromJSON(json, loan) {
    if (!json || !json.payments || !Array.isArray(json.payments)) {
      return new AmortizationSchedule(loan);
    }

    const schedule = new AmortizationSchedule(loan);
    // Override the auto-generated schedule with the stored one
    schedule.payments = json.payments.map((paymentJson) => Payment.fromJSON(paymentJson));
    return schedule;
  }
}

/**
 * Payment class representing a single payment in an amortization schedule
 */
class Payment {
  /**
   * Create a new payment
   * @param {number} number - Payment number in sequence
   * @param {Date} date - Date of payment
   * @param {number} amount - Total payment amount
   * @param {number} principal - Principal portion of payment
   * @param {number} interest - Interest portion of payment
   * @param {number} balance - Remaining balance after payment
   */
  constructor(number, date, amount, principal, interest, balance) {
    this.number = number;
    this.date = date;
    this.amount = amount;
    this.principal = principal;
    this.interest = interest;
    this.balance = balance;
  }

  /**
   * Get the month of the payment (1-12)
   * @returns {number} Month number
   */
  month() {
    return this.date.getMonth() + 1; // JavaScript months are 0-indexed
  }

  /**
   * Get the year of the payment
   * @returns {number} Year
   */
  year() {
    return this.date.getFullYear();
  }

  /**
   * Get the cumulative principal paid so far (not implemented yet)
   * This would require knowledge of previous payments
   * @returns {number} Cumulative principal
   */
  cumulativePrincipal() {
    // This would be implemented when we have access to previous payments
    return this.principal;
  }

  /**
   * Get the cumulative interest paid so far (not implemented yet)
   * This would require knowledge of previous payments
   * @returns {number} Cumulative interest
   */
  cumulativeInterest() {
    // This would be implemented when we have access to previous payments
    return this.interest;
  }

  /**
   * Convert payment to JSON for storage
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      number: this.number,
      date: this.date.toISOString(),
      amount: this.amount,
      principal: this.principal,
      interest: this.interest,
      balance: this.balance,
    };
  }

  /**
   * Create a payment from JSON data
   * @param {Object} json - JSON data
   * @returns {Payment} New payment instance
   */
  static fromJSON(json) {
    if (!json) return null;

    return new Payment(
      json.number,
      new Date(json.date),
      json.amount,
      json.principal,
      json.interest,
      json.balance,
    );
  }
}

export { AmortizationSchedule, Payment };
