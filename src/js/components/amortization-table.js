/**
 * Amortization Table Component
 * Displays detailed payment schedule
 * Implements requirement 2.2
 */

import * as formatters from '../utils/formatters.js';

class AmortizationTable {
  /**
   * Create a new amortization table component
   * @param {Object} options - Configuration options
   * @param {HTMLElement} [options.container] - Container element
   * @param {Object} [options.formatters] - Custom formatters
   * @param {number} [options.pageSize] - Number of items per page
   */
  constructor(options = {}) {
    this.container = options.container || document.getElementById('amortization-table');
    this.formatters = {
      currency: formatters.formatCurrency,
      percentage: formatters.formatPercentage,
      number: formatters.formatNumber,
      date: formatters.formatDate,
      ...options.formatters,
    };
    this.pageSize = options.pageSize || 12;
    this.currentPage = 1;
    this.sortColumn = 'number';
    this.sortDirection = 'asc';
    this.filters = {};
    this.currentData = [];

    this.init();
  }

  /**
   * Initialize the component
   */
  init() {
    if (!this.container) {
      console.error('Amortization table container not found');
      return;
    }

    // Create filter controls
    this.createFilterControls();
  }

  /**
   * Create filter controls for the table
   */
  createFilterControls() {
    const filterControls = document.createElement('div');
    filterControls.className = 'filter-controls';
    filterControls.innerHTML = `
      <div class="filter-row">
        <div class="filter-group">
          <label for="year-filter">Filter by Year:</label>
          <select id="year-filter">
            <option value="">All Years</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="payment-range">Payment Range:</label>
          <input type="number" id="min-payment" placeholder="Min" min="0" step="100">
          <span>to</span>
          <input type="number" id="max-payment" placeholder="Max" min="0" step="100">
        </div>
        <button id="apply-filters" class="btn-filter">Apply Filters</button>
        <button id="reset-filters" class="btn-filter">Reset</button>
      </div>
    `;

    // Add event listeners for filter controls
    const applyButton = filterControls.querySelector('#apply-filters');
    const resetButton = filterControls.querySelector('#reset-filters');

    if (applyButton) {
      applyButton.addEventListener('click', () => this.applyFilters());
    }

    if (resetButton) {
      resetButton.addEventListener('click', () => this.resetFilters());
    }

    // Store filter controls for later use
    this.filterControls = filterControls;
  }

  /**
   * Apply filters to the table data
   */
  applyFilters() {
    if (!this.filterControls) return;

    const yearFilter = this.filterControls.querySelector('#year-filter').value;
    const minPayment = parseFloat(this.filterControls.querySelector('#min-payment').value) || 0;
    const maxPayment = parseFloat(this.filterControls.querySelector('#max-payment').value) || Infinity;

    this.filters = {};

    if (yearFilter) {
      this.filters.year = parseInt(yearFilter);
    }

    if (minPayment > 0 || maxPayment < Infinity) {
      this.filters.paymentRange = { min: minPayment, max: maxPayment };
    }

    // Re-render with current data and new filters
    if (this.currentData.length > 0) {
      this.render({ payments: this.currentData });
    }
  }

  /**
   * Reset all filters
   */
  resetFilters() {
    if (!this.filterControls) return;

    // Reset filter form
    this.filterControls.querySelector('#year-filter').value = '';
    this.filterControls.querySelector('#min-payment').value = '';
    this.filterControls.querySelector('#max-payment').value = '';

    // Clear filters object
    this.filters = {};

    // Re-render with current data
    if (this.currentData.length > 0) {
      this.render({ payments: this.currentData });
    }
  }

