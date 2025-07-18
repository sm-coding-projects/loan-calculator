/**
 * Loan Model
 * Represents a loan with its parameters and calculations
 * Implements requirements 1.1, 1.2, 1.3, 1.5, 1.6, 4.3, 5.5
 */

/**
 * Valid loan types and their default parameters
 */
export const LOAN_TYPES = {
  mortgage: {
    defaultTerm: 360, // 30 years in months
    defaultRate: 4.5, // 4.5%
    minAmount: 10000,
    maxAmount: 10000000,
    description: 'Home Mortgage'
  },
  auto: {
    defaultTerm: 60, // 5 years in months
    defaultRate: 5.0, // 5.0%
    minAmount: 1000,
    maxAmount: 200000,
    description: 'Auto Loan'
  },
  personal: {
    defaultTerm: 36, // 3 years in months
    defaultRate: 10.0, // 10.0%
    minAmount: 1000,
    maxAmount: 50000,
    description: 'Personal Loan'
  },
  student: {
    defaultTerm: 120, // 10 years in months
    defaultRate: 5.5, // 5.5%
    minAmount: 1000,
    maxAmount: 500000,
    description: 'Student Loan'
  }
};

/**
 * Valid payment frequencies
 */
export const PAYMENT_FREQUENCIES = {
  monthly: {
    paymentsPerYear: 12,
    description: 'Monthly'
  },
  'bi-weekly': {
    paymentsPerYear: 26,
    description: 'Bi-Weekly'
  },
  weekly: {
    paymentsPerYear: 52,
    description: 'Weekly'
  }
};

class Loan {
  /**
   * Create a new loan instance
   * @param {Object} options - Loan parameters
   * @param {string} [options.name] - Name for this loan calculation
   * @param {string} [options.type] - Loan type (mortgage, auto, personal, student)
   * @param {number} [options.principal] - Principal loan amount
   * @param {number} [options.interestRate] - Annual interest rate (percentage)
   * @param {number} [options.term] - Loan term in months
   * @param {string} [options.paymentFrequency] - Payment frequency (monthly, bi-weekly, weekly)
   * @param {number} [options.downPayment] - Down payment amount
   * @param {number} [options.additionalPayment] - Additional payment per period
   * @param {Date} [options.startDate] - Loan start date
   */
  constructor(options = {}) {
    // If this is a deserialized object, preserve the original ID
    this.id = options.id || this.generateUniqueId();
    
    // Basic loan information
    this.name = options.name || 'Unnamed Calculation';
    this.type = this.validateLoanType(options.type || 'mortgage');
    
    // Set default values based on loan type if not provided
    const typeDefaults = LOAN_TYPES[this.type];
    
    // Financial parameters
    this.principal = this.validateNumber(options.principal, typeDefaults.minAmount, typeDefaults.minAmount, typeDefaults.maxAmount);
    this.interestRate = this.validateNumber(options.interestRate, typeDefaults.defaultRate, 0, 30);
    this.term = this.validateNumber(options.term, typeDefaults.defaultTerm, 1, 600); // Max 50 years
    this.paymentFrequency = this.validatePaymentFrequency(options.paymentFrequency || 'monthly');
    this.downPayment = this.validateNumber(options.downPayment, 0, 0, this.principal);
    this.additionalPayment = this.validateNumber(options.additionalPayment, 0, 0);
    this.inflationRate = this.validateNumber(options.inflationRate, 2.5, 0, 20); // Default 2.5% inflation
    
    // Dates
    this.startDate = options.startDate instanceof Date ? options.startDate : new Date();
    this.createdAt = options.createdAt instanceof Date ? options.createdAt : new Date();
    this.updatedAt = options.updatedAt instanceof Date ? options.updatedAt : new Date();
    
    // Validate the entire loan object
    const validationResult = this.validate();
    if (!validationResult.isValid) {
      console.warn('Loan validation warnings:', validationResult.warnings);
    }
  }
  
  /**
   * Calculate the total loan amount (principal minus down payment)
   * @returns {number} Total loan amount
   */
  get totalLoanAmount() {
    return Math.max(0, this.principal - this.downPayment);
  }
  
