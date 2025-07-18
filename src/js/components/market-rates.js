/**
 * Market Rates Component
 * Displays average market rates for different loan types
 * Implements requirement 5.3
 */

import { getTranslation } from '../utils/translations.js';
import { LOAN_TYPES } from '../models/loan.model.js';
import * as formatters from '../utils/formatters.js';

class MarketRates {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('market-rates-container');
    this.language = options.language || 'en';
    this.currentLoanType = options.loanType || 'mortgage';
    this.currentRate = options.currentRate || 0;
    this.onRateSelect = options.onRateSelect || (() => {});
    
    // Market rates data - in a real application, this would come from an API
    this.marketRatesData = {
      mortgage: {
        average: 6.75,
        min: 5.85,
        max: 7.65,
        trend: 'stable',
        lastUpdated: new Date('2025-07-15')
      },
      auto: {
        average: 7.25,
        min: 6.50,
        max: 9.75,
        trend: 'up',
        lastUpdated: new Date('2025-07-16')
      },
      personal: {
        average: 11.50,
        min: 8.75,
        max: 17.99,
        trend: 'up',
        lastUpdated: new Date('2025-07-16')
      },
      student: {
        average: 5.50,
        min: 4.99,
        max: 7.25,
        trend: 'down',
        lastUpdated: new Date('2025-07-14')
      }
    };
    
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
   * Render the market rates component
   */
  render() {
    if (!this.container) return;
    
    // Get translations based on current language
    const t = (key) => getTranslation(key, this.language);
    
    // Get market rates for current loan type
    const ratesData = this.marketRatesData[this.currentLoanType] || this.marketRatesData.mortgage;
    
    // Format date based on locale
    const locale = formatters.getLocaleFromLanguage(this.language);
    const formattedDate = ratesData.lastUpdated.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Get trend icon
    const trendIcon = this.getTrendIcon(ratesData.trend);
    
    // Create market rates HTML
    const marketRatesHtml = `
      <div class="market-rates">
        <div class="market-rates-header">
          <h3>${t('marketRates.title')}</h3>
          <div class="market-rates-disclaimer">${t('marketRates.disclaimer')}</div>
        </div>
        
        <div class="market-rates-content">
          <div class="market-rates-summary">
            <div class="market-rates-average">
              <span class="market-rates-label">${t('marketRates.averageRate')}</span>
              <span class="market-rates-value">${ratesData.average.toFixed(2)}%</span>
              <span class="market-rates-trend ${ratesData.trend}">${trendIcon}</span>
            </div>
            <div class="market-rates-range">
              <span class="market-rates-label">${t('marketRates.rateRange')}</span>
              <span class="market-rates-value">${ratesData.min.toFixed(2)}% - ${ratesData.max.toFixed(2)}%</span>
            </div>
          </div>
          
          <div class="market-rates-comparison">
            <div class="market-rates-your-rate">
              <span class="market-rates-label">${t('marketRates.yourRate')}</span>
              <span class="market-rates-value ${this.getRateComparisonClass(this.currentRate, ratesData.average)}">
                ${this.currentRate.toFixed(2)}%
              </span>
            </div>
            <div class="market-rates-difference">
              <span class="market-rates-label">${t('marketRates.difference')}</span>
              <span class="market-rates-value ${this.getRateComparisonClass(this.currentRate, ratesData.average)}">
                ${this.formatRateDifference(this.currentRate, ratesData.average)}
              </span>
            </div>
          </div>
          
          <div class="market-rates-actions">
            <button id="use-average-rate" class="market-rates-button">
              ${t('marketRates.useAverageRate')}
            </button>
          </div>
          
          <div class="market-rates-footer">
            <span class="market-rates-updated">${t('marketRates.lastUpdated')}: ${formattedDate}</span>
          </div>
        </div>
      </div>
    `;
    
    this.container.innerHTML = marketRatesHtml;
  }
  
  /**
   * Bind event listeners
   */
  bindEvents() {
    if (!this.container) return;
    
    // Use average rate button
    const useAverageRateButton = this.container.querySelector('#use-average-rate');
    if (useAverageRateButton) {
      useAverageRateButton.addEventListener('click', () => {
        const ratesData = this.marketRatesData[this.currentLoanType] || this.marketRatesData.mortgage;
        this.onRateSelect(ratesData.average);
      });
    }
  }
  
  /**
   * Get trend icon based on trend direction
   * @param {string} trend - Trend direction (up, down, stable)
   * @returns {string} HTML for trend icon
   */
  getTrendIcon(trend) {
    switch (trend) {
      case 'up':
        return '<span class="trend-icon trend-up" aria-hidden="true">↑</span>';
      case 'down':
        return '<span class="trend-icon trend-down" aria-hidden="true">↓</span>';
      default:
        return '<span class="trend-icon trend-stable" aria-hidden="true">→</span>';
    }
  }
  
  /**
   * Get CSS class for rate comparison
   * @param {number} currentRate - Current rate
   * @param {number} averageRate - Average market rate
   * @returns {string} CSS class
   */
  getRateComparisonClass(currentRate, averageRate) {
    const difference = currentRate - averageRate;
    
    if (Math.abs(difference) <= 0.25) {
      return 'rate-average';
    } else if (difference < 0) {
      return 'rate-below';
    } else {
      return 'rate-above';
    }
  }
  
  /**
   * Format rate difference
   * @param {number} currentRate - Current rate
   * @param {number} averageRate - Average market rate
   * @returns {string} Formatted rate difference
   */
  formatRateDifference(currentRate, averageRate) {
    const difference = currentRate - averageRate;
    const t = (key) => getTranslation(key, this.language);
    
    if (Math.abs(difference) <= 0.1) {
      return t('marketRates.sameAsAverage');
    } else if (difference < 0) {
      return `${Math.abs(difference).toFixed(2)}% ${t('marketRates.belowAverage')}`;
    } else {
      return `${difference.toFixed(2)}% ${t('marketRates.aboveAverage')}`;
    }
  }
  
  /**
   * Update current loan type and re-render
   * @param {string} loanType - Loan type
   */
  updateLoanType(loanType) {
    if (LOAN_TYPES[loanType] && this.currentLoanType !== loanType) {
      this.currentLoanType = loanType;
      this.render();
      this.bindEvents();
    }
  }
  
  /**
   * Update current interest rate and re-render
   * @param {number} rate - Interest rate
   */
  updateCurrentRate(rate) {
    if (this.currentRate !== rate) {
      this.currentRate = rate;
      this.render();
      this.bindEvents();
    }
  }
  
  /**
   * Update language and re-render component
   * @param {string} language - Language code
   */
  updateLanguage(language) {
    if (this.language !== language) {
      this.language = language;
      this.render();
      this.bindEvents();
    }
  }
}

export default MarketRates;