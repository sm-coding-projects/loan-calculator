/**
 * Calculation Web Worker
 * Handles heavy loan calculations in a separate thread to avoid blocking the UI
 * Implements requirements 4.2, 4.3
 */

// Import necessary models and utilities for the worker
// Note: In a real implementation, these would need to be bundled for the worker
// For now, we'll include the essential calculation logic directly

/**
 * Loan calculation utilities for the worker
 */
class WorkerLoanCalculator {
  /**
   * Calculate payment amount
   */
  static calculatePayment(principal, rate, term, frequency) {
    const periodicRate = (rate / 100) / this.getPaymentsPerYear(frequency);
    const numberOfPayments = this.calculateNumberOfPayments(term, frequency);

    if (principal <= 0) return 0;
    if (periodicRate <= 0) return principal / numberOfPayments;

    const paymentAmount = principal * periodicRate * (1 + periodicRate) ** numberOfPayments
                         / ((1 + periodicRate) ** numberOfPayments - 1);

    return paymentAmount;
  }

  /**
   * Get payments per year based on frequency
   */
  static getPaymentsPerYear(frequency) {
    switch (frequency) {
      case 'weekly': return 52;
      case 'bi-weekly': return 26;
      case 'monthly':
      default: return 12;
    }
  }

  /**
   * Calculate number of payments
   */
  static calculateNumberOfPayments(term, frequency) {
    const paymentsPerYear = this.getPaymentsPerYear(frequency);
    return Math.ceil(term * paymentsPerYear / 12);
  }

  /**
   * Generate amortization schedule asynchronously with progress reporting
   */
  static async generateAmortizationSchedule(loanData, options = {}) {
    const {
      includeAdditionalPayments = true,
      batchSize = 50,
      maxPayments = 10000,
      timeout = 30000,
    } = options;

    // Validate input
    const loanAmount = loanData.principal - (loanData.downPayment || 0);
    if (!loanAmount || loanAmount <= 0) {
      throw new Error('Loan amount must be greater than zero.');
    }

    if (loanAmount > 100000000) {
      throw new Error('Loan amount is too large. Please enter a reasonable loan amount.');
    }

    const { interestRate, term } = loanData;
    if (interestRate == null || interestRate < 0 || interestRate > 50) {
      throw new Error('Interest rate must be between 0% and 50%.');
    }

    if (!term || term <= 0 || term > 600) {
      throw new Error('Loan term must be between 1 and 600 months.');
    }

    // Calculate loan parameters
    const periodicRate = (interestRate / 100) / this.getPaymentsPerYear(loanData.paymentFrequency);
    const regularPayment = this.calculatePayment(loanAmount, interestRate, term, loanData.paymentFrequency);
    const additionalPayment = includeAdditionalPayments ? (loanData.additionalPayment || 0) : 0;

    // Validate calculated values
    if (isNaN(periodicRate) || periodicRate < 0) {
      throw new Error('Invalid interest rate calculation.');
    }

    if (isNaN(regularPayment) || regularPayment <= 0) {
      throw new Error('Invalid payment calculation.');
    }

    if (regularPayment <= loanAmount * periodicRate) {
      throw new Error('Monthly payment is too low to cover interest.');
    }

    // Initialize calculation variables
    let balance = loanAmount;
    let paymentNumber = 1;
    const payments = [];
    const startTime = Date.now();
    const estimatedTotalPayments = this.calculateNumberOfPayments(term, loanData.paymentFrequency);

    // Report initial progress
    self.postMessage({
      type: 'progress',
      progress: 0,
      message: 'Starting calculation...',
      currentStep: 'calculate',
    });

    // Generate payments
    while (balance > 0 && paymentNumber <= maxPayments) {
      // Check for timeout
      if (Date.now() - startTime > timeout) {
        throw new Error(`Calculation timeout after ${timeout}ms.`);
      }

      // Calculate interest and principal for this period
      const interestPayment = balance * periodicRate;
      const totalPayment = Math.min(regularPayment + additionalPayment, balance + interestPayment);
      const principalPayment = totalPayment - interestPayment;

      // Update balance
      balance = Math.max(0, balance - principalPayment);

      // Create payment object
      const payment = {
        number: paymentNumber,
        date: this.calculatePaymentDate(loanData.startDate, paymentNumber, loanData.paymentFrequency),
        amount: totalPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance,
      };

      payments.push(payment);

      // Report progress in batches
      if (paymentNumber % batchSize === 0) {
        const progress = Math.min(95, (paymentNumber / estimatedTotalPayments) * 100);
        self.postMessage({
          type: 'progress',
          progress,
          message: `Processing payment ${paymentNumber}...`,
          currentStep: 'calculate',
          paymentsProcessed: paymentNumber,
        });

        // Yield control to prevent blocking
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      }

      paymentNumber++;

      // Break if balance is negligible
      if (balance > 0 && balance < 0.01) {
        balance = 0;
      }
    }

    // Check for safety limit
    if (paymentNumber > maxPayments && balance > 0) {
      throw new Error('Maximum payment limit reached. Please check your loan parameters.');
    }

    // Calculate totals
    const totalInterest = payments.reduce((sum, payment) => sum + payment.interest, 0);
    const totalPayment = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const payoffDate = payments.length > 0 ? payments[payments.length - 1].date : loanData.startDate;

    return {
      payments,
      totalInterest,
      totalPayment,
      payoffDate,
      numberOfPayments: payments.length,
    };
  }

