/**
 * Virtual Scroller Utility
 * Implements virtual scrolling for large datasets to optimize rendering performance
 * Implements requirements 4.2, 4.4
 */

class VirtualScroller {
  constructor(options = {}) {
    this.container = options.container;
    this.itemHeight = options.itemHeight || 50;
    this.bufferSize = options.bufferSize || 10;
    this.renderItem = options.renderItem || (() => document.createElement('div'));
    this.onScroll = options.onScroll || (() => {});

    // Data and state
    this.data = [];
    this.visibleItems = [];
    this.startIndex = 0;
    this.endIndex = 0;
    this.containerHeight = 0;
    this.visibleCount = 0;

    // DOM elements
    this.viewport = null;
    this.content = null;
    this.spacerTop = null;
    this.spacerBottom = null;

    // Performance tracking
    this.lastScrollTime = 0;
    this.scrollTimeout = null;
    this.isScrolling = false;

    this.init();
  }

  /**
   * Initialize the virtual scroller
   */
  init() {
    if (!this.container) {
      throw new Error('Container element is required for virtual scroller');
    }

    this.createViewport();
    this.bindEvents();
    this.updateDimensions();
  }

  /**
   * Create the viewport structure
   */
  createViewport() {
    // Clear container
    this.container.innerHTML = '';

    // Create viewport
    this.viewport = document.createElement('div');
    this.viewport.className = 'virtual-scroller-viewport';
    this.viewport.style.cssText = `
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
    `;

    // Create content container
    this.content = document.createElement('div');
    this.content.className = 'virtual-scroller-content';
    this.content.style.cssText = `
      position: relative;
      min-height: 100%;
    `;

    // Create spacers for maintaining scroll position
    this.spacerTop = document.createElement('div');
    this.spacerTop.className = 'virtual-scroller-spacer-top';
    this.spacerTop.style.cssText = `
      height: 0px;
      flex-shrink: 0;
    `;

    this.spacerBottom = document.createElement('div');
    this.spacerBottom.className = 'virtual-scroller-spacer-bottom';
    this.spacerBottom.style.cssText = `
      height: 0px;
      flex-shrink: 0;
    `;

    // Assemble structure
    this.content.appendChild(this.spacerTop);
    this.content.appendChild(this.spacerBottom);
    this.viewport.appendChild(this.content);
    this.container.appendChild(this.viewport);
  }