  /**
   * Calculate the total number of payments based on term and payment frequency
   * @returns {number} Total number of payments
   */
  get numberOfPayments() {
    const paymentsPerYear = PAYMENT_FREQUENCIES[this.paymentFrequency].paymentsPerYear;
    return Math.ceil(this.term * paymentsPerYear / 12);
  }
  
  /**
   * Calculate the periodic interest rate based on payment frequency
   * @returns {number} Periodic interest rate as a decimal
   */
  get periodicInterestRate() {
    const paymentsPerYear = PAYMENT_FREQUENCIES[this.paymentFrequency].paymentsPerYear;
    return (this.interestRate / 100) / paymentsPerYear;
  }
  
  /**
   * Calculate the periodic payment amount
   * @returns {number} Payment amount per period
   */
  get paymentAmount() {
    const P = this.totalLoanAmount;
    const r = this.periodicInterestRate;
    const n = this.numberOfPayments;
    
    // Handle edge cases
    if (P <= 0) return 0;
    if (r <= 0) return P / n;
    
    // Standard loan payment formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
    const paymentAmount = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    return paymentAmount;
  }
  
  /**
   * Calculate the total interest paid over the life of the loan
   * @returns {number} Total interest
   */
  get totalInterest() {
    return (this.paymentAmount * this.numberOfPayments) - this.totalLoanAmount;
  }
  
  /**
   * Calculate the payoff date
   * @returns {Date} Expected payoff date
   */
  get payoffDate() {
    const payoffDate = new Date(this.startDate);
    
    switch(this.paymentFrequency) {
      case 'monthly':
        payoffDate.setMonth(payoffDate.getMonth() + this.term);
        break;
      case 'bi-weekly':
        payoffDate.setDate(payoffDate.getDate() + Math.ceil(this.numberOfPayments * 14));
        break;
      case 'weekly':
        payoffDate.setDate(payoffDate.getDate() + Math.ceil(this.numberOfPayments * 7));
        break;
    }
    
    return payoffDate;
  }
  
  /**
   * Generate a unique ID for this loan
   * @returns {string} Unique ID
   */
  generateUniqueId() {
    return 'loan_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
  }
  
  /**
   * Validate loan type
   * @param {string} type - Loan type to validate
   * @returns {string} Valid loan type
   * @throws {Error} If loan type is invalid
   */
  validateLoanType(type) {
    if (!LOAN_TYPES[type]) {
      const validTypes = Object.keys(LOAN_TYPES).join(', ');
      throw new Error(`Invalid loan type: ${type}. Valid types are: ${validTypes}`);
    }
    return type;
  }
  
  /**
   * Validate payment frequency
   * @param {string} frequency - Payment frequency to validate
   * @returns {string} Valid payment frequency
   * @throws {Error} If payment frequency is invalid
   */
  validatePaymentFrequency(frequency) {
    if (!PAYMENT_FREQUENCIES[frequency]) {
      const validFrequencies = Object.keys(PAYMENT_FREQUENCIES).join(', ');
      throw new Error(`Invalid payment frequency: ${frequency}. Valid frequencies are: ${validFrequencies}`);
    }
    return frequency;
  }
  
  /**
   * Validate a numeric value
   * @param {number} value - Value to validate
   * @param {number} defaultValue - Default value if invalid
   * @param {number} [min] - Minimum allowed value
   * @param {number} [max] - Maximum allowed value
   * @returns {number} Validated number
   */
  validateNumber(value, defaultValue, min = null, max = null) {
    // Convert to number if string
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if it's a valid number
    if (isNaN(num) || typeof num !== 'number') {
      return defaultValue;
    }
    
    // Apply min/max constraints
    if (min !== null && num < min) return min;
    if (max !== null && num > max) return max;
    
    return num;
  }
  
