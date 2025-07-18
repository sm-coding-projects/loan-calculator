/**
 * Amortization Table Component Tests
 */

import AmortizationTable from '../src/js/components/amortization-table';
import { AmortizationSchedule } from '../src/js/models/amortization.model';
import Loan from '../src/js/models/loan.model';

// Mock formatters
jest.mock('../src/js/utils/formatters.js', () => ({
  formatCurrency: jest.fn(val => `$${val}`),
  formatPercentage: jest.fn(val => `${val}%`),
  formatNumber: jest.fn(val => val.toString()),
  formatDate: jest.fn(date => '01/01/2023')
}));

// Mock DOM elements
document.body.innerHTML = `
  <div id="amortization-table"></div>
`;

describe('AmortizationTable Component', () => {
  let amortizationTable;
  let mockLoan;
  let mockSchedule;
  
  beforeEach(() => {
    // Create a mock loan
    mockLoan = new Loan({
      principal: 200000,
      interestRate: 4.5,
      term: 360, // 30 years
      paymentFrequency: 'monthly'
    });
    
    // Create a mock amortization schedule
    mockSchedule = new AmortizationSchedule(mockLoan);
    
    // Create the component
    amortizationTable = new AmortizationTable({
      container: document.getElementById('amortization-table'),
      pageSize: 12
    });
  });
  
  test('should initialize correctly', () => {
    expect(amortizationTable).toBeDefined();
    expect(amortizationTable.container).toBeDefined();
    expect(amortizationTable.pageSize).toBe(12);
    expect(amortizationTable.currentPage).toBe(1);
    expect(amortizationTable.sortColumn).toBe('number');
    expect(amortizationTable.sortDirection).toBe('asc');
  });
  
  test('should render amortization schedule', () => {
    // Spy on internal methods
    const createTableHeaderSpy = jest.spyOn(amortizationTable, 'createTableHeader');
    const createTableBodySpy = jest.spyOn(amortizationTable, 'createTableBody');
    const createPaginationSpy = jest.spyOn(amortizationTable, 'createPagination');
    
    // Mock updateYearFilterOptions to avoid date issues in tests
    amortizationTable.updateYearFilterOptions = jest.fn();
    
    // Render the schedule
    amortizationTable.render(mockSchedule);
    
    // Verify methods were called
    expect(createTableHeaderSpy).toHaveBeenCalled();
    expect(createTableBodySpy).toHaveBeenCalled();
    expect(createPaginationSpy).toHaveBeenCalled();
    
    // Verify table was created
    const table = amortizationTable.container.querySelector('table');
    expect(table).toBeTruthy();
    expect(table.classList.contains('table')).toBe(true);
    
    // Verify pagination was created
    const pagination = amortizationTable.container.querySelector('.pagination');
    expect(pagination).toBeTruthy();
  });
  
  test('should sort data correctly', () => {
    // Create sample data
    const sampleData = [
      { number: 3, amount: 1000 },
      { number: 1, amount: 3000 },
      { number: 2, amount: 2000 }
    ];
    
    // Sort by number ascending
    let sorted = amortizationTable.sortData(sampleData, 'number', 'asc');
    expect(sorted[0].number).toBe(1);
    expect(sorted[1].number).toBe(2);
    expect(sorted[2].number).toBe(3);
    
    // Sort by number descending
    sorted = amortizationTable.sortData(sampleData, 'number', 'desc');
    expect(sorted[0].number).toBe(3);
    expect(sorted[1].number).toBe(2);
    expect(sorted[2].number).toBe(1);
    
    // Sort by amount ascending
    sorted = amortizationTable.sortData(sampleData, 'amount', 'asc');
    expect(sorted[0].amount).toBe(1000);
    expect(sorted[1].amount).toBe(2000);
    expect(sorted[2].amount).toBe(3000);
  });
  
  test('should filter data correctly', () => {
    // Create sample data with date objects
    const sampleData = [
      { number: 1, amount: 1000, date: new Date(2023, 0, 1) },
      { number: 2, amount: 2000, date: new Date(2023, 1, 1) },
      { number: 3, amount: 3000, date: new Date(2024, 0, 1) },
      { number: 4, amount: 4000, date: new Date(2024, 1, 1) },
      { number: 5, amount: 5000, date: new Date(2025, 0, 1) }
    ];
    
    // Filter by year
    const filters = { year: 2023 };
    const filtered = amortizationTable.filterData(sampleData, filters);
    
    expect(filtered.length).toBe(2);
    expect(filtered[0].date.getFullYear()).toBe(2023);
    expect(filtered[1].date.getFullYear()).toBe(2023);
    
    // Filter by payment range
    const rangeFilters = { paymentRange: { min: 3000, max: 4000 } };
    const rangeFiltered = amortizationTable.filterData(sampleData, rangeFilters);
    
    expect(rangeFiltered.length).toBe(2);
    expect(rangeFiltered[0].amount).toBe(3000);
    expect(rangeFiltered[1].amount).toBe(4000);
  });
  
  test('should paginate data correctly', () => {
    // Create sample data with 25 items and proper date objects
    const sampleData = Array.from({ length: 25 }, (_, i) => ({
      number: i + 1,
      amount: (i + 1) * 1000,
      date: new Date(2023, 0, i + 1),
      principal: (i + 1) * 500,
      interest: (i + 1) * 500,
      balance: 200000 - (i + 1) * 1000
    }));
    
    // Mock updateYearFilterOptions to avoid date issues in tests
    amortizationTable.updateYearFilterOptions = jest.fn();
    
    // Set page size to 10
    amortizationTable.pageSize = 10;
    
    // Set current page to 1
    amortizationTable.currentPage = 1;
    
    // Render with sample data
    amortizationTable.render({ payments: sampleData });
    
    // Check pagination
    const paginationItems = amortizationTable.container.querySelectorAll('.pagination-item');
    expect(paginationItems.length).toBeGreaterThan(0);
    
    // Check that only 10 rows are displayed (plus header row)
    const tableRows = amortizationTable.container.querySelectorAll('tbody tr');
    expect(tableRows.length).toBe(10);
  });
  
  test('should clear table', () => {
    // First render the table
    // Mock updateYearFilterOptions to avoid date issues in tests
    amortizationTable.updateYearFilterOptions = jest.fn();
    
    amortizationTable.render(mockSchedule);
    
    // Then clear it
    amortizationTable.clear();
    
    // Verify table is empty
    expect(amortizationTable.container.innerHTML).toBe('');
  });
});