  /**
   * Bind scroll events
   */
  bindEvents() {
    // Throttled scroll handler for performance
    this.viewport.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });

    // Resize observer for responsive updates
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateDimensions();
        this.render();
      });
      this.resizeObserver.observe(this.container);
    }

    // Window resize fallback
    window.addEventListener('resize', () => {
      this.updateDimensions();
      this.render();
    });
  }

  /**
   * Handle scroll events with throttling
   */
  handleScroll() {
    const now = Date.now();

    // Mark as scrolling
    this.isScrolling = true;

    // Clear existing timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Throttle scroll updates for performance
    if (now - this.lastScrollTime > 16) { // ~60fps
      this.updateVisibleRange();
      this.render();
      this.lastScrollTime = now;
    }

    // Set timeout to mark scrolling as finished
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
      this.onScroll({
        scrollTop: this.viewport.scrollTop,
        isScrolling: false,
      });
    }, 150);

    // Call scroll callback
    this.onScroll({
      scrollTop: this.viewport.scrollTop,
      isScrolling: true,
    });
  }

  /**
   * Update container dimensions
   */
  updateDimensions() {
    if (!this.viewport) return;

    const rect = this.viewport.getBoundingClientRect();
    this.containerHeight = rect.height;
    this.visibleCount = Math.ceil(this.containerHeight / this.itemHeight) + this.bufferSize * 2;
  }

  /**
   * Update the visible range based on scroll position
   */
  updateVisibleRange() {
    if (!this.viewport || this.data.length === 0) return;

    const { scrollTop } = this.viewport;
    const startIndex = Math.floor(scrollTop / this.itemHeight);

    // Apply buffer
    this.startIndex = Math.max(0, startIndex - this.bufferSize);
    this.endIndex = Math.min(this.data.length, startIndex + this.visibleCount + this.bufferSize);
  }

  /**
   * Set data for the virtual scroller
   * @param {Array} data - Array of data items
   */
  setData(data) {
    this.data = data || [];
    this.updateVisibleRange();
    this.render();
  }

  /**
   * Render visible items
   */
  render() {
    if (!this.content || this.data.length === 0) return;

    // Calculate spacer heights
    const topSpacerHeight = this.startIndex * this.itemHeight;
    const bottomSpacerHeight = (this.data.length - this.endIndex) * this.itemHeight;

    // Update spacers
    this.spacerTop.style.height = `${topSpacerHeight}px`;
    this.spacerBottom.style.height = `${bottomSpacerHeight}px`;

    // Clear existing visible items
    this.clearVisibleItems();

    // Render visible items
    const fragment = document.createDocumentFragment();

    for (let i = this.startIndex; i < this.endIndex; i++) {
      const item = this.data[i];
      const element = this.renderItem(item, i);

      // Ensure proper styling for virtual scrolling
      element.style.cssText = `
        height: ${this.itemHeight}px;
        box-sizing: border-box;
        flex-shrink: 0;
      `;

      // Add data attributes for debugging
      element.setAttribute('data-virtual-index', i);
      element.className = `${element.className} virtual-item`.trim();

      fragment.appendChild(element);
    }

    // Insert rendered items between spacers
    this.content.insertBefore(fragment, this.spacerBottom);

    // Store reference to visible items
    this.visibleItems = Array.from(this.content.querySelectorAll('.virtual-item'));
  }

  /**
   * Clear visible items from DOM
   */
  clearVisibleItems() {
    const items = this.content.querySelectorAll('.virtual-item');
    items.forEach((item) => item.remove());
    this.visibleItems = [];
  }

  /**
   * Scroll to a specific item index
   * @param {number} index - Item index to scroll to
   * @param {string} behavior - Scroll behavior ('auto', 'smooth')
   */
  scrollToIndex(index, behavior = 'auto') {
    if (index < 0 || index >= this.data.length) return;

    const scrollTop = index * this.itemHeight;
    this.viewport.scrollTo({
      top: scrollTop,
      behavior,
    });
  }

  /**
   * Scroll to top
   * @param {string} behavior - Scroll behavior ('auto', 'smooth')
   */
  scrollToTop(behavior = 'smooth') {
    this.viewport.scrollTo({
      top: 0,
      behavior,
    });
  }

  /**
   * Scroll to bottom
   * @param {string} behavior - Scroll behavior ('auto', 'smooth')
   */
  scrollToBottom(behavior = 'smooth') {
    this.viewport.scrollTo({
      top: this.data.length * this.itemHeight,
      behavior,
    });
  }

  /**
   * Get current scroll information
   * @returns {Object} Scroll information
   */
  getScrollInfo() {
    return {
      scrollTop: this.viewport ? this.viewport.scrollTop : 0,
      scrollHeight: this.data.length * this.itemHeight,
      clientHeight: this.containerHeight,
      startIndex: this.startIndex,
      endIndex: this.endIndex,
      visibleCount: this.endIndex - this.startIndex,
      totalCount: this.data.length,
      isScrolling: this.isScrolling,
    };
  }

  /**
   * Update item height and re-render
   * @param {number} height - New item height
   */
  setItemHeight(height) {
    this.itemHeight = height;
    this.updateDimensions();
    this.updateVisibleRange();
    this.render();
  }

  /**
   * Refresh the virtual scroller
   */
  refresh() {
    this.updateDimensions();
    this.updateVisibleRange();
    this.render();
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return {
      totalItems: this.data.length,
      visibleItems: this.visibleItems.length,
      renderedRange: `${this.startIndex}-${this.endIndex}`,
      itemHeight: this.itemHeight,
      containerHeight: this.containerHeight,
      bufferSize: this.bufferSize,
      isScrolling: this.isScrolling,
    };
  }

  /**
   * Destroy the virtual scroller and clean up resources
   */
  destroy() {
    // Clear timeouts
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // Remove event listeners
    if (this.viewport) {
      this.viewport.removeEventListener('scroll', this.handleScroll);
    }

    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }

    // Reset state
    this.data = [];
    this.visibleItems = [];
    this.viewport = null;
    this.content = null;
    this.spacerTop = null;
    this.spacerBottom = null;
  }
}

/**
 * Virtual Table implementation specifically for tabular data
 */