  /**
   * Update year filter options based on available data
   * @param {Array} payments - Payment data
   */
  updateYearFilterOptions(payments) {
    if (!this.filterControls) return;

    const yearFilter = this.filterControls.querySelector('#year-filter');
    if (!yearFilter) return;

    // Clear existing options except the first one
    while (yearFilter.options.length > 1) {
      yearFilter.remove(1);
    }

    // Get unique years from payments
    const years = [...new Set(payments.map((payment) => payment.date.getFullYear()))].sort();

    // Add year options
    years.forEach((year) => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearFilter.appendChild(option);
    });
  }

  /**
   * Render the amortization schedule
   * @param {Object} amortizationSchedule - Amortization schedule object
   */
  render(amortizationSchedule) {
    if (!this.container || !amortizationSchedule) {
      return;
    }

    // Store the full data set
    this.currentData = amortizationSchedule.payments || [];

    // Clear the container
    this.container.innerHTML = '';

    // Add filter controls
    this.container.appendChild(this.filterControls);

    // Update year filter options
    this.updateYearFilterOptions(this.currentData);

    // Create table container
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';

    // Create table
    const table = document.createElement('table');
    table.className = 'table table-responsive';

    // Create table header
    const tableHeader = this.createTableHeader();
    table.appendChild(tableHeader);

    // Filter and sort data
    const filteredData = this.filterData(this.currentData, this.filters);
    const sortedData = this.sortData(filteredData, this.sortColumn, this.sortDirection);

    // Paginate data
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const paginatedData = sortedData.slice(startIndex, endIndex);

    // Create table body
    const tableBody = this.createTableBody(paginatedData);
    table.appendChild(tableBody);

    // Add table to container
    tableContainer.appendChild(table);
    this.container.appendChild(tableContainer);

    // Create pagination
    this.createPagination(sortedData.length);

    // Add highlighting for key information
    this.highlightKeyInformation();
  }

  /**
   * Create the table header
   * @returns {HTMLTableSectionElement} Table header element
   */
  createTableHeader() {
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // Define columns
    const columns = [
      { id: 'number', label: '#', sortable: true },
      { id: 'date', label: 'Date', sortable: true },
      { id: 'amount', label: 'Payment', sortable: true },
      { id: 'principal', label: 'Principal', sortable: true },
      { id: 'interest', label: 'Interest', sortable: true },
      { id: 'balance', label: 'Remaining Balance', sortable: true },
    ];

    // Create header cells
    columns.forEach((column) => {
      const th = document.createElement('th');
      th.textContent = column.label;

      if (column.sortable) {
        th.className = 'sortable';

        // Add sort indicator if this is the current sort column
        if (column.id === this.sortColumn) {
          th.classList.add(this.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
        }

        // Add click event for sorting
        th.addEventListener('click', () => {
          // Toggle direction if already sorting by this column
          if (this.sortColumn === column.id) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            this.sortColumn = column.id;
            this.sortDirection = 'asc';
          }

          // Re-render with new sort
          this.render({ payments: this.currentData });
        });
      }

      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    return thead;
  }

  /**
   * Create the table body
   * @param {Array} payments - Payment data
   * @returns {HTMLTableSectionElement} Table body element
   */
  createTableBody(payments) {
    const tbody = document.createElement('tbody');

    if (!payments || payments.length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = 6;
      emptyCell.textContent = 'No payment data available';
      emptyCell.className = 'empty-table-message';
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
      return tbody;
    }

    // Create rows for each payment
    payments.forEach((payment) => {
      const row = document.createElement('tr');

      // Add data cells
      const cells = [
        { value: payment.number },
        { value: this.formatters.date(payment.date) },
        { value: this.formatters.currency(payment.amount), raw: payment.amount },
        { value: this.formatters.currency(payment.principal), raw: payment.principal },
        { value: this.formatters.currency(payment.interest), raw: payment.interest },
        { value: this.formatters.currency(payment.balance), raw: payment.balance },
      ];

      cells.forEach((cell, index) => {
        const td = document.createElement('td');
        td.textContent = cell.value;

        // Add data attributes for sorting and filtering
        if (cell.raw !== undefined) {
          td.setAttribute('data-value', cell.raw);
        }

        // Add class for the column type
        const columnTypes = ['number', 'date', 'amount', 'principal', 'interest', 'balance'];
        td.classList.add(`col-${columnTypes[index]}`);

        row.appendChild(td);
      });

      // Add data attributes to the row for filtering
      row.setAttribute('data-payment-number', payment.number);
      row.setAttribute('data-payment-year', payment.date.getFullYear());
      row.setAttribute('data-payment-month', payment.date.getMonth() + 1);

      tbody.appendChild(row);
    });

    return tbody;
  }

  /**
   * Create pagination controls
   * @param {number} totalItems - Total number of items
   */
  createPagination(totalItems) {
    if (!this.container) return;

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / this.pageSize);

    // Don't show pagination if only one page
    if (totalPages <= 1) {
      return;
    }

    // Create pagination container
    const pagination = document.createElement('div');
    pagination.className = 'pagination';

    // Previous button
    const prevButton = document.createElement('div');
    prevButton.className = 'pagination-item';
    prevButton.textContent = '«';
    prevButton.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.render({ payments: this.currentData });
      }
    });
    pagination.appendChild(prevButton);

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page button if not visible
    if (startPage > 1) {
      const firstPageButton = document.createElement('div');
      firstPageButton.className = 'pagination-item';
      firstPageButton.textContent = '1';
      firstPageButton.addEventListener('click', () => {
        this.currentPage = 1;
        this.render({ payments: this.currentData });
      });
      pagination.appendChild(firstPageButton);

      // Ellipsis if needed
      if (startPage > 2) {
        const ellipsis = document.createElement('div');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        pagination.appendChild(ellipsis);
      }
    }

    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
      const pageButton = document.createElement('div');
      pageButton.className = 'pagination-item';
      if (i === this.currentPage) {
        pageButton.classList.add('active');
      }
      pageButton.textContent = i;
      pageButton.addEventListener('click', () => {
        this.currentPage = i;
        this.render({ payments: this.currentData });
      });
      pagination.appendChild(pageButton);
    }

    // Last page button if not visible
    if (endPage < totalPages) {
      // Ellipsis if needed
      if (endPage < totalPages - 1) {
        const ellipsis = document.createElement('div');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        pagination.appendChild(ellipsis);
      }

      const lastPageButton = document.createElement('div');
      lastPageButton.className = 'pagination-item';
      lastPageButton.textContent = totalPages;
      lastPageButton.addEventListener('click', () => {
        this.currentPage = totalPages;
        this.render({ payments: this.currentData });
      });
      pagination.appendChild(lastPageButton);
    }

    // Next button
    const nextButton = document.createElement('div');
    nextButton.className = 'pagination-item';
    nextButton.textContent = '»';
    nextButton.addEventListener('click', () => {
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.render({ payments: this.currentData });
      }
    });
    pagination.appendChild(nextButton);

    // Add pagination to container
    this.container.appendChild(pagination);
  }

  /**
   * Sort data by column
   * @param {Array} data - Data to sort
   * @param {string} column - Column to sort by
   * @param {string} direction - Sort direction ('asc' or 'desc')
   * @returns {Array} Sorted data
   */
  sortData(data, column, direction) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    const sortedData = [...data];

    sortedData.sort((a, b) => {
      let valueA; let
        valueB;

      // Get values based on column
      switch (column) {
        case 'date':
          valueA = a.date.getTime();
          valueB = b.date.getTime();
          break;
        case 'number':
        case 'amount':
        case 'principal':
        case 'interest':
        case 'balance':
          valueA = a[column];
          valueB = b[column];
          break;
        default:
          valueA = a.number;
          valueB = b.number;
      }

      // Compare values
      if (valueA < valueB) {
        return direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sortedData;
  }

  /**
   * Filter data based on criteria
   * @param {Array} data - Data to filter
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered data
   */
  filterData(data, filters) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    if (!filters || Object.keys(filters).length === 0) {
      return data;
    }

    return data.filter((payment) => {
      // Filter by year
      if (filters.year && payment.date.getFullYear() !== filters.year) {
        return false;
      }

      // Filter by payment range
      if (filters.paymentRange) {
        const { min, max } = filters.paymentRange;
        if (payment.amount < min || payment.amount > max) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Highlight key information in the table
   */
  highlightKeyInformation() {
    if (!this.container) return;

    // Highlight rows with significant principal reduction
    const rows = this.container.querySelectorAll('tbody tr');
    rows.forEach((row) => {
      const principalCell = row.querySelector('.col-principal');
      const interestCell = row.querySelector('.col-interest');

      if (principalCell && interestCell) {
        const principal = parseFloat(principalCell.getAttribute('data-value') || 0);
        const interest = parseFloat(interestCell.getAttribute('data-value') || 0);

        // If principal is significantly higher than interest
        if (principal > interest * 2) {
          row.classList.add('highlight-principal');
          principalCell.setAttribute('title', 'Significant principal reduction');
        }

        // If interest is higher than principal
        if (interest > principal) {
          row.classList.add('highlight-interest');
          interestCell.setAttribute('title', 'Interest exceeds principal');
        }
      }
    });

    // Highlight milestone payments (e.g., every 12th payment)
    rows.forEach((row) => {
      const numberCell = row.querySelector('.col-number');
      if (numberCell) {
        const paymentNumber = parseInt(numberCell.textContent);
        if (paymentNumber % 12 === 0) {
          row.classList.add('highlight-milestone');
          row.setAttribute('title', 'Annual milestone payment');
        }
      }
    });
  }

  /**
   * Update the table with new amortization schedule
   * @param {Object} amortizationSchedule - Amortization schedule object
   */
  updateTable(amortizationSchedule) {
    // Reset to first page when updating data
    this.currentPage = 1;

    // Reset filters
    this.filters = {};

    // Render with new data
    this.render(amortizationSchedule);
  }

  /**
   * Clear the table
   */
  clear() {
    if (this.container) {
      this.container.innerHTML = '';
    }

    // Reset pagination
    this.currentPage = 1;

    // Clear current data
    this.currentData = [];
  }
}

export default AmortizationTable;
