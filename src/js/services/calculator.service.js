/**
 * Calculator Service
 * Handles loan calculations and amortization schedule generation
 */

class CalculatorService {
  constructor() {
    // Service will be implemented in task 2.2 and 2.3
    console.log('Calculator Service initialized');
  }
  
  calculatePayment(principal, rate, term, frequency) {
    // Payment calculation will be implemented in task 2.2
    return 0;
  }
  
  calculateAmortizationSchedule(principal, rate, term, frequency, additionalPayments) {
    // Amortization schedule calculation will be implemented in task 2.2
    return [];
  }
  
  calculateAffordability(desiredPayment, rate, term) {
    // Affordability calculation will be implemented in task 2.3
    return 0;
  }
  
  calculateRefinance(currentLoan, newRate, newTerm, closingCosts) {
    // Refinance calculation will be implemented in task 2.3
    return {};
  }
  
  calculateComparison(loanScenarios) {
    // Comparison calculation will be implemented in task 2.3
    return {};
  }
  
  /**
   * Calculate inflation-adjusted values for an amortization schedule
   * @param {AmortizationSchedule} schedule - Amortization schedule
   * @param {number} inflationRate - Annual inflation rate as a percentage (e.g., 2.5 for 2.5%)
   * @returns {Array} Array of inflation-adjusted payment objects
   */
  calculateInflationAdjusted(schedule, inflationRate) {
    if (!schedule || !schedule.payments || !Array.isArray(schedule.payments) || schedule.payments.length === 0) {
      return [];
    }
    
    // Convert annual inflation rate to monthly rate
    const monthlyInflationRate = Math.pow(1 + (inflationRate / 100), 1/12) - 1;
    
    // Clone the payments array to avoid modifying the original
    const adjustedPayments = schedule.payments.map((payment, index) => {
      // Calculate inflation factor based on payment number
      // The first payment is not adjusted (factor = 1)
      const inflationFactor = Math.pow(1 + monthlyInflationRate, -index);
      
      // Create a new payment object with adjusted values
      return {
        ...payment,
        inflationAdjustedAmount: payment.amount * inflationFactor,
        inflationAdjustedPrincipal: payment.principal * inflationFactor,
        inflationAdjustedInterest: payment.interest * inflationFactor,
        inflationFactor: inflationFactor,
        originalAmount: payment.amount,
        originalPrincipal: payment.principal,
        originalInterest: payment.interest
      };
    });
    
    // Calculate totals
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
        inflationRate
      }
    };
  }
}

export default CalculatorService;