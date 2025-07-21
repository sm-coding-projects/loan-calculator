/**
 * Async Calculator Service
 * Handles asynchronous loan calculations using Web Workers for performance
 * Implements requirements 4.2, 4.3
 */

class AsyncCalculatorService {
  constructor() {
    this.worker = null;
    this.pendingCalculations = new Map();
    this.calculationId = 0;
    this.workerPath = '/src/js/workers/calculation-worker.js';

    // Don't initialize worker automatically to avoid errors
    // this.initWorker();
  }

  /**
   * Initialize the Web Worker
   */
  initWorker() {
    try {
      // Check if Web Workers are supported
      if (typeof Worker === 'undefined') {
        console.warn('Web Workers not supported, falling back to synchronous calculations');
        return;
      }

      // For now, skip worker initialization to avoid path issues
      // TODO: Fix worker path configuration in webpack
      console.info('Worker initialization skipped, using synchronous calculations');
      this.worker = null;
      return;

      // Commented out worker initialization
      // this.worker = new Worker(this.workerPath);
      // this.worker.onmessage = (e) => {
      //   this.handleWorkerMessage(e.data);
      // };
      // this.worker.onerror = (error) => {
      //   console.error('Worker error:', error);
      //   this.handleWorkerError(error);
      // };
    } catch (error) {
      console.warn('Failed to initialize Web Worker:', error);
      this.worker = null;
    }
  }

  /**
   * Handle messages from the Web Worker
   */
  handleWorkerMessage(data) {
    const {
      type, id, progress, message, currentStep, result, error,
    } = data;
    const calculation = this.pendingCalculations.get(id);

    if (!calculation) {
      console.warn('Received message for unknown calculation:', id);
      return;
    }

    switch (type) {
      case 'progress':
        if (calculation.onProgress) {
          calculation.onProgress(progress, message, currentStep);
        }
        break;

      case 'complete':
        calculation.resolve(result);
        this.pendingCalculations.delete(id);
        break;

      case 'error': {
        const err = new Error(error.message);
        if (error.stack) err.stack = error.stack;
        calculation.reject(err);
        this.pendingCalculations.delete(id);
        break;
      }
    }
  }

  /**
   * Handle worker errors
   */
  handleWorkerError(error) {
    const errorMessage = error && error.message ? error.message : 'Unknown worker error';
    console.warn('Worker error occurred:', errorMessage);
    
    // Reject all pending calculations
    this.pendingCalculations.forEach((calculation) => {
      calculation.reject(new Error(`Worker error: ${errorMessage}`));
    });
    this.pendingCalculations.clear();

    // Don't try to reinitialize worker to avoid repeated errors
    // setTimeout(() => {
    //   this.initWorker();
    // }, 1000);
  }

  /**
   * Calculate amortization schedule asynchronously
   * @param {Object} loanData - Loan data object
   * @param {Object} options - Calculation options
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise} Promise that resolves to calculation results
   */
  async calculateAmortizationAsync(loanData, options = {}, onProgress = null) {
    // If no worker available, fall back to synchronous calculation
    if (!this.worker) {
      return this.calculateAmortizationSync(loanData, options, onProgress);
    }

    const id = ++this.calculationId;

    return new Promise((resolve, reject) => {
      // Store calculation promise handlers
      this.pendingCalculations.set(id, {
        resolve,
        reject,
        onProgress,
        startTime: Date.now(),
      });

      // Send calculation request to worker
      this.worker.postMessage({
        type: 'calculateAmortization',
        id,
        data: {
          loanData: this.serializeLoanData(loanData),
          options: {
            includeAdditionalPayments: true,
            batchSize: 50,
            maxPayments: 10000,
            timeout: 30000,
            ...options,
          },
        },
      });

      // Set up timeout for the calculation
      setTimeout(() => {
        if (this.pendingCalculations.has(id)) {
          this.pendingCalculations.delete(id);
          reject(new Error('Calculation timeout'));
        }
      }, options.timeout || 35000);
    });
  }

