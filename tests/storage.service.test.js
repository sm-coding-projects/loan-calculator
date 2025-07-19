/**
 * Tests for the Storage Service
 * Implements requirement 4.5 - Unit tests for data services
 */

import StorageService from '../src/js/services/storage.service';
import Loan from '../src/js/models/loan.model';
import { AmortizationSchedule } from '../src/js/models/amortization.model';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    // Helper to simulate storage errors
    throwError: jest.fn((errorType) => {
      if (errorType === 'quota') {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        error.code = 22;
        throw error;
      } else if (errorType === 'NS_ERROR_DOM_QUOTA_REACHED') {
        const error = new Error('NS_ERROR_DOM_QUOTA_REACHED');
        error.name = 'NS_ERROR_DOM_QUOTA_REACHED';
        throw error;
      } else {
        throw new Error('Storage error');
      }
    }),
    // Helper to get the raw store for testing
    _getStore: () => store,
  };
})();

// Replace the global localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Storage Service', () => {
  // Clear mock localStorage before each test
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  // Test basic instantiation
  test('should initialize with default values', () => {
    const storageService = new StorageService();

    expect(storageService.storageKey).toBe('loan-calculator-data');
    expect(storageService.version).toBe('1.0');

    // Should initialize storage
    expect(localStorageMock.setItem).toHaveBeenCalled();

    // Check that default structure was created
    const { storageKey } = storageService;
    const storedData = JSON.parse(localStorageMock.getItem(storageKey));

    expect(storedData).toHaveProperty('version', '1.0');
    expect(storedData).toHaveProperty('calculations');
    expect(Array.isArray(storedData.calculations)).toBe(true);
  });

  // Test custom initialization
  test('should initialize with custom values', () => {
    const options = {
      storageKey: 'custom-storage-key',
      version: '2.0',
    };

    const storageService = new StorageService(options);

    expect(storageService.storageKey).toBe('custom-storage-key');
    expect(storageService.version).toBe('2.0');

    // Check that custom structure was created
    const { storageKey } = storageService;
    const storedData = JSON.parse(localStorageMock.getItem(storageKey));

    expect(storedData).toHaveProperty('version', '2.0');
  });

  // Test data migration
  test('should migrate data from older versions', () => {
    // Set up old data
    const oldData = {
      version: '0.9',
      lastUpdated: new Date().toISOString(),
      calculations: [{ id: 'old-calculation' }],
    };

    localStorageMock.setItem('loan-calculator-data', JSON.stringify(oldData));

    // Initialize service, which should trigger migration
    const storageService = new StorageService();

    // Check that data was migrated
    const { storageKey } = storageService;
    const storedData = JSON.parse(localStorageMock.getItem(storageKey));

    expect(storedData).toHaveProperty('version', '1.0');
    expect(storedData.calculations).toHaveLength(1);
    expect(storedData.calculations[0]).toHaveProperty('id', 'old-calculation');
  });

  // Test migration with missing calculations array
  test('should handle migration with missing calculations array', () => {
    // Set up old data without calculations array
    const oldData = {
      version: '0.9',
      lastUpdated: new Date().toISOString(),
      // No calculations array
    };

    localStorageMock.setItem('loan-calculator-data', JSON.stringify(oldData));

    // Initialize service, which should trigger migration
    const storageService = new StorageService();

    // Check that data was migrated and calculations array was added
    const { storageKey } = storageService;
    const storedData = JSON.parse(localStorageMock.getItem(storageKey));

    expect(storedData).toHaveProperty('version', '1.0');
    expect(storedData).toHaveProperty('calculations');
    expect(Array.isArray(storedData.calculations)).toBe(true);
  });

  // Test error during migration
  test('should handle errors during migration', () => {
    // Set up old data
    const oldData = {
      version: '0.9',
      lastUpdated: new Date().toISOString(),
      calculations: [{ id: 'old-calculation' }],
    };

    localStorageMock.setItem('loan-calculator-data', JSON.stringify(oldData));

    // Mock setItem to throw an error during migration
    const originalSetItem = localStorageMock.setItem;
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('Migration error');
    });

    // Initialize service, which should trigger migration
    const storageService = new StorageService();

    // Migration should have failed, but the service should still be created
    expect(storageService).toBeDefined();

    // Restore the original setItem method
    localStorageMock.setItem = originalSetItem;
  });

  // Test saving calculations
  test('should save loan calculations', () => {
    const storageService = new StorageService();

    // Create a loan to save
    const loan = new Loan({
      name: 'Test Loan',
      principal: 200000,
      interestRate: 4.5,
      term: 360,
    });

    // Create an amortization schedule
    const schedule = new AmortizationSchedule(loan);

    // Save the calculation
    const savedId = storageService.saveCalculation(loan, schedule);

    // Verify the ID was returned
    expect(savedId).toBe(loan.id);

    // Verify the data was saved
    const { storageKey } = storageService;
    const storedData = JSON.parse(localStorageMock.getItem(storageKey));

    expect(storedData.calculations).toHaveLength(1);
    expect(storedData.calculations[0].loan.id).toBe(loan.id);
    expect(storedData.calculations[0].loan.name).toBe('Test Loan');
    expect(storedData.calculations[0]).toHaveProperty('amortizationSchedule');
  });

  // Test saving without amortization schedule
  test('should save loan without amortization schedule', () => {
    const storageService = new StorageService();

    // Create a loan to save
    const loan = new Loan({
      name: 'Test Loan',
      principal: 200000,
      interestRate: 4.5,
      term: 360,
    });

    // Save the calculation without a schedule
    const savedId = storageService.saveCalculation(loan);

    // Verify the ID was returned
    expect(savedId).toBe(loan.id);

    // Verify the data was saved
    const { storageKey } = storageService;
    const storedData = JSON.parse(localStorageMock.getItem(storageKey));

    expect(storedData.calculations).toHaveLength(1);
    expect(storedData.calculations[0].loan.id).toBe(loan.id);
    expect(storedData.calculations[0].amortizationSchedule).toBeNull();
  });

  // Test updating an existing calculation
  test('should update an existing calculation', () => {
    const storageService = new StorageService();

    // Create and save a loan
    const loan = new Loan({
      name: 'Original Name',
      principal: 200000,
      interestRate: 4.5,
      term: 360,
    });

    storageService.saveCalculation(loan);

    // Update the loan
    const updatedLoan = loan.update({
      name: 'Updated Name',
      principal: 250000,
    });

    // Update the calculation
    const success = storageService.updateCalculation(loan.id, updatedLoan);

    // Verify the update was successful
    expect(success).toBe(true);

    // Retrieve the updated calculation
    const calculation = storageService.getCalculationById(loan.id);

    // Verify the calculation was updated
    expect(calculation.loan.name).toBe('Updated Name');
    expect(calculation.loan.principal).toBe(250000);
  });

  // Test error handling when saving without loan data
  test('should handle saving without loan data', () => {
    const storageService = new StorageService();

    // Try to save without a loan
    const savedId = storageService.saveCalculation(null);

    // Should return empty string on failure
    expect(savedId).toBe('');
  });

  // Test error handling when storage is not accessible
  test('should handle storage access errors', () => {
    const storageService = new StorageService();

    // Mock getData to return null
    storageService._getData = jest.fn().mockReturnValue(null);

    // Create a loan to save
    const loan = new Loan({
      name: 'Test Loan',
      principal: 200000,
    });

    // Try to save
    const savedId = storageService.saveCalculation(loan);

    // Should return empty string on failure
    expect(savedId).toBe('');
  });

  // Test retrieving calculations
  test('should retrieve all calculations', () => {
    const storageService = new StorageService();

    // Create and save multiple loans
    const loan1 = new Loan({ name: 'Loan 1', principal: 100000 });
    const loan2 = new Loan({ name: 'Loan 2', principal: 200000 });

    storageService.saveCalculation(loan1);
    storageService.saveCalculation(loan2);

    // Retrieve all calculations
    const calculations = storageService.getCalculations();

    // Verify the calculations were retrieved
    expect(calculations).toHaveLength(2);
    expect(calculations[0].loan).toBeInstanceOf(Loan);
    expect(calculations[1].loan).toBeInstanceOf(Loan);
    expect(calculations.map((c) => c.loan.name)).toContain('Loan 1');
    expect(calculations.map((c) => c.loan.name)).toContain('Loan 2');
  });

  // Test retrieving a specific calculation
  test('should retrieve a specific calculation by ID', () => {
    const storageService = new StorageService();

    // Create and save a loan
    const loan = new Loan({
      name: 'Test Loan',
      principal: 200000,
      interestRate: 4.5,
      term: 360,
    });

    const schedule = new AmortizationSchedule(loan);
    storageService.saveCalculation(loan, schedule);

    // Retrieve the calculation by ID
    const calculation = storageService.getCalculationById(loan.id);

    // Verify the calculation was retrieved
    expect(calculation).not.toBeNull();
    expect(calculation.loan).toBeInstanceOf(Loan);
    expect(calculation.loan.id).toBe(loan.id);
    expect(calculation.loan.name).toBe('Test Loan');
    expect(calculation.amortizationSchedule).toBeInstanceOf(AmortizationSchedule);
  });

  // Test retrieving a non-existent calculation
  test('should return null for non-existent calculation ID', () => {
    const storageService = new StorageService();

    // Retrieve a calculation with a non-existent ID
    const calculation = storageService.getCalculationById('non-existent-id');

    // Should return null
    expect(calculation).toBeNull();
  });

  // Test error handling when retrieving without an ID
  test('should handle retrieving without an ID', () => {
    const storageService = new StorageService();

    // Try to retrieve without an ID
    const calculation = storageService.getCalculationById();

    // Should return null
    expect(calculation).toBeNull();
  });

  // Test updating a calculation with new data
  test('should update an existing calculation with new data', () => {
    const storageService = new StorageService();

    // Create and save a loan
    const loan = new Loan({
      name: 'Original Name',
      principal: 200000,
      interestRate: 4.5,
      term: 360,
    });

    storageService.saveCalculation(loan);

    // Update the loan
    const updatedLoan = loan.update({
      name: 'Updated Name',
      principal: 250000,
    });

    // Update the calculation
    const success = storageService.updateCalculation(loan.id, updatedLoan);

    // Verify the update was successful
    expect(success).toBe(true);

    // Retrieve the updated calculation
    const calculation = storageService.getCalculationById(loan.id);

    // Verify the calculation was updated
    expect(calculation.loan.name).toBe('Updated Name');
    expect(calculation.loan.principal).toBe(250000);
  });

  // Test updating with mismatched IDs
  test('should handle updating with mismatched IDs', () => {
    const storageService = new StorageService();

    // Create and save a loan
    const loan = new Loan({
      id: 'original-id',
      name: 'Original Name',
      principal: 200000,
    });

    storageService.saveCalculation(loan);

    // Create an updated loan with a different ID
    const updatedLoan = new Loan({
      id: 'different-id',
      name: 'Updated Name',
      principal: 250000,
    });

    // Update the calculation, passing the original ID
    const success = storageService.updateCalculation('original-id', updatedLoan);

    // Verify the update was successful
    expect(success).toBe(true);

    // Retrieve the updated calculation
    const calculation = storageService.getCalculationById('original-id');

    // Verify the calculation was updated and the ID was preserved
    expect(calculation.loan.id).toBe('original-id');
    expect(calculation.loan.name).toBe('Updated Name');
    expect(calculation.loan.principal).toBe(250000);
  });

  // Test error handling when updating without required parameters
  test('should handle updating without required parameters', () => {
    const storageService = new StorageService();

    // Try to update without an ID
    const success1 = storageService.updateCalculation(null, new Loan());
    expect(success1).toBe(false);

    // Try to update without a loan
    const success2 = storageService.updateCalculation('some-id', null);
    expect(success2).toBe(false);
  });

  // Test deleting a calculation
  test('should delete a calculation', () => {
    const storageService = new StorageService();

    // Create and save a loan
    const loan = new Loan({
      name: 'Test Loan',
      principal: 200000,
    });

    storageService.saveCalculation(loan);

    // Delete the calculation
    const success = storageService.deleteCalculation(loan.id);

    // Verify the deletion was successful
    expect(success).toBe(true);

    // Try to retrieve the deleted calculation
    const calculation = storageService.getCalculationById(loan.id);

    // Verify the calculation was deleted
    expect(calculation).toBeNull();
  });

  // Test deleting a non-existent calculation
  test('should handle deleting a non-existent calculation', () => {
    const storageService = new StorageService();

    // Try to delete a non-existent calculation
    const success = storageService.deleteCalculation('non-existent-id');

    // Should return false
    expect(success).toBe(false);
  });

  // Test error handling when deleting without an ID
  test('should handle deleting without an ID', () => {
    const storageService = new StorageService();

    // Try to delete without an ID
    const success = storageService.deleteCalculation();

    // Should return false
    expect(success).toBe(false);
  });

  // Test clearing all calculations
  test('should clear all calculations', () => {
    const storageService = new StorageService();

    // Create and save multiple loans
    const loan1 = new Loan({ name: 'Loan 1' });
    const loan2 = new Loan({ name: 'Loan 2' });

    storageService.saveCalculation(loan1);
    storageService.saveCalculation(loan2);

    // Clear all calculations
    const success = storageService.clearAllCalculations();

    // Verify the clearing was successful
    expect(success).toBe(true);

    // Retrieve all calculations
    const calculations = storageService.getCalculations();

    // Verify all calculations were cleared
    expect(calculations).toHaveLength(0);
  });

  // Test error handling when clearing with no storage
  test('should handle clearing with no storage', () => {
    const storageService = new StorageService();

    // Mock getData to return null
    storageService._getData = jest.fn().mockReturnValue(null);

    // Try to clear all calculations
    const success = storageService.clearAllCalculations();

    // Should return false
    expect(success).toBe(false);
  });

  // Test storage availability check
  test('should check if storage is available', () => {
    const storageService = new StorageService();

    // Storage should be available in our mock
    expect(storageService.isStorageAvailable()).toBe(true);

    // Mock a storage error
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error('Storage not available');
    });

    // Storage should not be available now
    expect(storageService.isStorageAvailable()).toBe(false);
  });

  // Test storage limit handling
  test('should handle storage limits', () => {
    const storageService = new StorageService();

    // Create some initial data
    const loan1 = new Loan({ name: 'Old Loan', updatedAt: new Date(2020, 0, 1) });
    const loan2 = new Loan({ name: 'New Loan', updatedAt: new Date(2021, 0, 1) });

    storageService.saveCalculation(loan1);
    storageService.saveCalculation(loan2);

    // Mock the setItem method to throw a quota error
    const originalSetItem = localStorageMock.setItem;
    localStorageMock.setItem.mockImplementationOnce(() => {
      localStorageMock.throwError('quota');
    });

    // Try to save another loan, which should trigger the quota error handler
    const loan3 = new Loan({ name: 'Another Loan' });
    storageService.saveCalculation(loan3);

    // Restore the original setItem method
    localStorageMock.setItem = originalSetItem;

    // Verify that the oldest calculation was removed
    const calculations = storageService.getCalculations();
    const names = calculations.map((c) => c.loan.name);

    expect(names).not.toContain('Old Loan'); // Oldest should be removed
    expect(names).toContain('New Loan'); // Newer should be kept
  });

  // Test NS_ERROR_DOM_QUOTA_REACHED error handling
  test('should handle NS_ERROR_DOM_QUOTA_REACHED error', () => {
    const storageService = new StorageService();

    // Create some initial data
    const loan1 = new Loan({ name: 'Old Loan', updatedAt: new Date(2020, 0, 1) });
    const loan2 = new Loan({ name: 'New Loan', updatedAt: new Date(2021, 0, 1) });

    storageService.saveCalculation(loan1);
    storageService.saveCalculation(loan2);

    // Mock the setItem method to throw a NS_ERROR_DOM_QUOTA_REACHED error
    const originalSetItem = localStorageMock.setItem;
    localStorageMock.setItem.mockImplementationOnce(() => {
      localStorageMock.throwError('NS_ERROR_DOM_QUOTA_REACHED');
    });

    // Try to save another loan, which should trigger the quota error handler
    const loan3 = new Loan({ name: 'Another Loan' });
    storageService.saveCalculation(loan3);

    // Restore the original setItem method
    localStorageMock.setItem = originalSetItem;

    // Verify that the oldest calculation was removed
    const calculations = storageService.getCalculations();
    const names = calculations.map((c) => c.loan.name);

    expect(names).not.toContain('Old Loan'); // Oldest should be removed
    expect(names).toContain('New Loan'); // Newer should be kept
  });

  // Test error handling when storage limit handler fails
  test('should handle errors in storage limit handler', () => {
    const storageService = new StorageService();

    // Mock _getData to throw an error during storage limit handling
    storageService._getData = jest.fn().mockImplementationOnce(() => {
      throw new Error('Error in storage limit handler');
    });

    // Mock the setItem method to throw a quota error
    const originalSetItem = localStorageMock.setItem;
    localStorageMock.setItem.mockImplementationOnce(() => {
      localStorageMock.throwError('quota');
    });

    // Try to save a loan, which should trigger the quota error handler
    const loan = new Loan({ name: 'Test Loan' });
    const result = storageService.saveCalculation(loan);

    // Should return empty string on failure
    expect(result).toBe('');

    // Restore the original setItem method
    localStorageMock.setItem = originalSetItem;
  });

  // Test error handling
  test('should handle errors gracefully', () => {
    const storageService = new StorageService();

    // Mock getItem to throw an error
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error('Storage error');
    });

    // These operations should not throw errors, but return fallback values
    expect(() => storageService.getCalculations()).not.toThrow();
    expect(storageService.getCalculations()).toEqual([]);

    expect(() => storageService.getCalculationById('non-existent')).not.toThrow();
    expect(storageService.getCalculationById('non-existent')).toBeNull();

    // Mock setItem to throw an error
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    // These operations should not throw errors, but return failure indicators
    const loan = new Loan({ name: 'Test Loan' });

    expect(() => storageService.saveCalculation(loan)).not.toThrow();
    expect(storageService.saveCalculation(loan)).toBe('');

    expect(() => storageService.updateCalculation('id', loan)).not.toThrow();
    expect(storageService.updateCalculation('id', loan)).toBe(false);

    expect(() => storageService.deleteCalculation('id')).not.toThrow();
    expect(storageService.deleteCalculation('id')).toBe(false);

    expect(() => storageService.clearAllCalculations()).not.toThrow();
    expect(storageService.clearAllCalculations()).toBe(false);

    // Restore normal behavior for subsequent tests
    localStorageMock.setItem.mockRestore();
  });

  // Test storage statistics
  test('should provide storage statistics', () => {
    const storageService = new StorageService();

    // Get storage statistics
    const stats = storageService.getStorageStats();

    // Verify the statistics structure
    expect(stats).toHaveProperty('usedBytes');
    expect(stats).toHaveProperty('usedKB');
    expect(stats).toHaveProperty('totalBytes');
    expect(stats).toHaveProperty('totalKB');
    expect(stats).toHaveProperty('percentUsed');
    expect(stats).toHaveProperty('itemCount');
    expect(stats).toHaveProperty('isNearingLimit');

    // Verify types
    expect(typeof stats.usedBytes).toBe('number');
    expect(typeof stats.usedKB).toBe('number');
    expect(typeof stats.totalBytes).toBe('number');
    expect(typeof stats.totalKB).toBe('number');
    expect(typeof stats.percentUsed).toBe('number');
    expect(typeof stats.itemCount).toBe('number');
    expect(typeof stats.isNearingLimit).toBe('boolean');
  });

  // Test error handling in storage statistics
  test('should handle errors in storage statistics', () => {
    const storageService = new StorageService();

    // Mock _getData to throw an error
    storageService._getData = jest.fn().mockImplementationOnce(() => {
      throw new Error('Error getting storage stats');
    });

    // Get storage statistics
    const stats = storageService.getStorageStats();

    // Should return default values
    expect(stats.usedBytes).toBe(0);
    expect(stats.itemCount).toBe(0);
    expect(stats.isNearingLimit).toBe(false);
  });
});
