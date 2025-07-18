/**
 * Financial Glossary Component
 * Provides a searchable glossary of financial terms
 * Implements requirement 5.1
 */

import { getTranslation } from '../utils/translations.js';
import { addKeyboardNavigation, announceToScreenReader } from '../utils/accessibility.js';

class FinancialGlossary {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('glossary-container');
    this.language = options.language || 'en';
    this.isOpen = false;
    this.terms = this.getGlossaryTerms();

    this.init();
  }

  /**
   * Initialize the component
   */
  init() {
    this.render();
    this.bindEvents();
  }

  /**
   * Render the glossary component
   */
  render() {
    if (!this.container) return;

    // Get translations based on current language
    const t = (key) => getTranslation(key, this.language);

    // Create glossary button
    const glossaryButtonHtml = `
      <button id="glossary-toggle" class="glossary-toggle" aria-label="${t('glossary.openGlossary')}">
        <span class="glossary-icon">📚</span>
        <span class="glossary-text">${t('glossary.title')}</span>
      </button>
    `;

    // Create glossary modal
    const glossaryModalHtml = `
      <div id="glossary-modal" class="glossary-modal" aria-hidden="true" role="dialog" aria-labelledby="glossary-title">
        <div class="glossary-content">
          <div class="glossary-header">
            <h2 id="glossary-title">${t('glossary.title')}</h2>
            <button id="glossary-close" class="glossary-close" aria-label="${t('glossary.close')}">×</button>
          </div>
          <div class="glossary-search">
            <input 
              type="text" 
              id="glossary-search-input" 
              class="glossary-search-input" 
              placeholder="${t('glossary.searchPlaceholder')}" 
              aria-label="${t('glossary.search')}"
            >
          </div>
          <div class="glossary-terms" id="glossary-terms-list">
            ${this.renderTermsList()}
          </div>
        </div>
      </div>
    `;

    // Add to container
    this.container.innerHTML = glossaryButtonHtml + glossaryModalHtml;
  }

  /**
   * Render the list of glossary terms
   * @returns {string} HTML for the terms list
   */
  renderTermsList(searchTerm = '') {
    // Get translations based on current language
    const t = (key) => getTranslation(key, this.language);

    // Filter terms based on search
    const filteredTerms = searchTerm
      ? this.terms.filter((term) => term.term.toLowerCase().includes(searchTerm.toLowerCase())
          || term.definition.toLowerCase().includes(searchTerm.toLowerCase()))
      : this.terms;

    // Sort terms alphabetically
    filteredTerms.sort((a, b) => a.term.localeCompare(b.term));

    // Group terms by first letter
    const groupedTerms = filteredTerms.reduce((acc, term) => {
      const firstLetter = term.term.charAt(0).toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(term);
      return acc;
    }, {});

    // Generate HTML
    let html = '';

    if (filteredTerms.length === 0) {
      html = `<p class="glossary-no-results">${t('glossary.noResults')}</p>`;
    } else {
      Object.keys(groupedTerms).sort().forEach((letter) => {
        html += `
          <div class="glossary-letter-group">
            <h3 class="glossary-letter">${letter}</h3>
            <dl class="glossary-definitions">
              ${groupedTerms[letter].map((term) => `
                <div class="glossary-term">
                  <dt>${term.term}</dt>
                  <dd>${term.definition}</dd>
                </div>
              `).join('')}
            </dl>
          </div>
        `;
      });
    }

    return html;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    if (!this.container) return;

    // Toggle button
    const toggleButton = this.container.querySelector('#glossary-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => this.toggleGlossary());
    }

    // Close button
    const closeButton = this.container.querySelector('#glossary-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.closeGlossary());
    }

    // Search input
    const searchInput = this.container.querySelector('#glossary-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }

    // Close on click outside
    const modal = this.container.querySelector('#glossary-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeGlossary();
        }
      });
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeGlossary();
      }
    });

    // Add keyboard navigation
    const modalContent = this.container.querySelector('.glossary-content');
    if (modalContent) {
      addKeyboardNavigation(modalContent);
    }
  }

  /**
   * Toggle glossary visibility
   */
  toggleGlossary() {
    if (this.isOpen) {
      this.closeGlossary();
    } else {
      this.openGlossary();
    }
  }

  /**
   * Open the glossary
   */
  openGlossary() {
    const modal = this.container.querySelector('#glossary-modal');
    const toggleButton = this.container.querySelector('#glossary-toggle');

    if (modal && toggleButton) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      toggleButton.setAttribute('aria-expanded', 'true');

      // Focus on search input
      const searchInput = this.container.querySelector('#glossary-search-input');
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
      }

      this.isOpen = true;

      // Announce to screen readers
      announceToScreenReader(getTranslation('glossary.opened', this.language));
    }
  }

  /**
   * Close the glossary
   */
  closeGlossary() {
    const modal = this.container.querySelector('#glossary-modal');
    const toggleButton = this.container.querySelector('#glossary-toggle');

    if (modal && toggleButton) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      toggleButton.setAttribute('aria-expanded', 'false');

      // Return focus to toggle button
      toggleButton.focus();

      this.isOpen = false;

      // Announce to screen readers
      announceToScreenReader(getTranslation('glossary.closed', this.language));
    }
  }

  /**
   * Handle search input
   * @param {string} searchTerm - Search term
   */
  handleSearch(searchTerm) {
    const termsList = this.container.querySelector('#glossary-terms-list');
    if (termsList) {
      termsList.innerHTML = this.renderTermsList(searchTerm);

      // Announce search results to screen readers
      const t = (key) => getTranslation(key, this.language);
      const filteredTerms = this.terms.filter((term) => term.term.toLowerCase().includes(searchTerm.toLowerCase())
        || term.definition.toLowerCase().includes(searchTerm.toLowerCase()));

      announceToScreenReader(
        t('glossary.searchResults').replace('{count}', filteredTerms.length),
      );
    }
  }

  /**
   * Update language and re-render component
   * @param {string} language - Language code
   */
  updateLanguage(language) {
    if (this.language !== language) {
      this.language = language;
      this.terms = this.getGlossaryTerms();
      this.render();
      this.bindEvents();
    }
  }

  /**
   * Get glossary terms based on current language
   * @returns {Array} Array of term objects
   */
  getGlossaryTerms() {
    // Terms are the same for all languages, but could be translated in the future
    return [
      {
        term: 'Amortization',
        definition: 'The process of spreading out a loan into a series of fixed payments over time. Each payment is allocated between the principal and the interest.',
      },
      {
        term: 'Annual Percentage Rate (APR)',
        definition: 'The yearly cost of a loan, including interest and fees, expressed as a percentage.',
      },
      {
        term: 'Balloon Payment',
        definition: 'A large payment due at the end of a loan term, common in certain mortgage and auto loans.',
      },
      {
        term: 'Collateral',
        definition: 'An asset that a borrower offers as a way for a lender to secure the loan. If the borrower stops making payments, the lender can seize the collateral.',
      },
      {
        term: 'Compound Interest',
        definition: 'Interest calculated on both the initial principal and the accumulated interest from previous periods.',
      },
      {
        term: 'Down Payment',
        definition: 'An initial upfront payment made when purchasing an expensive item such as a home or car using a loan.',
      },
      {
        term: 'Equity',
        definition: 'The difference between the current market value of an asset and the amount owed on it.',
      },
      {
        term: 'Fixed-Rate Loan',
        definition: 'A loan where the interest rate remains the same throughout the term of the loan.',
      },
      {
        term: 'Grace Period',
        definition: 'A set period of time after a payment due date during which a late fee will not be charged.',
      },
      {
        term: 'Interest',
        definition: 'The cost of borrowing money, typically expressed as an annual percentage rate.',
      },
      {
        term: 'Loan Term',
        definition: 'The period of time during which a borrower makes monthly payments towards a loan.',
      },
      {
        term: 'Loan-to-Value (LTV) Ratio',
        definition: 'The ratio of a loan amount to the value of the asset purchased, typically expressed as a percentage.',
      },
      {
        term: 'Mortgage',
        definition: 'A loan used to purchase real estate, where the property serves as collateral.',
      },
      {
        term: 'Principal',
        definition: 'The original amount of money borrowed in a loan, or the amount still owed, not including interest.',
      },
      {
        term: 'Refinancing',
        definition: 'The process of replacing an existing loan with a new loan, typically with better terms.',
      },
      {
        term: 'Simple Interest',
        definition: 'Interest calculated only on the principal amount, not on accumulated interest.',
      },
      {
        term: 'Underwriting',
        definition: 'The process a lender uses to determine if the risk of offering a loan to a particular borrower under certain parameters is acceptable.',
      },
      {
        term: 'Variable-Rate Loan',
        definition: 'A loan where the interest rate can change over time, based on an underlying benchmark or index.',
      },
      {
        term: 'Debt-to-Income Ratio',
        definition: 'A personal finance measure that compares the amount of debt you have to your overall income.',
      },
      {
        term: 'Escrow',
        definition: 'An account held by a third party on behalf of two other parties in a transaction.',
      },
      {
        term: 'Foreclosure',
        definition: 'The legal process by which a lender takes control of a property, evicts the homeowner, and sells the home after the homeowner is unable to make full principal and interest payments on their mortgage.',
      },
      {
        term: 'Origination Fee',
        definition: 'A fee charged by a lender for processing a new loan application, often expressed as a percentage of the loan amount.',
      },
      {
        term: 'Points',
        definition: 'Fees paid to the lender at closing in exchange for a reduced interest rate. One point equals one percent of the loan amount.',
      },
      {
        term: 'Prepayment Penalty',
        definition: 'A fee charged by some lenders when a borrower pays off a loan before the end of the loan term.',
      },
      {
        term: 'Private Mortgage Insurance (PMI)',
        definition: 'Insurance that protects the lender if a borrower stops making payments on a loan. PMI is typically required for loans with a down payment of less than 20%.',
      },
    ];
  }
}

export default FinancialGlossary;
