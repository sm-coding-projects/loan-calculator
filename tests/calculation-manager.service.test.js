/**
 * Tests for the Calculation Manager Service
 * Implements requirements 4.5, 4.7 - Unit tests for data services and error handling
 */

import CalculationManagerService from '../src/js/services/calculation-manager.service';
import StorageService from '../src/js/services/storage.service';
import Loan from '../src/js/models/loan.model';
import { AmortizationSchedule } from '../src/js/models/amortization.model';

// Mock the localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    getAll: () => store
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('CalculationManagerService', () => {
  let calculationManager;
  let storageService;
  let testLoan1;
  let testLoan2;
  let testLoan3;
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Create a storage service
    storageService = new StorageService();
    
    // Create the calculation manager
    calculationManager = new CalculationManagerService({
      storageService
    });
    
    // Create test loans with fixed IDs for testing
    testLoan1 = new Loan({
      id: 'test-loan-1',
      name: 'Test Loan 1',
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      paymentFrequency: 'monthly'
    });
    
    testLoan2 = new Loan({
      id: 'test-loan-2',
      name: 'Test Loan 2',
      principal: 250000,
      interestRate: 4.0,
      term: 360,
      paymentFrequency: 'monthly'
    });
    
    testLoan3 = new Loan({
      id: 'test-loan-3',
      name: 'Test Loan 3',
      principal: 150000,
      interestRate: 5.0,
      term: 180,
      paymentFrequency: 'monthly'
    });
    
    // Save the test loans
    storageService.saveCalculation(testLoan1);
    storageService.saveCalculation(testLoan2);
    storageService.saveCalculation(testLoan3);
  });
  
  test('should retrieve all calculations', () => {
    const calculations = calculationManager.getAllCalculations();
    expect(calculations.length).toBe(3);
    expect(calculations.some(calc => calc.loan.id === 'test-loan-1')).toBe(true);
    expect(calculations.some(calc => calc.loan.id === 'test-loan-2')).toBe(true);
    expect(calculations.some(calc => calc.loan.id === 'test-loan-3')).toBe(true);
  });
  
  test('should retrieve a specific calculation by ID', () => {
    const calculation = calculationManager.getCalculation('test-loan-1');
    expect(calculation).toBeTruthy();
    expect(calculation.loan.id).toBe('test-loan-1');
    expect(calculation.loan.name).toBe('Test Loan 1');
  });
  
  test('should save a calculation with a custom name', () => {
    const newLoan = new Loan({
      principal: 300000,
      interestRate: 3.75,
      term: 360
    });
    
    const id = calculationManager.saveCalculation(newLoan, null, 'My Custom Name');
    const savedCalculation = calculationManager.getCalculation(id);
    
    expect(savedCalculation).toBeTruthy();
    expect(savedCalculation.loan.name).toBe('My Custom Name');
  });
  
  test('should update an existing calculation', () => {
    const success = calculationManager.updateCalculation('test-loan-1', {
      name: 'Updated Name',
      loanUpdates: {
        interestRate: 3.9
      }
    });
    
    expect(success).toBe(true);
    
    const updatedCalculation = calculationManager.getCalculation('test-loan-1');
    expect(updatedCalculation.loan.name).toBe('Updated Name');
    expect(updatedCalculation.loan.interestRate).toBe(3.9);
  });
  
  test('should delete a calculation', () => {
    const success = calculationManager.deleteCalculation('test-loan-3');
    expect(success).toBe(true);
    
    const calculations = calculationManager.getAllCalculations();
    expect(calculations.length).toBe(2);
    expect(calculations.some(calc => calc.loan.id === 'test-loan-3')).toBe(false);
  });
  
  test('should select and deselect calculations for comparison', () => {
    // Select two calculations
    calculationManager.selectCalculation('test-loan-1');
    calculationManager.selectCalculation('test-loan-2');
    
    // Check if they're selected
    expect(calculationManager.isSelected('test-loan-1')).toBe(true);
    expect(calculationManager.isSelected('test-loan-2')).toBe(true);
    expect(calculationManager.isSelected('test-loan-3')).toBe(false);
    
    // Deselect one
    calculationManager.deselectCalculation('test-loan-1');
    
    // Check selection status
    expect(calculationManager.isSelected('test-loan-1')).toBe(false);
    expect(calculationManager.isSelected('test-loan-2')).toBe(true);
    
    // Clear all selections
    calculationManager.clearSelection();
    expect(calculationManager.isSelected('test-loan-2')).toBe(false);
  });
  
  test('should limit the number of selected calculations', () => {
    // Set max comparisons to 2
    calculationManager = new CalculationManagerService({
      storageService,
      maxComparisons: 2
    });
    
    // Select two calculations
    const result1 = calculationManager.selectCalculation('test-loan-1');
    const result2 = calculationManager.selectCalculation('test-loan-2');
    
    // Try to select a third one
    const result3 = calculationManager.selectCalculation('test-loan-3');
    
    expect(result1).toBe(true);
    expect(result2).toBe(true);
    expect(result3).toBe(false); // Should fail because we reached the limit
    
    // Check selection status
    expect(calculationManager.isSelected('test-loan-1')).toBe(true);
    expect(calculationManager.isSelected('test-loan-2')).toBe(true);
    expect(calculationManager.isSelected('test-loan-3')).toBe(false);
  });
  
  test('should compare selected calculations', () => {
    // Select two calculations
    calculationManager.selectCalculation('test-loan-1');
    calculationManager.selectCalculation('test-loan-2');
    
    // Compare them
    const result = calculationManager.compareCalculations();
    
    expect(result.success).toBe(true);
    expect(result.comparison.calculations.length).toBe(2);
    expect(result.comparison.metrics.length).toBe(2);
    expect(Object.keys(result.comparison.differences).length).toBe(1);
    
    // Check that differences were calculated
    const diff = result.comparison.differences['test-loan-2'];
    expect(diff).toBeTruthy();
    expect(diff.paymentDifference).toBeDefined();
    expect(diff.interestDifference).toBeDefined();
  });
  
  test('should require at least two calculations for comparison', () => {
    // Select only one calculation
    calculationManager.selectCalculation('test-loan-1');
    
    // Try to compare
    const result = calculationManager.compareCalculations();
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('At least two calculations');
  });

  test('should handle non-existent calculation ID', () => {
    const calculation = calculationManager.getCalculation('non-existent-id');
    expect(calculation).toBeNull();
  });

  test('should handle update of non-existent calculation', () => {
    const success = calculationManager.updateCalculation('non-existent-id', {
      name: 'Updated Name'
    });
    
    expect(success).toBe(false);
  });

  test('should handle deletion of non-existent calculation', () => {
    const success = calculationManager.deleteCalculation('non-existent-id');
    expect(success).toBe(false);
  });

  test('should get selected calculations', () => {
    calculationManager.selectCalculation('test-loan-1');
    calculationManager.selectCalculation('test-loan-2');
    
    const selectedCalculations = calculationManager.getSelectedCalculations();
    
    expect(selectedCalculations.length).toBe(2);
    expect(selectedCalculations[0].id).toBe('test-loan-1');
    expect(selectedCalculations[1].id).toBe('test-loan-2');
  });

  test('should filter out non-existent calculations from selection', () => {
    calculationManager.selectCalculation('test-loan-1');
    calculationManager.selectCalculation('non-existent-id');
    
    const selectedCalculations = calculationManager.getSelectedCalculations();
    
    expect(selectedCalculations.length).toBe(1);
    expect(selectedCalculations[0].id).toBe('test-loan-1');
  });

  test('should get storage statistics', () => {
    const stats = calculationManager.getStorageStats();
    
    expect(stats).toBeDefined();
    expect(stats.itemCount).toBe(3); // We have 3 test loans
    expect(typeof stats.usedBytes).toBe('number');
    expect(typeof stats.percentUsed).toBe('number');
  });

  test('should organize calculations by category (placeholder)', () => {
    // This is testing a placeholder function that will be implemented in the future
    const result = calculationManager.organizeCalculations(['test-loan-1', 'test-loan-2'], 'My Category');
    expect(result).toBe(true);
  });

  test('should format date correctly', () => {
    const date = new Date('2023-01-15T12:30:00');
    const formattedDate = calculationManager._formatDate(date);
    
    expect(formattedDate).toContain('2023');
    expect(formattedDate).toContain('Jan');
    expect(formattedDate).toContain('15');
  });

  test('should handle null date in format function', () => {
    const formattedDate = calculationManager._formatDate(null);
    expect(formattedDate).toBe('');
  });

  test('should generate comparison metrics', () => {
    const calculations = [
      {
        id: 'test-loan-1',
        loan: testLoan1,
        amortizationSchedule: new AmortizationSchedule(testLoan1)
      },
      {
        id: 'test-loan-2',
        loan: testLoan2,
        amortizationSchedule: new AmortizationSchedule(testLoan2)
      }
    ];
    
    const metrics = calculationManager._generateComparisonMetrics(calculations);
    
    expect(metrics.length).toBe(2);
    expect(metrics[0].id).toBe('test-loan-1');
    expect(metrics[0].principal).toBe(200000);
    expect(metrics[1].id).toBe('test-loan-2');
    expect(metrics[1].principal).toBe(250000);
  });

  test('should calculate differences between calculations', () => {
    const calculations = [
      {
        id: 'test-loan-1',
        loan: testLoan1,
        amortizationSchedule: new AmortizationSchedule(testLoan1)
      },
      {
        id: 'test-loan-2',
        loan: testLoan2,
        amortizationSchedule: new AmortizationSchedule(testLoan2)
      }
    ];
    
    const differences = calculationManager._calculateDifferences(calculations);
    
    expect(Object.keys(differences).length).toBe(1);
    expect(differences['test-loan-2']).toBeDefined();
    expect(differences['test-loan-2'].paymentDifference).toBeDefined();
    expect(differences['test-loan-2'].interestDifference).toBeDefined();
    expect(differences['test-loan-2'].termDifference).toBe(0); // Both have 360 month terms
  });

  test('should handle empty array in calculate differences', () => {
    const differences = calculationManager._calculateDifferences([]);
    expect(Object.keys(differences).length).toBe(0);
  });

  test('should handle single calculation in calculate differences', () => {
    const calculations = [
      {
        id: 'test-loan-1',
        loan: testLoan1,
        amortizationSchedule: new AmortizationSchedule(testLoan1)
      }
    ];
    
    const differences = calculationManager._calculateDifferences(calculations);
    expect(Object.keys(differences).length).toBe(0);
  });

  test('should calculate differences without amortization schedules', () => {
    const calculations = [
      {
        id: 'test-loan-1',
        loan: testLoan1
      },
      {
        id: 'test-loan-2',
        loan: testLoan2
      }
    ];
    
    const differences = calculationManager._calculateDifferences(calculations);
    
    expect(Object.keys(differences).length).toBe(1);
    expect(differences['test-loan-2']).toBeDefined();
    expect(differences['test-loan-2'].paymentDifference).toBeDefined();
    expect(differences['test-loan-2'].interestDifference).toBeDefined();
  });
});