  /**
   * Validate the entire loan object
   * @returns {Object} Validation result with isValid flag and warnings array
   */
  validate() {
    const warnings = [];
    
    // Check principal amount
    if (this.principal <= 0) {
      warnings.push('Principal amount must be greater than zero');
    }
    
    // Check interest rate
    if (this.interestRate < 0) {
      warnings.push('Interest rate cannot be negative');
    } else if (this.interestRate > 20) {
      warnings.push('Warning: Interest rate is unusually high');
    }
    
    // Check term
    if (this.term <= 0) {
      warnings.push('Loan term must be greater than zero');
    }
    
    // Check down payment
    if (this.downPayment < 0) {
      warnings.push('Down payment cannot be negative');
    } else if (this.downPayment >= this.principal) {
      warnings.push('Down payment cannot be greater than or equal to the principal');
    }
    
    // Check additional payment
    if (this.additionalPayment < 0) {
      warnings.push('Additional payment cannot be negative');
    } else if (this.additionalPayment > this.paymentAmount && this.paymentAmount > 0) {
      warnings.push('Additional payment is greater than the regular payment');
    }
    
    return {
      isValid: warnings.length === 0,
      warnings
    };
  }
  
  /**
   * Update loan parameters
   * @param {Object} updates - Parameters to update
   * @returns {Loan} Updated loan instance
   */
  update(updates = {}) {
    // Ensure we have a fresh timestamp that's definitely newer
    const now = new Date();
    
    // Create a new loan with merged parameters
    const updatedLoan = new Loan({
      ...this.toJSON(),
      ...updates,
      // Force the updatedAt to be a new Date instance
      updatedAt: now
    });
    
    // Copy the ID to maintain identity
    updatedLoan.id = this.id;
    updatedLoan.createdAt = this.createdAt;
    
    // Ensure the updatedAt is definitely newer by adding a small delay if needed
    if (updatedLoan.updatedAt <= this.updatedAt) {
      updatedLoan.updatedAt = new Date(this.updatedAt.getTime() + 1);
    }
    
    return updatedLoan;
  }
  
  /**
   * Convert loan to JSON for storage
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      principal: this.principal,
      interestRate: this.interestRate,
      term: this.term,
      paymentFrequency: this.paymentFrequency,
      downPayment: this.downPayment,
      additionalPayment: this.additionalPayment,
      inflationRate: this.inflationRate,
      startDate: this.startDate.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
  
  /**
   * Create a loan instance from JSON data
   * @param {Object} json - JSON data
   * @returns {Loan} New loan instance
   */
  static fromJSON(json) {
    if (!json) return new Loan();
    
    // Parse dates from ISO strings
    const parsedJson = {
      ...json,
      startDate: json.startDate ? new Date(json.startDate) : new Date(),
      createdAt: json.createdAt ? new Date(json.createdAt) : new Date(),
      updatedAt: json.updatedAt ? new Date(json.updatedAt) : new Date()
    };
    
    // Create a new loan with the parsed data
    const loan = new Loan(parsedJson);
    
    // Ensure the ID is preserved exactly as it was in the JSON
    if (json.id) {
      loan.id = json.id;
    }
    
    return loan;
  }
  
  /**
   * Create a loan with default values for the specified loan type
   * @param {string} type - Loan type
   * @returns {Loan} New loan with default values
   */
  static createDefault(type = 'mortgage') {
    if (!LOAN_TYPES[type]) {
      throw new Error(`Invalid loan type: ${type}`);
    }
    
    const defaults = LOAN_TYPES[type];
    
    return new Loan({
      name: `New ${defaults.description}`,
      type: type,
      principal: defaults.minAmount * 2,
      interestRate: defaults.defaultRate,
      term: defaults.defaultTerm,
      paymentFrequency: 'monthly',
      downPayment: 0,
      additionalPayment: 0,
      startDate: new Date()
    });
  }

