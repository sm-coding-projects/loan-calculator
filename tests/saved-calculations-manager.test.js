/**
 * Tests for the Saved Calculations Manager component
 */

import SavedCalculationsManager from '../src/js/components/saved-calculations-manager';
import CalculationManagerService from '../src/js/services/calculation-manager.service';
import StorageService from '../src/js/services/storage.service';
import Loan from '../src/js/models/loan.model';
import { AmortizationSchedule } from '../src/js/models/amortization.model';

// Mock the DOM elements
document.body.innerHTML = `
  <div id="saved-calculations-container"></div>
`;

// Mock the storage service
jest.mock('../src/js/services/storage.service');

describe('SavedCalculationsManager', () => {
  let savedCalculationsManager;
  let calculationManager;
  let mockLoan1;
  let mockLoan2;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock loans
    mockLoan1 = new Loan({
      id: 'loan1',
      name: 'Test Loan 1',
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      paymentFrequency: 'monthly',
      paymentAmount: 1013.37
    });
    
    mockLoan2 = new Loan({
      id: 'loan2',
      name: 'Test Loan 2',
      principal: 150000,
      interestRate: 3.75,
      term: 240,
      paymentFrequency: 'monthly',
      paymentAmount: 889.49
    });
    
    // Mock the calculation manager
    calculationManager = new CalculationManagerService();
    calculationManager.getAllCalculations = jest.fn().mockReturnValue([
      {
        loan: mockLoan1,
        savedAt: new Date('2023-01-01'),
        isSelected: false,
        formattedDate: 'Jan 1, 2023'
      },
      {
        loan: mockLoan2,
        savedAt: new Date('2023-01-02'),
        isSelected: false,
        formattedDate: 'Jan 2, 2023'
      }
    ]);
    
    calculationManager.getCalculation = jest.fn().mockImplementation((id) => {
      if (id === 'loan1') {
        return {
          loan: mockLoan1,
          amortizationSchedule: new AmortizationSchedule(mockLoan1),
          savedAt: new Date('2023-01-01')
        };
      } else if (id === 'loan2') {
        return {
          loan: mockLoan2,
          amortizationSchedule: new AmortizationSchedule(mockLoan2),
          savedAt: new Date('2023-01-02')
        };
      }
      return null;
    });
    
    calculationManager.deleteCalculation = jest.fn().mockReturnValue(true);
    calculationManager.selectCalculation = jest.fn().mockReturnValue(true);
    calculationManager.deselectCalculation = jest.fn().mockReturnValue(true);
    calculationManager.clearSelection = jest.fn();
    calculationManager.selectedCalculations = [];
    
    // Create the component
    savedCalculationsManager = new SavedCalculationsManager({
      containerId: 'saved-calculations-container',
      calculationManager: calculationManager,
      onLoadCalculation: jest.fn(),
      onCompareCalculations: jest.fn()
    });
  });
  
  test('should initialize correctly', () => {
    expect(savedCalculationsManager.container).not.toBeNull();
    expect(savedCalculationsManager.calculationsList).not.toBeNull();
    expect(savedCalculationsManager.comparisonView).not.toBeNull();
    expect(calculationManager.getAllCalculations).toHaveBeenCalled();
  });
  
  test('should render calculation cards', () => {
    const cards = document.querySelectorAll('.calculation-card');
    expect(cards.length).toBe(2);
    
    // Check first card content
    const firstCard = cards[0];
    expect(firstCard.querySelector('.calculation-name').textContent).toBe('Test Loan 1');
    expect(firstCard.dataset.id).toBe('loan1');
  });
  
  test('should load a calculation when load button is clicked', () => {
    const loadBtn = document.querySelector('.calculation-card[data-id="loan1"] .load-btn');
    loadBtn.click();
    
    expect(calculationManager.getCalculation).toHaveBeenCalledWith('loan1');
    expect(savedCalculationsManager.onLoadCalculation).toHaveBeenCalled();
  });
  
  test('should delete a calculation when delete button is clicked', () => {
    // Mock confirm to return true
    global.confirm = jest.fn().mockReturnValue(true);
    
    const deleteBtn = document.querySelector('.calculation-card[data-id="loan1"] .delete-btn');
    deleteBtn.click();
    
    expect(global.confirm).toHaveBeenCalled();
    expect(calculationManager.deleteCalculation).toHaveBeenCalledWith('loan1');
    expect(calculationManager.getAllCalculations).toHaveBeenCalled();
  });
  
  test('should select a calculation when checkbox is checked', () => {
    const checkbox = document.querySelector('.calculation-card[data-id="loan1"] .select-checkbox');
    checkbox.checked = true;
    
    // Trigger change event
    const event = new Event('change');
    checkbox.dispatchEvent(event);
    
    expect(calculationManager.selectCalculation).toHaveBeenCalledWith('loan1');
  });
  
  test('should deselect a calculation when checkbox is unchecked', () => {
    // First select it
    const checkbox = document.querySelector('.calculation-card[data-id="loan1"] .select-checkbox');
    checkbox.checked = true;
    let event = new Event('change');
    checkbox.dispatchEvent(event);
    
    // Then deselect it
    checkbox.checked = false;
    event = new Event('change');
    checkbox.dispatchEvent(event);
    
    expect(calculationManager.deselectCalculation).toHaveBeenCalledWith('loan1');
  });
  
  test('should clear selection when clear button is clicked', () => {
    // Mock selected calculations
    calculationManager.selectedCalculations = ['loan1', 'loan2'];
    savedCalculationsManager.updateButtonStates();
    
    const clearBtn = document.getElementById('clear-selection-button');
    clearBtn.click();
    
    expect(calculationManager.clearSelection).toHaveBeenCalled();
  });
  
  test('should show comparison view when compare button is clicked', () => {
    // Mock selected calculations and comparison result
    calculationManager.selectedCalculations = ['loan1', 'loan2'];
    calculationManager.compareCalculations = jest.fn().mockReturnValue({
      success: true,
      comparison: {
        calculations: [
          { id: 'loan1', loan: mockLoan1 },
          { id: 'loan2', loan: mockLoan2 }
        ],
        metrics: [
          { id: 'loan1', name: 'Test Loan 1', loanAmount: 200000, interestRate: 4.5, term: 360, paymentFrequency: 'monthly', paymentAmount: 1013.37, totalInterest: 164813.20, totalPayment: 364813.20 },
          { id: 'loan2', name: 'Test Loan 2', loanAmount: 150000, interestRate: 3.75, term: 240, paymentFrequency: 'monthly', paymentAmount: 889.49, totalInterest: 63477.60, totalPayment: 213477.60 }
        ],
        differences: {
          'loan2': {
            paymentDifference: -123.88,
            interestDifference: -101335.60,
            totalPaymentDifference: -151335.60,
            termDifference: -120
          }
        }
      }
    });
    
    savedCalculationsManager.updateButtonStates();
    
    const compareBtn = document.getElementById('compare-button');
    compareBtn.click();
    
    expect(calculationManager.compareCalculations).toHaveBeenCalled();
    expect(savedCalculationsManager.isComparisonMode).toBe(true);
    expect(savedCalculationsManager.calculationsList.style.display).toBe('none');
    expect(savedCalculationsManager.comparisonView.style.display).toBe('block');
    expect(savedCalculationsManager.onCompareCalculations).toHaveBeenCalled();
  });
  
  test('should hide comparison view when close button is clicked', () => {
    // First show comparison view
    savedCalculationsManager.isComparisonMode = true;
    savedCalculationsManager.calculationsList.style.display = 'none';
    savedCalculationsManager.comparisonView.style.display = 'block';
    
    const closeBtn = document.getElementById('close-comparison-button');
    closeBtn.click();
    
    expect(savedCalculationsManager.isComparisonMode).toBe(false);
    expect(savedCalculationsManager.calculationsList.style.display).toBe('block');
    expect(savedCalculationsManager.comparisonView.style.display).toBe('none');
  });
  
  test('should update button states based on selection', () => {
    // No selections
    calculationManager.selectedCalculations = [];
    savedCalculationsManager.updateButtonStates();
    
    expect(savedCalculationsManager.compareButton.disabled).toBe(true);
    expect(savedCalculationsManager.clearSelectionButton.disabled).toBe(true);
    
    // One selection
    calculationManager.selectedCalculations = ['loan1'];
    savedCalculationsManager.updateButtonStates();
    
    expect(savedCalculationsManager.compareButton.disabled).toBe(true);
    expect(savedCalculationsManager.clearSelectionButton.disabled).toBe(false);
    
    // Two selections
    calculationManager.selectedCalculations = ['loan1', 'loan2'];
    savedCalculationsManager.updateButtonStates();
    
    expect(savedCalculationsManager.compareButton.disabled).toBe(false);
    expect(savedCalculationsManager.clearSelectionButton.disabled).toBe(false);
  });
});