  /**
   * Calculate payment date based on frequency
   */
  static calculatePaymentDate(startDate, paymentNumber, frequency) {
    const date = new Date(startDate);

    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + (paymentNumber - 1) * 7);
        break;
      case 'bi-weekly':
        date.setDate(date.getDate() + (paymentNumber - 1) * 14);
        break;
      case 'monthly':
      default:
        date.setMonth(date.getMonth() + (paymentNumber - 1));
        break;
    }

    return date.toISOString();
  }

  /**
   * Calculate inflation-adjusted values
   */
  static calculateInflationAdjusted(payments, inflationRate) {
    if (!payments || payments.length === 0) {
      return { payments: [], summary: {} };
    }

    const monthlyInflationRate = (1 + (inflationRate / 100)) ** (1 / 12) - 1;

    const adjustedPayments = payments.map((payment, index) => {
      const inflationFactor = (1 + monthlyInflationRate) ** -index;

      return {
        ...payment,
        inflationAdjustedAmount: payment.amount * inflationFactor,
        inflationAdjustedPrincipal: payment.principal * inflationFactor,
        inflationAdjustedInterest: payment.interest * inflationFactor,
        inflationFactor,
        originalAmount: payment.amount,
        originalPrincipal: payment.principal,
        originalInterest: payment.interest,
      };
    });

    const totalOriginalPayment = adjustedPayments.reduce((sum, payment) => sum + payment.originalAmount, 0);
    const totalInflationAdjustedPayment = adjustedPayments.reduce((sum, payment) => sum + payment.inflationAdjustedAmount, 0);
    const totalOriginalInterest = adjustedPayments.reduce((sum, payment) => sum + payment.originalInterest, 0);
    const totalInflationAdjustedInterest = adjustedPayments.reduce((sum, payment) => sum + payment.inflationAdjustedInterest, 0);

    return {
      payments: adjustedPayments,
      summary: {
        totalOriginalPayment,
        totalInflationAdjustedPayment,
        totalOriginalInterest,
        totalInflationAdjustedInterest,
        savingsFromInflation: totalOriginalPayment - totalInflationAdjustedPayment,
        inflationRate,
      },
    };
  }
}

// Worker message handler
self.onmessage = async function (e) {
  const { type, data, id } = e.data;

  try {
    switch (type) {
      case 'calculateAmortization': {
        self.postMessage({
          type: 'progress',
          progress: 5,
          message: 'Initializing calculation...',
          currentStep: 'validate',
          id,
        });

        const schedule = await WorkerLoanCalculator.generateAmortizationSchedule(data.loanData, data.options);

        self.postMessage({
          type: 'progress',
          progress: 98,
          message: 'Finalizing results...',
          currentStep: 'finalize',
          id,
        });

        // Calculate inflation adjustment if needed
        let inflationAdjusted = null;
        if (data.loanData.inflationRate && data.loanData.inflationRate > 0) {
          inflationAdjusted = WorkerLoanCalculator.calculateInflationAdjusted(
            schedule.payments,
            data.loanData.inflationRate,
          );
        }

        self.postMessage({
          type: 'complete',
          result: {
            schedule,
            inflationAdjusted,
          },
          id,
        });
        break;
      }

      case 'calculatePayment': {
        const payment = WorkerLoanCalculator.calculatePayment(
          data.principal,
          data.interestRate,
          data.term,
          data.paymentFrequency,
        );

        self.postMessage({
          type: 'complete',
          result: { payment },
          id,
        });
        break;
      }

      case 'calculateInflation': {
        const inflationResult = WorkerLoanCalculator.calculateInflationAdjusted(
          data.payments,
          data.inflationRate,
        );

        self.postMessage({
          type: 'complete',
          result: inflationResult,
          id,
        });
        break;
      }

      default:
        throw new Error(`Unknown calculation type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: {
        message: error.message,
        stack: error.stack,
      },
      id,
    });
  }
};

// Handle worker errors
self.onerror = function (error) {
  self.postMessage({
    type: 'error',
    error: {
      message: error.message,
      filename: error.filename,
      lineno: error.lineno,
    },
  });
};
