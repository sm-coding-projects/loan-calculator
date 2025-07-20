/**
 * Amortization Table Component
 * Displays detailed payment schedule
 * Implements requirement 2.2
 */

import * as formatters from '../utils/formatters.js';
import animationManager from '../utils/animation-manager.js';
import { VirtualTable } from '../utils/virtual-scroller.js';

class AmortizationTable {
  /**
   * Create a new amortization table component
   * @param {Object} options - Configuration options
   * @param {HTMLElement} [options.container] - Container element
   * @param {Object} [options.formatters] - Custom formatters
   * @param {number} [options.pageSize] - Number of items per page
   * @param {boolean} [options.useVirtualScrolling] - Whether to use virtual scrolling for large datasets
   * @param {number} [options.virtualScrollThreshold] - Minimum items to enable virtual scrolling
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
    
    // Virtual scrolling options
    this.useVirtualScrolling = options.useVirtualScrolling !== false; // Default to true
    this.virtualScrollThreshold = options.virtualScrollThreshold || 100;
    this.virtualTable = null;
    this.isVirtualMode = false;

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
   * Show loading skeleton while data is being processed
   */
  showLoadingSkeleton() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="table-container">
        <table class="skeleton-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Payment</th>
              <th>Principal</th>
              <th>Interest</th>
              <th>Remaining Balance</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: 8 }, (_, i) => `
              <tr class="skeleton-row">
                <td><div class="skeleton-cell short"></div></td>
                <td><div class="skeleton-cell medium"></div></td>
                <td><div class="skeleton-cell long"></div></td>
                <td><div class="skeleton-cell long"></div></td>
                <td><div class="skeleton-cell long"></div></td>
                <td><div class="skeleton-cell long"></div></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Render the amortization schedule
   * @param {Object} amortizationSchedule - Amortization schedule object
   */
  render(amortizationSchedule) {
    if (!this.container) {
      return;
    }

    // Show loading skeleton if no data yet
    if (!amortizationSchedule || !amortizationSchedule.payments || amortizationSchedule.payments.length === 0) {
      this.showLoadingSkeleton();
      return;
    }

    // Store the full data set
    this.currentData = amortizationSchedule.payments || [];

    // Filter and sort data
    const filteredData = this.filterData(this.currentData, this.filters);
    const sortedData = this.sortData(filteredData, this.sortColumn, this.sortDirection);

    // Determine if we should use virtual scrolling
    const shouldUseVirtual = this.useVirtualScrolling && sortedData.length >= this.virtualScrollThreshold;

    if (shouldUseVirtual && !this.isVirtualMode) {
      this.switchToVirtualMode(sortedData);
    } else if (!shouldUseVirtual && this.isVirtualMode) {
      this.switchToPaginatedMode(sortedData);
    } else if (shouldUseVirtual && this.isVirtualMode) {
      this.updateVirtualTable(sortedData);
    } else {
      this.renderPaginatedTable(sortedData);
    }
  }

  /**
   * Switch to virtual scrolling mode
   * @param {Array} data - Sorted and filtered data
   */
  switchToVirtualMode(data) {
    this.isVirtualMode = true;
    
    // Clear container
    this.container.innerHTML = '';

    // Add filter controls
    this.container.appendChild(this.filterControls);
    this.updateYearFilterOptions(this.currentData);

    // Add performance info
    this.addPerformanceInfo(data.length);

    // Create virtual table container
    const virtualContainer = document.createElement('div');
    virtualContainer.className = 'virtual-table-wrapper';
    virtualContainer.style.cssText = `
      height: 600px;
      border: 1px solid var(--table-border-color, #dee2e6);
      border-radius: 8px;
      overflow: hidden;
      background: white;
    `;

    // Define columns for virtual table
    const columns = [
      {
        key: 'number',
        title: '#',
        flex: 0.5,
        minWidth: 60,
        formatter: (value) => value.toString()
      },
      {
        key: 'date',
        title: 'Date',
        flex: 1,
        minWidth: 120,
        formatter: (value) => this.formatters.date(value)
      },
      {
        key: 'amount',
        title: 'Payment',
        flex: 1,
        minWidth: 120,
        formatter: (value) => this.formatters.currency(value)
      },
      {
        key: 'principal',
        title: 'Principal',
        flex: 1,
        minWidth: 120,
        formatter: (value) => this.formatters.currency(value)
      },
      {
        key: 'interest',
        title: 'Interest',
        flex: 1,
        minWidth: 120,
        formatter: (value) => this.formatters.currency(value)
      },
      {
        key: 'balance',
        title: 'Remaining Balance',
        flex: 1.2,
        minWidth: 140,
        formatter: (value) => this.formatters.currency(value)
      }
    ];

    // Create virtual table
    this.virtualTable = new VirtualTable({
      container: virtualContainer,
      columns: columns,
      itemHeight: 45,
      bufferSize: 20,
      headerHeight: 50,
      onScroll: (info) => {
        // Update scroll position indicator
        this.updateScrollIndicator(info);
      }
    });

    // Set data
    this.virtualTable.setData(data);

    // Add to container
    this.container.appendChild(virtualContainer);

    // Add virtual table controls
    this.addVirtualTableControls();

    // Animate reveal
    this._animateVirtualTableReveal(virtualContainer);
  }

  /**
   * Switch back to paginated mode
   * @param {Array} data - Sorted and filtered data
   */
  switchToPaginatedMode(data) {
    this.isVirtualMode = false;
    
    // Destroy virtual table
    if (this.virtualTable) {
      this.virtualTable.destroy();
      this.virtualTable = null;
    }

    // Render normal paginated table
    this.renderPaginatedTable(data);
  }

  /**
   * Update virtual table with new data
   * @param {Array} data - Sorted and filtered data
   */
  updateVirtualTable(data) {
    if (this.virtualTable) {
      this.virtualTable.setData(data);
      this.updatePerformanceInfo(data.length);
    }
  }

  /**
   * Render traditional paginated table
   * @param {Array} sortedData - Sorted and filtered data
   */
  renderPaginatedTable(sortedData) {
    // Clear the container
    this.container.innerHTML = '';

    // Add filter controls
    this.container.appendChild(this.filterControls);
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

    // Animate table reveal
    this._animateTableReveal(table, paginatedData.length);
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
   * Show error state
   * @param {string} message - Error message to display
   */
  showError(message = 'Failed to load amortization data') {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="component-error">
        <div class="error-icon">⚠️</div>
        <div class="error-text">${message}</div>
        <button class="retry-button" onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  /**
   * Add performance information display
   * @param {number} itemCount - Number of items being displayed
   */
  addPerformanceInfo(itemCount) {
    const perfInfo = document.createElement('div');
    perfInfo.className = 'performance-info';
    perfInfo.innerHTML = `
      <div class="perf-badge">
        <span class="perf-icon">⚡</span>
        <span class="perf-text">Virtual Scrolling: ${itemCount.toLocaleString()} rows optimized</span>
        <span class="perf-detail">Rendering only visible items for optimal performance</span>
      </div>
    `;
    this.container.appendChild(perfInfo);
  }

  /**
   * Update performance information
   * @param {number} itemCount - Number of items
   */
  updatePerformanceInfo(itemCount) {
    const perfText = this.container.querySelector('.perf-text');
    if (perfText) {
      perfText.textContent = `Virtual Scrolling: ${itemCount.toLocaleString()} rows optimized`;
    }
  }

  /**
   * Add virtual table controls
   */
  addVirtualTableControls() {
    const controls = document.createElement('div');
    controls.className = 'virtual-table-controls';
    controls.innerHTML = `
      <div class="virtual-controls-row">
        <button class="btn-scroll-control" id="scroll-to-top">
          <span>↑</span> Top
        </button>
        <button class="btn-scroll-control" id="scroll-to-bottom">
          <span>↓</span> Bottom
        </button>
        <div class="scroll-indicator">
          <div class="scroll-progress">
            <div class="scroll-progress-bar" style="width: 0%"></div>
          </div>
          <span class="scroll-position">0 / 0</span>
        </div>
        <button class="btn-scroll-control" id="toggle-pagination">
          <span>📄</span> Switch to Pagination
        </button>
      </div>
    `;

    // Add event listeners
    const scrollToTop = controls.querySelector('#scroll-to-top');
    const scrollToBottom = controls.querySelector('#scroll-to-bottom');
    const togglePagination = controls.querySelector('#toggle-pagination');

    if (scrollToTop) {
      scrollToTop.addEventListener('click', () => {
        if (this.virtualTable) {
          this.virtualTable.scrollToTop();
        }
      });
    }

    if (scrollToBottom) {
      scrollToBottom.addEventListener('click', () => {
        if (this.virtualTable) {
          this.virtualTable.scrollToBottom();
        }
      });
    }

    if (togglePagination) {
      togglePagination.addEventListener('click', () => {
        this.useVirtualScrolling = false;
        this.render({ payments: this.currentData });
      });
    }

    this.container.appendChild(controls);
  }

  /**
   * Update scroll indicator
   * @param {Object} scrollInfo - Scroll information from virtual table
   */
  updateScrollIndicator(scrollInfo) {
    const progressBar = this.container.querySelector('.scroll-progress-bar');
    const positionText = this.container.querySelector('.scroll-position');

    if (progressBar && scrollInfo.scrollHeight > 0) {
      const progress = (scrollInfo.scrollTop / (scrollInfo.scrollHeight - scrollInfo.clientHeight)) * 100;
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    if (positionText) {
      const currentItem = Math.floor(scrollInfo.scrollTop / (scrollInfo.scrollHeight / scrollInfo.totalCount)) + 1;
      positionText.textContent = `${currentItem} / ${scrollInfo.totalCount}`;
    }
  }

  /**
   * Animate virtual table reveal
   * @param {HTMLElement} container - Virtual table container
   */
  _animateVirtualTableReveal(container) {
    animationManager.respectfulAnimate(() => {
      container.style.opacity = '0';
      container.style.transform = 'translateY(20px) scale(0.98)';
      container.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';

      setTimeout(() => {
        container.style.opacity = '1';
        container.style.transform = 'translateY(0) scale(1)';
      }, 100);

      // Animate performance badge
      setTimeout(() => {
        const perfBadge = this.container.querySelector('.perf-badge');
        if (perfBadge) {
          perfBadge.style.opacity = '0';
          perfBadge.style.transform = 'translateX(-20px)';
          perfBadge.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
          
          setTimeout(() => {
            perfBadge.style.opacity = '1';
            perfBadge.style.transform = 'translateX(0)';
          }, 50);
        }
      }, 300);

      // Animate controls
      setTimeout(() => {
        const controls = this.container.querySelector('.virtual-table-controls');
        if (controls) {
          controls.style.opacity = '0';
          controls.style.transform = 'translateY(10px)';
          controls.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
          
          setTimeout(() => {
            controls.style.opacity = '1';
            controls.style.transform = 'translateY(0)';
          }, 50);
        }
      }, 500);

    }, () => {
      // Fallback for reduced motion
      container.style.opacity = '1';
      container.style.transform = 'none';
      
      const perfBadge = this.container.querySelector('.perf-badge');
      const controls = this.container.querySelector('.virtual-table-controls');
      
      if (perfBadge) {
        perfBadge.style.opacity = '1';
        perfBadge.style.transform = 'none';
      }
      
      if (controls) {
        controls.style.opacity = '1';
        controls.style.transform = 'none';
      }
    });
  }

  /**
   * Clear the table
   */
  clear() {
    // Destroy virtual table if it exists
    if (this.virtualTable) {
      this.virtualTable.destroy();
      this.virtualTable = null;
    }

    if (this.container) {
      this.container.innerHTML = '';
    }

    // Reset state
    this.currentPage = 1;
    this.currentData = [];
    this.isVirtualMode = false;
  }

  /**
   * Animate table reveal with staggered row animations
   * @param {HTMLTableElement} table - Table element
   * @param {number} rowCount - Number of rows to animate
   * @private
   */
  _animateTableReveal(table, rowCount) {
    animationManager.respectfulAnimate(() => {
      // First animate the table container
      const tableContainer = table.closest('.table-container');
      if (tableContainer) {
        tableContainer.style.opacity = '0';
        tableContainer.style.transform = 'translateY(20px)';
        tableContainer.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        
        setTimeout(() => {
          tableContainer.style.opacity = '1';
          tableContainer.style.transform = 'translateY(0)';
        }, 100);
      }

      // Then animate table rows with stagger
      setTimeout(() => {
        animationManager.animateTableRows(table, {
          delay: 200,
          staggerDelay: 50,
        });
      }, 300);

      // Add subtle hover animations after initial reveal
      setTimeout(() => {
        this._addTableInteractions(table);
      }, 300 + (rowCount * 50));

    }, () => {
      // Fallback for reduced motion
      const tableContainer = table.closest('.table-container');
      if (tableContainer) {
        tableContainer.style.opacity = '1';
        tableContainer.style.transform = 'none';
      }
      
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach((row) => {
        row.style.opacity = '1';
        row.style.transform = 'none';
      });
    });
  }

  /**
   * Add interactive animations to table elements
   * @param {HTMLTableElement} table - Table element
   * @private
   */
  _addTableInteractions(table) {
    // Add hover effects to table rows
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row) => {
      row.addEventListener('mouseenter', () => {
        if (!animationManager.prefersReducedMotion()) {
          row.style.transform = 'translateX(4px)';
          row.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
          row.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        }
      });

      row.addEventListener('mouseleave', () => {
        if (!animationManager.prefersReducedMotion()) {
          row.style.transform = '';
          row.style.boxShadow = '';
        }
      });
    });

    // Add click animations to sortable headers
    const sortableHeaders = table.querySelectorAll('th[data-sort]');
    sortableHeaders.forEach((header) => {
      header.addEventListener('click', (event) => {
        if (!animationManager.prefersReducedMotion()) {
          animationManager.createRippleEffect(header, event);
        }
      });
    });

    // Add smooth transitions to pagination buttons
    const paginationButtons = this.container.querySelectorAll('.pagination button');
    paginationButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        if (!animationManager.prefersReducedMotion()) {
          animationManager.createRippleEffect(button, event);
        }
      });
    });
  }
}

export default AmortizationTable;
