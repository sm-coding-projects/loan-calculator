/**
 * Storage Service
 * Manages saving and retrieving loan calculations
 * Implements requirements 3.1, 3.2, 3.6
 */

import Loan from '../models/loan.model';
import { AmortizationSchedule } from '../models/amortization.model';

class StorageService {
  /**
   * Create a new storage service
   * @param {Object} options - Configuration options
   * @param {string} [options.storageKey] - Key used for localStorage
   * @param {string} [options.version] - Data version for compatibility
   */
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'loan-calculator-data';
    this.version = options.version || '1.0';

    // Initialize storage if needed
    this._initializeStorage();
  }

  /**
   * Initialize the storage with default structure if it doesn't exist
   * @private
   */
  _initializeStorage() {
    try {
      // Check if storage exists
      const data = localStorage.getItem(this.storageKey);

      // If not, create default structure
      if (!data) {
        const defaultData = {
          version: this.version,
          lastUpdated: new Date().toISOString(),
          calculations: [],
        };

        localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
      } else {
        // If it exists but has an old version, migrate it
        const parsedData = JSON.parse(data);
        if (parsedData.version !== this.version) {
          this._migrateData(parsedData);
        }
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  /**
   * Migrate data from an older version to the current version
   * @param {Object} oldData - Data in the old format
   * @private
   */
  _migrateData(oldData) {
    // This is where version-specific migrations would happen
    // For now, we'll just update the version and save it back

    const migratedData = {
      ...oldData,
      version: this.version,
      lastUpdated: new Date().toISOString(),
    };

    // Ensure calculations array exists
    if (!migratedData.calculations) {
      migratedData.calculations = [];
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(migratedData));
      console.log(`Storage data migrated to version ${this.version}`);
    } catch (error) {
      console.error('Error migrating storage data:', error);
    }
  }

  /**
   * Get all stored data
   * @returns {Object} The full storage data object
   * @private
   */
  _getData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  }

  /**
   * Save data to storage
   * @param {Object} data - Data to save
   * @returns {boolean} Success status
   * @private
   */
  _saveData(data) {
    try {
      // Update the last updated timestamp
      data.lastUpdated = new Date().toISOString();

      // Save to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      // Handle storage errors (e.g., quota exceeded)
      console.error('Error saving to storage:', error);

      // If it's a quota error, try to free up space
      if (error.name === 'QuotaExceededError'
          || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
          || error.code === 22) {
        this._handleStorageLimit();
      }

      return false;
    }
  }

  /**
   * Handle storage limit errors by removing oldest calculations
   * @private
   */
  _handleStorageLimit() {
    try {
      const data = this._getData();

      if (data && data.calculations && data.calculations.length > 0) {
        // Sort calculations by date (oldest first)
        data.calculations.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

        // Remove the oldest calculation
        data.calculations.shift();

        // Try to save again
        this._saveData(data);

        console.warn('Storage limit reached. Removed oldest calculation to free space.');
      }
    } catch (error) {
      console.error('Error handling storage limit:', error);
    }
  }

  /**
   * Save a loan calculation to storage
   * @param {Loan} loan - Loan object to save
   * @param {AmortizationSchedule} [amortizationSchedule] - Optional amortization schedule
   * @returns {string} ID of the saved calculation or empty string if failed
   */
  saveCalculation(loan, amortizationSchedule = null) {
    try {
      if (!loan) {
        throw new Error('No loan data provided');
      }

      // Get current data
      const data = this._getData();
      if (!data) {
        throw new Error('Could not access storage');
      }

      // Prepare calculation object
      const calculationData = {
        loan: loan.toJSON(),
        amortizationSchedule: amortizationSchedule ? amortizationSchedule.toJSON() : null,
        savedAt: new Date().toISOString(),
      };

      // Check if this is an update or a new calculation
      const existingIndex = data.calculations.findIndex((calc) => calc.loan.id === loan.id);

      if (existingIndex >= 0) {
        // Update existing calculation
        data.calculations[existingIndex] = calculationData;
      } else {
        // Add new calculation
        data.calculations.push(calculationData);
      }

      // Save back to storage
      if (this._saveData(data)) {
        return loan.id;
      }
      throw new Error('Failed to save calculation');
    } catch (error) {
      console.error('Error saving calculation:', error);
      return '';
    }
  }

  /**
   * Get all saved calculations
   * @returns {Array} Array of loan objects
   */
  getCalculations() {
    try {
      const data = this._getData();

      if (!data || !data.calculations) {
        return [];
      }

      // Convert stored JSON back to Loan objects
      return data.calculations.map((calc) => {
        const loan = Loan.fromJSON(calc.loan);
        return {
          loan,
          savedAt: new Date(calc.savedAt),
        };
      });
    } catch (error) {
      console.error('Error retrieving calculations:', error);
      return [];
    }
  }

  /**
   * Get a specific calculation by ID
   * @param {string} id - ID of the calculation to retrieve
   * @returns {Object|null} Object with loan and amortizationSchedule properties, or null if not found
   */
  getCalculationById(id) {
    try {
      if (!id) {
        throw new Error('No ID provided');
      }

      const data = this._getData();

      if (!data || !data.calculations) {
        return null;
      }

      // Find the calculation with the matching ID
      const calculationData = data.calculations.find((calc) => calc.loan.id === id);

      if (!calculationData) {
        return null;
      }

      // Convert stored JSON back to objects
      const loan = Loan.fromJSON(calculationData.loan);
      let amortizationSchedule = null;

      if (calculationData.amortizationSchedule) {
        amortizationSchedule = AmortizationSchedule.fromJSON(
          calculationData.amortizationSchedule,
          loan,
        );
      }

      return {
        loan,
        amortizationSchedule,
        savedAt: new Date(calculationData.savedAt),
      };
    } catch (error) {
      console.error('Error retrieving calculation by ID:', error);
      return null;
    }
  }

  /**
   * Update an existing calculation
   * @param {string} id - ID of the calculation to update
   * @param {Loan} updatedLoan - Updated loan object
   * @param {AmortizationSchedule} [updatedSchedule] - Updated amortization schedule
   * @returns {boolean} Success status
   */
  updateCalculation(id, updatedLoan, updatedSchedule = null) {
    try {
      if (!id || !updatedLoan) {
        throw new Error('ID and updated loan data are required');
      }

      // Ensure the ID matches
      if (updatedLoan.id !== id) {
        updatedLoan.id = id;
      }

      // Use the save method to update
      const result = this.saveCalculation(updatedLoan, updatedSchedule);
      return result === id;
    } catch (error) {
      console.error('Error updating calculation:', error);
      return false;
    }
  }

  /**
   * Delete a calculation by ID
   * @param {string} id - ID of the calculation to delete
   * @returns {boolean} Success status
   */
  deleteCalculation(id) {
    try {
      if (!id) {
        throw new Error('No ID provided');
      }

      const data = this._getData();

      if (!data || !data.calculations) {
        return false;
      }

      // Find the index of the calculation with the matching ID
      const index = data.calculations.findIndex((calc) => calc.loan.id === id);

      if (index === -1) {
        return false;
      }

      // Remove the calculation
      data.calculations.splice(index, 1);

      // Save back to storage
      return this._saveData(data);
    } catch (error) {
      console.error('Error deleting calculation:', error);
      return false;
    }
  }

  /**
   * Clear all saved calculations
   * @returns {boolean} Success status
   */
  clearAllCalculations() {
    try {
      const data = this._getData();

      if (!data) {
        return false;
      }

      // Clear the calculations array
      data.calculations = [];

      // Save back to storage
      return this._saveData(data);
    } catch (error) {
      console.error('Error clearing calculations:', error);
      return false;
    }
  }

  /**
   * Check if local storage is available
   * @returns {boolean} Whether storage is available
   */
  isStorageAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      const result = localStorage.getItem(testKey) === testKey;
      localStorage.removeItem(testKey);
      return result;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get storage usage statistics
   * @returns {Object} Storage statistics including used space, available space, and item count
   */
  getStorageStats() {
    try {
      // Get all data
      const allData = this._getData();
      const serializedData = JSON.stringify(allData);

      // Calculate size in bytes
      const usedBytes = new Blob([serializedData]).size;

      // Estimate total available space (5MB is typical for most browsers)
      const totalBytes = 5 * 1024 * 1024;

      return {
        usedBytes,
        usedKB: Math.round(usedBytes / 1024),
        totalBytes,
        totalKB: Math.round(totalBytes / 1024),
        percentUsed: Math.round((usedBytes / totalBytes) * 100),
        itemCount: allData && allData.calculations ? allData.calculations.length : 0,
        isNearingLimit: usedBytes > (totalBytes * 0.8), // Warning at 80% usage
      };
    } catch (error) {
      console.error('Error calculating storage stats:', error);
      return {
        usedBytes: 0,
        usedKB: 0,
        totalBytes: 0,
        totalKB: 0,
        percentUsed: 0,
        itemCount: 0,
        isNearingLimit: false,
      };
    }
  }
}

export default StorageService;