class VirtualTable extends VirtualScroller {
  constructor(options = {}) {
    // Set default item height for table rows
    options.itemHeight = options.itemHeight || 45;

    super(options);

    this.columns = options.columns || [];
    this.headerHeight = options.headerHeight || 50;
    this.showHeader = options.showHeader !== false;

    this.createTableStructure();
  }

  /**
   * Create table-specific structure
   */
  createTableStructure() {
    // Add table classes
    this.container.classList.add('virtual-table-container');
    this.viewport.classList.add('virtual-table-viewport');

    // Create header if needed
    if (this.showHeader && this.columns.length > 0) {
      this.createHeader();
    }

    // Update content styling for table
    this.content.style.cssText += `
      display: flex;
      flex-direction: column;
    `;
  }

  /**
   * Create table header
   */
  createHeader() {
    const header = document.createElement('div');
    header.className = 'virtual-table-header';
    header.style.cssText = `
      height: ${this.headerHeight}px;
      display: flex;
      background: var(--table-header-bg, #f8f9fa);
      border-bottom: 1px solid var(--table-border-color, #dee2e6);
      position: sticky;
      top: 0;
      z-index: 10;
      flex-shrink: 0;
    `;

    // Create header cells
    this.columns.forEach((column, index) => {
      const cell = document.createElement('div');
      cell.className = 'virtual-table-header-cell';
      cell.style.cssText = `
        flex: ${column.flex || 1};
        padding: 12px 8px;
        font-weight: 600;
        display: flex;
        align-items: center;
        border-right: 1px solid var(--table-border-color, #dee2e6);
        min-width: ${column.minWidth || 100}px;
        max-width: ${column.maxWidth || 'none'};
      `;

      cell.textContent = column.title || column.key;

      // Add sort functionality if enabled
      if (column.sortable) {
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', () => {
          this.handleSort(column.key);
        });
      }

      header.appendChild(cell);
    });

    // Insert header before viewport
    this.container.insertBefore(header, this.viewport);

    // Adjust viewport height to account for header
    this.viewport.style.height = `calc(100% - ${this.headerHeight}px)`;
  }

  /**
   * Handle column sorting
   * @param {string} columnKey - Column key to sort by
   */
  handleSort(columnKey) {
    // This would be implemented based on specific requirements
    console.log(`Sorting by column: ${columnKey}`);
  }

  /**
   * Render a table row
   * @param {Object} item - Data item
   * @param {number} index - Item index
   * @returns {HTMLElement} Rendered row element
   */
  renderTableRow(item, index) {
    const row = document.createElement('div');
    row.className = 'virtual-table-row';
    row.style.cssText = `
      display: flex;
      border-bottom: 1px solid var(--table-border-color, #dee2e6);
      background: ${index % 2 === 0 ? 'var(--table-row-even-bg, #fff)' : 'var(--table-row-odd-bg, #f8f9fa)'};
      transition: background-color 0.2s ease;
    `;

    // Add hover effect
    row.addEventListener('mouseenter', () => {
      row.style.backgroundColor = 'var(--table-row-hover-bg, #e9ecef)';
    });

    row.addEventListener('mouseleave', () => {
      row.style.backgroundColor = index % 2 === 0 ? 'var(--table-row-even-bg, #fff)' : 'var(--table-row-odd-bg, #f8f9fa)';
    });

    // Create cells
    this.columns.forEach((column) => {
      const cell = document.createElement('div');
      cell.className = 'virtual-table-cell';
      cell.style.cssText = `
        flex: ${column.flex || 1};
        padding: 12px 8px;
        display: flex;
        align-items: center;
        border-right: 1px solid var(--table-border-color, #dee2e6);
        min-width: ${column.minWidth || 100}px;
        max-width: ${column.maxWidth || 'none'};
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      `;

      // Get cell value
      let value = item[column.key];

      // Apply formatter if provided
      if (column.formatter && typeof column.formatter === 'function') {
        value = column.formatter(value, item, index);
      }

      // Set cell content
      if (typeof value === 'string' || typeof value === 'number') {
        cell.textContent = value;
      } else if (value instanceof HTMLElement) {
        cell.appendChild(value);
      } else {
        cell.textContent = String(value || '');
      }

      // Add column-specific classes
      cell.classList.add(`col-${column.key}`);

      row.appendChild(cell);
    });

    return row;
  }
}

export { VirtualScroller, VirtualTable };