  /**
   * Calculate payment amount asynchronously
   * @param {number} principal - Principal amount
   * @param {number} interestRate - Interest rate
   * @param {number} term - Loan term in months
   * @param {string} paymentFrequency - Payment frequency
   * @returns {Promise} Promise that resolves to payment amount
   */
  async calculatePaymentAsync(principal, interestRate, term, paymentFrequency) {
    if (!this.worker) {
      return this.calculatePaymentSync(principal, interestRate, term, paymentFrequency);
    }

    const id = ++this.calculationId;

    return new Promise((resolve, reject) => {
      this.pendingCalculations.set(id, {
        resolve: (result) => resolve(result.payment),
        reject,
        startTime: Date.now(),
      });

      this.worker.postMessage({
        type: 'calculatePayment',
        id,
        data: {
          principal,
          interestRate,
          term,
          paymentFrequency,
        },
      });

      // Timeout for simple calculations
      setTimeout(() => {
        if (this.pendingCalculations.has(id)) {
          this.pendingCalculations.delete(id);
          reject(new Error('Payment calculation timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Calculate inflation-adjusted values asynchronously
   * @param {Array} payments - Array of payment objects
   * @param {number} inflationRate - Annual inflation rate
   * @returns {Promise} Promise that resolves to inflation-adjusted data
   */
  async calculateInflationAsync(payments, inflationRate) {
    if (!this.worker) {
      return this.calculateInflationSync(payments, inflationRate);
    }

    const id = ++this.calculationId;

    return new Promise((resolve, reject) => {
      this.pendingCalculations.set(id, {
        resolve,
        reject,
        startTime: Date.now(),
      });

      this.worker.postMessage({
        type: 'calculateInflation',
        id,
        data: {
          payments,
          inflationRate,
        },
      });

      setTimeout(() => {
        if (this.pendingCalculations.has(id)) {
          this.pendingCalculations.delete(id);
          reject(new Error('Inflation calculation timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Process calculations in chunks to avoid blocking the UI
   * @param {Array} items - Items to process
   * @param {Function} processor - Processing function
   * @param {number} chunkSize - Size of each chunk
   * @param {Function} onProgress - Progress callback
   * @returns {Promise} Promise that resolves to processed results
   */
  async processInChunks(items, processor, chunkSize = 100, onProgress = null) {
    const results = [];
    const totalItems = items.length;

    for (let i = 0; i < totalItems; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      // eslint-disable-next-line no-await-in-loop
      const chunkResults = await Promise.all(chunk.map(processor));
      results.push(...chunkResults);

      // Report progress
      if (onProgress) {
        const progress = Math.min(100, ((i + chunkSize) / totalItems) * 100);
        onProgress(progress, `Processed ${Math.min(i + chunkSize, totalItems)} of ${totalItems} items`);
      }

      // Yield control to prevent blocking
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    }

    return results;
  }

  /**
   * Serialize loan data for worker transmission
   * @param {Object} loanData - Loan data object
   * @returns {Object} Serialized loan data
   */
  serializeLoanData(loanData) {
    return {
      principal: loanData.principal || loanData.totalLoanAmount?.() || 0,
      downPayment: loanData.downPayment || 0,
      interestRate: loanData.interestRate || 0,
      term: loanData.term || 0,
      paymentFrequency: loanData.paymentFrequency || 'monthly',
      additionalPayment: loanData.additionalPayment || 0,
      inflationRate: loanData.inflationRate || 0,
      startDate: loanData.startDate ? loanData.startDate.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Fallback synchronous amortization calculation
   */
  async calculateAmortizationSync(loanData, options = {}, onProgress = null) {
    // Import the synchronous calculator
    const { AmortizationSchedule } = await import('../models/amortization.model.js');
    const Loan = (await import('../models/loan.model.js')).default;

    if (onProgress) onProgress(10, 'Creating loan object...');

    // Create loan object
    const loan = new Loan(loanData);

    if (onProgress) onProgress(30, 'Generating amortization schedule...');

    // Generate schedule with progress tracking
    const schedule = new AmortizationSchedule(loan, false);
    const payments = await schedule.generateScheduleAsync({
      includeAdditionalPayments: options.includeAdditionalPayments !== false,
      onProgress: (progress, message) => {
        if (onProgress) onProgress(30 + (progress * 0.6), message);
      },
      timeout: options.timeout || 30000,
      batchSize: options.batchSize || 50,
    });

    if (onProgress) onProgress(95, 'Calculating totals...');

    // Calculate totals
    const totalInterest = payments.reduce((sum, payment) => sum + payment.interest, 0);
    const totalPayment = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const payoffDate = payments.length > 0 ? payments[payments.length - 1].date : loan.startDate;

    const result = {
      schedule: {
        payments,
        totalInterest,
        totalPayment,
        payoffDate,
        numberOfPayments: payments.length,
      },
    };

    // Calculate inflation adjustment if needed
    if (loanData.inflationRate && loanData.inflationRate > 0) {
      if (onProgress) onProgress(98, 'Calculating inflation adjustments...');
      result.inflationAdjusted = this.calculateInflationSync(payments, loanData.inflationRate);
    }

    if (onProgress) onProgress(100, 'Complete');

    return result;
  }

  /**
   * Fallback synchronous payment calculation
   */
  calculatePaymentSync(principal, interestRate, term, paymentFrequency) {
    const paymentsPerYear = this.getPaymentsPerYear(paymentFrequency);
    const periodicRate = (interestRate / 100) / paymentsPerYear;
    const numberOfPayments = Math.ceil(term * paymentsPerYear / 12);

    if (principal <= 0) return 0;
    if (periodicRate <= 0) return principal / numberOfPayments;

    return principal * periodicRate * (1 + periodicRate) ** numberOfPayments
           / ((1 + periodicRate) ** numberOfPayments - 1);
  }

  /**
   * Fallback synchronous inflation calculation
   */
  calculateInflationSync(payments, inflationRate) {
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

  /**
   * Get payments per year based on frequency
   */
  getPaymentsPerYear(frequency) {
    switch (frequency) {
      case 'weekly': return 52;
      case 'bi-weekly': return 26;
      case 'monthly':
      default: return 12;
    }
  }

  /**
   * Cancel all pending calculations
   */
  cancelAllCalculations() {
    this.pendingCalculations.forEach((calculation) => {
      calculation.reject(new Error('Calculation cancelled'));
    });
    this.pendingCalculations.clear();
  }

  /**
   * Get calculation statistics
   */
  getStats() {
    return {
      pendingCalculations: this.pendingCalculations.size,
      workerAvailable: !!this.worker,
      totalCalculations: this.calculationId,
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.cancelAllCalculations();

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export default AsyncCalculatorService;