  /**
   * Calculate the impact of additional payments on the loan
   * Implements requirement 1.5
   * @param {number} additionalPayment - Additional payment amount per period
   * @returns {Object} Impact of additional payments including time saved and interest saved
   */
  calculateAdditionalPaymentImpact(additionalPayment = this.additionalPayment) {
    // Create a baseline loan with no additional payments
    const baselineLoan = this.update({ additionalPayment: 0 });
    
    // Create a loan with the specified additional payment
    const enhancedLoan = this.update({ additionalPayment });
    
    // Dynamically import AmortizationSchedule to avoid circular dependency
    return import('./amortization.model.js').then(({ AmortizationSchedule }) => {
      // Calculate amortization schedules for both loans
      const baselineSchedule = new AmortizationSchedule(baselineLoan);
      const enhancedSchedule = new AmortizationSchedule(enhancedLoan);
      
      // Calculate time saved
      const baselinePayments = baselineSchedule.payments.length;
      const enhancedPayments = enhancedSchedule.payments.length;
      const paymentsSaved = baselinePayments - enhancedPayments;
    
    // Calculate interest saved
    const baselineInterest = baselineSchedule.totalInterest;
    const enhancedInterest = enhancedSchedule.totalInterest;
    const interestSaved = baselineInterest - enhancedInterest;
    
    // Calculate time saved in months/years
    let timeSavedMonths = 0;
    let timeSavedYears = 0;
    
    switch(this.paymentFrequency) {
      case 'monthly':
        timeSavedMonths = paymentsSaved;
        break;
      case 'bi-weekly':
        timeSavedMonths = Math.round(paymentsSaved * 12 / 26);
        break;
      case 'weekly':
        timeSavedMonths = Math.round(paymentsSaved * 12 / 52);
        break;
    }
    
    timeSavedYears = Math.floor(timeSavedMonths / 12);
    timeSavedMonths = timeSavedMonths % 12;
    
    // Calculate new payoff date
    const newPayoffDate = enhancedSchedule.payoffDate;
    
    return {
      paymentsSaved,
      interestSaved,
      timeSavedMonths,
      timeSavedYears,
      newPayoffDate,
      originalTerm: this.term,
      newTerm: this.term - timeSavedMonths - (timeSavedYears * 12),
      originalPayment: baselineLoan.paymentAmount,
      newPayment: enhancedLoan.paymentAmount + additionalPayment,
      originalTotalInterest: baselineInterest,
      newTotalInterest: enhancedInterest
    };
  }
  
  /**
   * Calculate the affordable loan amount based on a desired payment
   * Implements requirement 1.6
   * @param {Object} options - Calculation options
   * @param {number} options.desiredPayment - Desired payment amount
   * @param {number} [options.interestRate] - Interest rate (defaults to current loan rate)
   * @param {number} [options.term] - Loan term in months (defaults to current loan term)
   * @param {string} [options.paymentFrequency] - Payment frequency (defaults to current frequency)
   * @param {number} [options.downPayment] - Down payment amount (defaults to current down payment)
   * @returns {Object} Affordable loan details
   */
  static calculateAffordableLoan(options) {
    if (!options.desiredPayment || options.desiredPayment <= 0) {
      throw new Error('Desired payment must be greater than zero');
    }
    
    // Extract parameters with defaults
    const desiredPayment = options.desiredPayment;
    const interestRate = options.interestRate || 4.5;
    const term = options.term || 360;
    const paymentFrequency = options.paymentFrequency || 'monthly';
    const downPayment = options.downPayment || 0;
    
    // Create a temporary loan to access the payment calculation methods
    const tempLoan = new Loan({
      principal: 100000, // Arbitrary starting value
      interestRate,
      term,
      paymentFrequency,
      downPayment: 0 // We'll handle down payment separately
    });
    
    // Get the periodic interest rate
    const r = tempLoan.periodicInterestRate;
    const n = tempLoan.numberOfPayments;
    
    // Handle edge cases
    let affordablePrincipal = 0;
    
    if (r <= 0) {
      // For zero interest, it's just payment * number of payments
      affordablePrincipal = desiredPayment * n;
    } else {
      // Rearrange the standard loan formula to solve for principal:
      // P = payment * ((1+r)^n - 1) / (r * (1+r)^n)
      affordablePrincipal = desiredPayment * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
    }
    
    // Add down payment to get total purchase price
    const totalPurchasePrice = affordablePrincipal + downPayment;
    
    // Create a loan with the calculated principal
    const affordableLoan = new Loan({
      principal: totalPurchasePrice,
      interestRate,
      term,
      paymentFrequency,
      downPayment,
      name: 'Affordable Loan'
    });
    
    return {
      affordablePrincipal,
      totalPurchasePrice,
      downPayment,
      monthlyPayment: affordableLoan.paymentAmount,
      totalInterest: affordableLoan.totalInterest,
      loan: affordableLoan
    };
  }
  
  /**
   * Calculate refinance comparison between current loan and new options
   * Implements requirement 5.5
   * @param {Object} newLoanOptions - Options for the new loan
   * @param {number} [newLoanOptions.principal] - New loan principal (defaults to current remaining balance)
   * @param {number} newLoanOptions.interestRate - New interest rate
   * @param {number} [newLoanOptions.term] - New loan term in months
   * @param {string} [newLoanOptions.paymentFrequency] - New payment frequency
   * @param {number} [newLoanOptions.closingCosts] - Closing costs for refinancing
   * @param {number} [newLoanOptions.additionalPayment] - Additional payment for new loan
   * @returns {Object} Refinance comparison results
   */
  calculateRefinance(newLoanOptions) {
    if (!newLoanOptions.interestRate && newLoanOptions.interestRate !== 0) {
      throw new Error('New interest rate is required for refinance calculation');
    }
    
    // Return a promise that resolves with the refinance calculation
    return import('./amortization.model.js').then(({ AmortizationSchedule }) => {
      // Create amortization schedule for current loan to get current balance
      const currentSchedule = new AmortizationSchedule(this);
      const currentBalance = currentSchedule.payments.length > 0 ? 
        currentSchedule.payments[0].balance : this.totalLoanAmount;
    
      // Set up new loan options with defaults
      const refinanceOptions = {
        principal: newLoanOptions.principal || currentBalance,
        interestRate: newLoanOptions.interestRate,
        term: newLoanOptions.term || this.term,
        paymentFrequency: newLoanOptions.paymentFrequency || this.paymentFrequency,
        additionalPayment: newLoanOptions.additionalPayment || 0,
        startDate: new Date(),
        name: 'Refinance Option'
      };
      
      // Create new loan
      const newLoan = new Loan(refinanceOptions);
      const newSchedule = new AmortizationSchedule(newLoan);
      
      // Calculate remaining payments and interest on current loan
      const remainingPayments = currentSchedule.payments.length;
      const remainingInterest = currentSchedule.totalInterest;
      
      // Calculate new payments and interest
      const newPayments = newSchedule.payments.length;
      const newInterest = newSchedule.totalInterest;
      
      // Calculate monthly savings
      const oldPayment = this.paymentAmount;
      const newPayment = newLoan.paymentAmount;
      const monthlySavings = oldPayment - newPayment;
      
      // Calculate total cost comparison
      const closingCosts = newLoanOptions.closingCosts || 0;
      const currentTotalCost = remainingInterest + currentBalance;
      const newTotalCost = newInterest + refinanceOptions.principal + closingCosts;
      const lifetimeSavings = currentTotalCost - newTotalCost;
      
      // Calculate break-even point in months
      const breakEvenMonths = monthlySavings > 0 ? 
        Math.ceil(closingCosts / monthlySavings) : Infinity;
      
      return {
        currentLoan: {
          payment: oldPayment,
          remainingBalance: currentBalance,
          remainingPayments,
          remainingInterest,
          totalCost: currentTotalCost
        },
        newLoan: {
          payment: newPayment,
          principal: refinanceOptions.principal,
          term: refinanceOptions.term,
          interestRate: refinanceOptions.interestRate,
          totalPayments: newPayments,
          totalInterest: newInterest,
          totalCost: newTotalCost
        },
        comparison: {
          monthlySavings,
          lifetimeSavings,
          closingCosts,
          breakEvenMonths,
          isWorthwhile: lifetimeSavings > 0 && breakEvenMonths < newPayments
        },
        refinanceLoan: newLoan
      };
    });
  }
}

export default Loan;

// Note: AmortizationSchedule is imported dynamically in methods that need it
// to avoid circular dependency issues