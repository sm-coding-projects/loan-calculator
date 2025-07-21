/**
 * Calculator Form Component
 * Handles user input for loan calculations
 * Implements requirements 1.1, 1.2, 2.1, 2.6
 */

import Loan, { LOAN_TYPES, PAYMENT_FREQUENCIES } from '../models/loan.model.js';
import * as validators from '../utils/validators.js';
import * as formatters from '../utils/formatters.js';
import { getTranslation } from '../utils/translations.js';
import { initTooltips } from '../utils/tooltips.js';
import MarketRates from './market-rates.js';
import loadingManager from '../utils/loading-manager.js';
import animationManager from '../utils/animation-manager.js';
// Removed unused AsyncCalculatorService import to prevent worker errors
// import AsyncCalculatorService from '../services/async-calculator.service.js';
import { enhanceFormAccessibility, announceValidationError, announceLoadingState } from '../utils/accessibility.js';

class CalculatorForm {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('calculator-form-container');
    this.onCalculate = options.onCalculate || (() => {});
    this.validators = {
      principal: validators.isPositiveNumber,
      interestRate: validators.isValidInterestRate,
      term: validators.isValidLoanTerm,
      downPayment: validators.isNumber,
      additionalPayment: validators.isNumber,
      inflationRate: validators.isValidInflationRate,
      ...options.validators,
    };

    // Language settings
    this.language = options.language || 'en';
    this.locale = formatters.getLocaleFromLanguage(this.language);

    // Initialize with default loan
    this.formData = Loan.createDefault('mortgage').toJSON();

    // Set default inflation rate if not present
    if (this.formData.inflationRate === undefined) {
      this.formData.inflationRate = 2.5;
    }

    // Market rates component
    this.marketRatesComponent = null;

    // Removed async calculator service to prevent worker errors
    // this.asyncCalculator = new AsyncCalculatorService();

    this.init();
  }

  init() {
    this.render();
    this.bindEvents();

    // Initialize market rates component
    this.initMarketRates();

    // Trigger initial calculation
    this.handleCalculate();
  }

  /**
   * Initialize market rates component
   */
  initMarketRates() {
    const marketRatesContainer = this.container.querySelector('#market-rates-container');
    if (!marketRatesContainer) return;

    this.marketRatesComponent = new MarketRates({
      container: marketRatesContainer,
      language: this.language,
      loanType: this.formData.type,
      currentRate: this.formData.interestRate,
      onRateSelect: (rate) => {
        // Update interest rate input and slider
        const interestRateInput = this.container.querySelector('#interestRate');
        const interestRateSlider = this.container.querySelector('#interestRate-slider');

        if (interestRateInput && interestRateSlider) {
          interestRateInput.value = rate;
          interestRateSlider.value = rate;

          // Trigger calculation update
          this.handleCalculate();
        }
      },
    });
  }

  render() {
    if (!this.container) return;

    // Get translations based on current language
    const t = (key) => getTranslation(key, this.language);

    const formHtml = `
      <div class="calculator-form">
        <h2 id="form-title">${t('form.title')}</h2>
        <form id="loan-calculator-form" role="form" aria-labelledby="form-title" novalidate>
          <!-- Loan Type Selector -->
          <div class="form-group">
            <div class="form-input-wrapper">
              <select id="loan-type" class="form-select" name="type" aria-describedby="loan-type-help">
                ${Object.entries(LOAN_TYPES).map(([key, value]) => {
    const translationKey = `form.${key}`;
    const description = t(translationKey) !== translationKey ? t(translationKey) : value.description;
    return `<option value="${key}" ${this.formData.type === key ? 'selected' : ''}>${description}</option>`;
  }).join('')}
              </select>
              <label for="loan-type" class="form-label floating">
                ${t('form.loanType')}
                <span class="info-icon" data-tooltip="${t('tooltips.loanType')}" data-tooltip-position="top" aria-label="Help information" role="button" tabindex="0">?</span>
              </label>
              <div id="loan-type-help" class="sr-only">${t('tooltips.loanType')}</div>
            </div>
          </div>
          
          <!-- Loan Amount -->
          <div class="form-group">
            <div class="form-input-wrapper">
              <input 
                type="number" 
                id="principal" 
                class="form-input" 
                name="principal" 
                value="${this.formData.principal}" 
                min="${LOAN_TYPES[this.formData.type].minAmount}" 
                max="${LOAN_TYPES[this.formData.type].maxAmount}" 
                step="1000"
                placeholder=" "
                aria-describedby="principal-error principal-help"
                aria-invalid="false"
                required
              >
              <label for="principal" class="form-label">
                ${t('form.loanAmount')} (${this.formData.currency || 'USD'})
              </label>
              <div id="principal-help" class="sr-only">Enter the total amount you want to borrow, between ${formatters.formatCurrency(LOAN_TYPES[this.formData.type].minAmount, this.formData.currency || 'USD', this.locale)} and ${formatters.formatCurrency(LOAN_TYPES[this.formData.type].maxAmount, this.formData.currency || 'USD', this.locale)}</div>
            </div>
            <div class="range-container">
              <input 
                type="range" 
                id="principal-slider" 
                class="form-slider" 
                min="${LOAN_TYPES[this.formData.type].minAmount}" 
                max="${LOAN_TYPES[this.formData.type].maxAmount}" 
                step="1000" 
                value="${this.formData.principal}"
                aria-label="Loan amount slider"
                aria-describedby="principal-slider-help"
              >
              <div id="principal-slider-help" class="sr-only">Use this slider to adjust the loan amount</div>
              <div class="range-values" aria-hidden="true">
                <span>${formatters.formatCurrency(LOAN_TYPES[this.formData.type].minAmount, this.formData.currency || 'USD', this.locale)}</span>
                <span>${formatters.formatCurrency(LOAN_TYPES[this.formData.type].maxAmount, this.formData.currency || 'USD', this.locale)}</span>
              </div>
            </div>
            <div class="invalid-feedback" id="principal-error" role="alert" aria-live="polite"></div>
          </div>
          
          <!-- Down Payment -->
          <div class="form-group">
            <div class="form-input-wrapper">
              <input 
                type="number" 
                id="downPayment" 
                class="form-input" 
                name="downPayment" 
                value="${this.formData.downPayment}" 
                min="0" 
                max="${this.formData.principal}" 
                step="1000"
                placeholder=" "
              >
              <label for="downPayment" class="form-label">${t('form.downPayment')} (${this.formData.currency || 'USD'})</label>
            </div>
            <div class="range-container">
              <input 
                type="range" 
                id="downPayment-slider" 
                class="form-slider" 
                min="0" 
                max="${this.formData.principal}" 
                step="1000" 
                value="${this.formData.downPayment}"
              >
              <div class="range-values">
                <span>${formatters.formatCurrency(0, this.formData.currency || 'USD', this.locale)}</span>
                <span>${formatters.formatCurrency(this.formData.principal, this.formData.currency || 'USD', this.locale)}</span>
              </div>
            </div>
            <div class="invalid-feedback" id="downPayment-error"></div>
          </div>
          
          <!-- Interest Rate -->
          <div class="form-group">
            <div class="form-input-wrapper">
              <input 
                type="number" 
                id="interestRate" 
                class="form-input" 
                name="interestRate" 
                value="${this.formData.interestRate}" 
                min="0" 
                max="30" 
                step="0.125"
                placeholder=" "
                aria-describedby="interestRate-error interestRate-help"
                aria-invalid="false"
                required
              >
              <label for="interestRate" class="form-label">${t('form.interestRate')} (%)</label>
              <div id="interestRate-help" class="sr-only">Enter the annual interest rate as a percentage, between 0% and 30%</div>
            </div>
            <div class="range-container">
              <input 
                type="range" 
                id="interestRate-slider" 
                class="form-slider" 
                min="0" 
                max="30" 
                step="0.125" 
                value="${this.formData.interestRate}"
                aria-label="Interest rate slider"
                aria-describedby="interestRate-slider-help"
              >
              <div id="interestRate-slider-help" class="sr-only">Use this slider to adjust the interest rate</div>
              <div class="range-values" aria-hidden="true">
                <span>0%</span>
                <span>30%</span>
              </div>
            </div>
            <div class="invalid-feedback" id="interestRate-error" role="alert" aria-live="polite"></div>
          </div>
          
          <!-- Market Rates -->
          <div id="market-rates-container" class="market-rates-container"></div>
          
          <!-- Loan Term -->
          <div class="form-group">
            <div class="form-input-wrapper">
              <input 
                type="number" 
                id="term" 
                class="form-input" 
                name="term" 
                value="${this.formData.term}" 
                min="1" 
                max="600" 
                step="1"
                placeholder=" "
              >
              <label for="term" class="form-label">${t('form.loanTerm')} (${t('form.months')})</label>
            </div>
            <div class="range-container">
              <input 
                type="range" 
                id="term-slider" 
                class="form-slider" 
                min="1" 
                max="600" 
                step="1" 
                value="${this.formData.term}"
              >
              <div class="range-values">
                <span>1 ${t('form.months')}</span>
                <span>600 ${t('form.months')}</span>
              </div>
            </div>
            <div class="term-presets">
              <button type="button" class="term-preset outline small" data-term="60">5 ${t('form.years')}</button>
              <button type="button" class="term-preset outline small" data-term="180">15 ${t('form.years')}</button>
              <button type="button" class="term-preset outline small" data-term="360">30 ${t('form.years')}</button>
            </div>
            <div class="invalid-feedback" id="term-error"></div>
          </div>
          
          <!-- Payment Frequency -->
          <div class="form-group">
            <div class="form-input-wrapper">
              <select id="paymentFrequency" class="form-select" name="paymentFrequency">
                ${Object.entries(PAYMENT_FREQUENCIES).map(([key, value]) => {
    const translationKey = `form.${key}`;
    const description = t(translationKey) !== translationKey ? t(translationKey) : value.description;
    return `<option value="${key}" ${this.formData.paymentFrequency === key ? 'selected' : ''}>${description}</option>`;
  }).join('')}
              </select>
              <label for="paymentFrequency" class="form-label floating">${t('form.paymentFrequency')}</label>
            </div>
          </div>
          
          <!-- Start Date -->
          <div class="form-group">
            <div class="form-input-wrapper">
              <input 
                type="date" 
                id="startDate" 
                class="form-input" 
                name="startDate" 
                value="${new Date(this.formData.startDate).toISOString().split('T')[0]}"
                placeholder=" "
              >
              <label for="startDate" class="form-label">${t('form.startDate')}</label>
            </div>
            <div class="invalid-feedback" id="startDate-error"></div>
          </div>
          
          <!-- Additional Payment -->
          <div class="form-group">
            <div class="form-input-wrapper">
              <input 
                type="number" 
                id="additionalPayment" 
                class="form-input" 
                name="additionalPayment" 
                value="${this.formData.additionalPayment}" 
                min="0" 
                step="10"
                placeholder=" "
              >
              <label for="additionalPayment" class="form-label">${t('form.additionalPayment')} (${this.formData.currency || 'USD'})</label>
            </div>
            <div class="invalid-feedback" id="additionalPayment-error"></div>
          </div>
          
          <!-- Inflation Rate -->
          <div class="form-group">
            <div class="form-input-wrapper">
              <input 
                type="number" 
                id="inflationRate" 
                class="form-input" 
                name="inflationRate" 
                value="${this.formData.inflationRate || 2.5}" 
                min="0" 
                max="20" 
                step="0.1"
                placeholder=" "
              >
              <label for="inflationRate" class="form-label">
                ${t('form.inflationRate') || 'Inflation Rate'} (%)
                <span class="info-icon" data-tooltip="${t('tooltips.inflationRate') || 'Annual inflation rate used to calculate the real value of future payments.'}" data-tooltip-position="top">?</span>
              </label>
            </div>
            <div class="range-container">
              <input 
                type="range" 
                id="inflationRate-slider" 
                class="form-slider" 
                min="0" 
                max="20" 
                step="0.1" 
                value="${this.formData.inflationRate || 2.5}"
              >
              <div class="range-values">
                <span>0%</span>
                <span>20%</span>
              </div>
            </div>
            <div class="invalid-feedback" id="inflationRate-error"></div>
          </div>
          
          <!-- Calculate Button -->
          <div class="form-group">
            <div class="form-buttons">
              <button type="submit" class="form-button" id="calculate-button" aria-describedby="calculate-help">
                ${t('form.calculate')}
              </button>
              <button type="button" class="form-button secondary" id="reset-button" aria-describedby="reset-help">
                ${t('form.reset')}
              </button>
              <div id="calculate-help" class="sr-only">Calculate your loan payment and amortization schedule</div>
              <div id="reset-help" class="sr-only">Reset all form fields to their default values</div>
            </div>
          </div>
        </form>
      </div>
    `;

    this.container.innerHTML = formHtml;

    // Enhance form accessibility
    enhanceFormAccessibility(this.container);
  }

  bindEvents() {
    if (!this.container) return;

    // Get form element
    const form = this.container.querySelector('#loan-calculator-form');
    if (!form) return;

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCalculate();
    });

    // Add ripple effect to calculate button
    const calculateButton = this.container.querySelector('#calculate-button');
    if (calculateButton) {
      calculateButton.addEventListener('click', (e) => {
        animationManager.createRippleEffect(calculateButton, e);
      });
    }

    // Reset button
    const resetButton = this.container.querySelector('#reset-button');
    if (resetButton) {
      resetButton.addEventListener('click', () => this.reset());
    }

    // Loan type change
    const loanTypeSelect = this.container.querySelector('#loan-type');
    if (loanTypeSelect) {
      loanTypeSelect.addEventListener('change', (e) => {
        const loanType = e.target.value;
        this.updateLoanTypeParameters(loanType);
      });
    }

    // Sync sliders with input fields
    this.bindSliderInputSync('principal');
    this.bindSliderInputSync('downPayment');
    this.bindSliderInputSync('interestRate');
    this.bindSliderInputSync('term');
    this.bindSliderInputSync('inflationRate');

    // Term presets
    const termPresets = this.container.querySelectorAll('.term-preset');
    termPresets.forEach((preset) => {
      preset.addEventListener('click', (e) => {
        const term = parseInt(e.target.dataset.term, 10);
        const termInput = this.container.querySelector('#term');
        const termSlider = this.container.querySelector('#term-slider');

        if (termInput && termSlider) {
          termInput.value = term;
          termSlider.value = term;

          // Trigger validation and real-time update
          this.validateField('term', term);
          this.handleCalculate();
        }
      });
    });

    // Real-time validation for all inputs
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input) => {
      input.addEventListener('input', (e) => {
        const field = e.target.name || e.target.id;
        const { value } = e.target;

        this.validateField(field, value);

        // Update down payment max when principal changes
        if (field === 'principal') {
          const downPaymentInput = this.container.querySelector('#downPayment');
          const downPaymentSlider = this.container.querySelector('#downPayment-slider');

          if (downPaymentInput && downPaymentSlider) {
            const principal = parseFloat(value);
            downPaymentInput.max = principal;
            downPaymentSlider.max = principal;

            // Ensure down payment is not greater than principal
            if (parseFloat(downPaymentInput.value) > principal) {
              downPaymentInput.value = principal;
              downPaymentSlider.value = principal;

              // Trigger input event to update formData
              const inputEvent = new Event('input');
              downPaymentInput.dispatchEvent(inputEvent);
            }
          }
        }

        // Real-time calculation updates
        this.handleCalculate();
      });
    });

    // Initialize tooltips
    initTooltips(this.container);

    // Initialize floating labels
    this.initFloatingLabels();
  }

  /**
   * Cleanup resources when component is destroyed
   */
  destroy() {
    // Cancel any pending calculations
    if (this.asyncCalculator) {
      this.asyncCalculator.destroy();
    }

    // Clear any active loading states
    loadingManager.clearAll();

    // Remove event listeners
    if (this.container) {
      const form = this.container.querySelector('#loan-calculator-form');
      if (form) {
        form.removeEventListener('submit', this.handleCalculate);
      }
    }
  }

  /**
   * Bind slider and input field to sync with each other
   * @param {string} fieldName - Name of the field
   */
  bindSliderInputSync(fieldName) {
    const input = this.container.querySelector(`#${fieldName}`);
    const slider = this.container.querySelector(`#${fieldName}-slider`);

    if (input && slider) {
      // Update input when slider changes
      slider.addEventListener('input', (e) => {
        input.value = e.target.value;
        this.validateField(fieldName, e.target.value);
      });

      // Update slider when input changes
      input.addEventListener('input', (e) => {
        slider.value = e.target.value;
      });
    }
  }

  /**
   * Update form parameters based on loan type
   * @param {string} loanType - Type of loan
   */
  updateLoanTypeParameters(loanType) {
    if (!LOAN_TYPES[loanType]) return;

    const typeDefaults = LOAN_TYPES[loanType];

    // Update principal min/max
    const principalInput = this.container.querySelector('#principal');
    const principalSlider = this.container.querySelector('#principal-slider');

    if (principalInput && principalSlider) {
      principalInput.min = typeDefaults.minAmount;
      principalInput.max = typeDefaults.maxAmount;
      principalSlider.min = typeDefaults.minAmount;
      principalSlider.max = typeDefaults.maxAmount;

      // Update range display
      const rangeValues = principalSlider.parentElement.querySelector('.range-values');
      if (rangeValues) {
        rangeValues.innerHTML = `
          <span>${formatters.formatCurrency(typeDefaults.minAmount, this.formData.currency || 'USD', this.locale)}</span>
          <span>${formatters.formatCurrency(typeDefaults.maxAmount, this.formData.currency || 'USD', this.locale)}</span>
        `;
      }

      // Adjust value if outside new range
      const currentValue = parseFloat(principalInput.value);
      if (currentValue < typeDefaults.minAmount) {
        principalInput.value = typeDefaults.minAmount;
        principalSlider.value = typeDefaults.minAmount;
      } else if (currentValue > typeDefaults.maxAmount) {
        principalInput.value = typeDefaults.maxAmount;
        principalSlider.value = typeDefaults.maxAmount;
      }
    }

    // Update term default
    const termInput = this.container.querySelector('#term');
    const termSlider = this.container.querySelector('#term-slider');

    if (termInput && termSlider) {
      termInput.value = typeDefaults.defaultTerm;
      termSlider.value = typeDefaults.defaultTerm;
    }

    // Update interest rate default
    const interestRateInput = this.container.querySelector('#interestRate');
    const interestRateSlider = this.container.querySelector('#interestRate-slider');

    if (interestRateInput && interestRateSlider) {
      interestRateInput.value = typeDefaults.defaultRate;
      interestRateSlider.value = typeDefaults.defaultRate;
    }

    // Update market rates component with new loan type
    if (this.marketRatesComponent) {
      this.marketRatesComponent.updateLoanType(loanType);
      this.marketRatesComponent.updateCurrentRate(typeDefaults.defaultRate);
    }

    // Trigger calculation with new defaults
    this.handleCalculate();
  }

  /**
   * Validate a single field
   * @param {string} field - Field name
   * @param {any} value - Field value
   * @returns {boolean} True if valid
   */
  validateField(field, value) {
    const validator = this.validators[field];
    if (!validator) return true;

    let isValid = true;
    let errorMessage = '';

    try {
      isValid = validator(value);

      if (!isValid) {
        // Get appropriate error message based on field and value
        errorMessage = this.getFieldErrorMessage(field, value);
      }
    } catch (error) {
      isValid = false;
      errorMessage = `Validation error: ${error.message}`;
    }

    // Update UI
    const input = this.container.querySelector(`#${field}`);
    const errorElement = this.container.querySelector(`#${field}-error`);

    if (input && errorElement) {
      if (isValid) {
        input.classList.remove('is-invalid');
        input.setAttribute('aria-invalid', 'false');
        errorElement.textContent = '';
        errorElement.removeAttribute('aria-live');
      } else {
        input.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');
        errorElement.textContent = errorMessage;
        errorElement.setAttribute('aria-live', 'polite');
        errorElement.setAttribute('role', 'alert');

        // Announce validation error to screen readers
        announceValidationError(field, errorMessage);
      }
    }

    return isValid;
  }

  /**
   * Get appropriate error message for a field
   * @param {string} field - Field name
   * @param {any} value - Field value
   * @returns {string} Error message
   */
  getFieldErrorMessage(field, value) {
    const input = this.container.querySelector(`#${field}`);
    const min = input ? parseFloat(input.min) : null;
    const max = input ? parseFloat(input.max) : null;
    const numValue = parseFloat(value);

    switch (field) {
      case 'principal':
        if (isNaN(numValue) || numValue <= 0) {
          return 'Please enter a valid loan amount greater than $0';
        }
        if (min !== null && numValue < min) {
          return `Loan amount must be at least $${min.toLocaleString()}`;
        }
        if (max !== null && numValue > max) {
          return `Loan amount cannot exceed $${max.toLocaleString()}`;
        }
        return 'Please enter a valid loan amount';

      case 'interestRate':
        if (isNaN(numValue) || numValue < 0) {
          return 'Interest rate must be 0% or higher';
        }
        if (numValue > 50) {
          return 'Interest rate seems unusually high. Please verify.';
        }
        return 'Please enter a valid interest rate';

      case 'term':
        if (isNaN(numValue) || numValue <= 0) {
          return 'Loan term must be greater than 0 months';
        }
        if (numValue > 600) {
          return 'Loan term cannot exceed 600 months (50 years)';
        }
        return 'Please enter a valid loan term';

      case 'downPayment':
        if (isNaN(numValue) || numValue < 0) {
          return 'Down payment cannot be negative';
        }
        if (max !== null && numValue > max) {
          return 'Down payment cannot exceed the loan amount';
        }
        return 'Please enter a valid down payment';

      case 'additionalPayment':
        if (isNaN(numValue) || numValue < 0) {
          return 'Additional payment cannot be negative';
        }
        return 'Please enter a valid additional payment amount';

      case 'inflationRate':
        if (isNaN(numValue) || numValue < 0) {
          return 'Inflation rate cannot be negative';
        }
        if (numValue > 20) {
          return 'Inflation rate seems unusually high. Please verify.';
        }
        return 'Please enter a valid inflation rate';

      default:
        return 'Please enter a valid value';
    }
  }

  /**
   * Validate all form fields
   * @returns {boolean} True if all fields are valid
   */
  validate() {
    let isValid = true;
    const form = this.container.querySelector('#loan-calculator-form');

    if (!form) return false;

    // Validate each field
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input) => {
      const field = input.name || input.id;
      const { value } = input;

      if (this.validators[field]) {
        const fieldValid = this.validateField(field, value);
        isValid = isValid && fieldValid;
      }
    });

    return isValid;
  }

  /**
   * Handle form calculation with async processing
   */
  async handleCalculate() {
    const formData = this.getFormData();

    // Validate form data before calculation
    if (!this.validate()) {
      const errorMessage = 'Please correct the errors in the form before calculating.';
      this.showFormError(errorMessage);
      announceLoadingState('error', errorMessage);
      return;
    }

    // Store currently focused element for restoration later
    const { activeElement } = document;
    if (activeElement && activeElement !== document.body) {
      activeElement.setAttribute('data-was-focused', 'true');
    }

    // Show enhanced loading with progress steps
    const calculationSteps = [
      { id: 'validate', label: 'Validating Input', status: 'completed' },
      { id: 'calculate', label: 'Calculating Payment', status: 'active' },
      { id: 'amortization', label: 'Building Schedule', status: 'pending' },
      { id: 'render', label: 'Rendering Results', status: 'pending' },
    ];

    loadingManager.showProgressOverlay(calculationSteps, {
      title: 'Calculating Your Loan',
      message: 'Using advanced async processing for optimal performance...',
      cancellable: true,
      onCancel: () => {
        this.asyncCalculator.cancelAllCalculations();
      },
    });

    // Add enhanced loading state to calculate button
    const calculateButton = this.container.querySelector('#calculate-button');
    if (calculateButton) {
      calculateButton.disabled = true;
      calculateButton.classList.add('loading');
      calculateButton.setAttribute('data-original-text', calculateButton.textContent);
      calculateButton.innerHTML = `
        <div class="loading-spinner-dots" style="display: inline-flex; margin-right: 0.5rem;">
          <div class="loading-dot" style="width: 6px; height: 6px; margin: 0 2px;"></div>
          <div class="loading-dot" style="width: 6px; height: 6px; margin: 0 2px;"></div>
          <div class="loading-dot" style="width: 6px; height: 6px; margin: 0 2px;"></div>
        </div>
        Calculating...
      `;
    }

    try {
      // Create loan object from form data
      // Ensure required fields have valid values
      if (!formData.principal || formData.principal <= 0) {
        throw new Error('Please enter a valid loan amount');
      }
      if (!formData.interestRate || formData.interestRate < 0) {
        throw new Error('Please enter a valid interest rate');
      }
      if (!formData.term || formData.term <= 0) {
        throw new Error('Please enter a valid loan term');
      }
      
      const loan = Loan.fromJSON(formData);

      // Update market rates component with current interest rate
      if (this.marketRatesComponent) {
        this.marketRatesComponent.updateCurrentRate(formData.interestRate);
      }

      // Progress callback for async calculations
      const onProgress = (progress, message, currentStep) => {
        loadingManager.updateProgress(progress, message, currentStep);

        // Update step status based on progress
        if (progress >= 95 && currentStep === 'calculate') {
          loadingManager.updateStepStatus('calculate', 'completed');
          loadingManager.updateStepStatus('amortization', 'active');
        }
      };

      // Perform calculation using the same approach as main app
      loadingManager.updateProgress(10, 'Starting calculation...', 'calculate');

      // Import the amortization model dynamically
      const { AmortizationSchedule } = await import(/* webpackChunkName: "amortization-model" */ '../models/amortization.model');

      // Create amortization schedule without auto-generation
      const amortizationSchedule = new AmortizationSchedule(loan, false);

      // Verify the loan object has required methods
      if (typeof loan.totalLoanAmount !== 'function') {
        throw new Error('Invalid loan object: missing totalLoanAmount method');
      }
      if (typeof loan.periodicInterestRate !== 'function') {
        throw new Error('Invalid loan object: missing periodicInterestRate method');
      }
      if (typeof loan.paymentAmount !== 'function') {
        throw new Error('Invalid loan object: missing paymentAmount method');
      }

      // Generate schedule asynchronously with progress updates
      await amortizationSchedule.generateScheduleAsync({
        includeAdditionalPayments: true,
        timeout: 30000,
        onProgress: (progress, message) => {
          onProgress(10 + (progress * 0.8), message, 'calculate');
        },
      });

      // Update progress for rendering
      loadingManager.updateProgress(95, 'Preparing results...', 'render');
      loadingManager.updateStepStatus('amortization', 'completed');
      loadingManager.updateStepStatus('render', 'active');

      // Calculate inflation-adjusted values if inflation rate is provided
      let inflationAdjusted = null;
      if (loan.inflationRate !== undefined && loan.inflationRate > 0) {
        const module = await import(/* webpackChunkName: "calculator-service" */ '../services/calculator.service');
        const CalculatorService = module.default;
        const calculatorService = new CalculatorService();
        inflationAdjusted = calculatorService.calculateInflationAdjusted(amortizationSchedule, loan.inflationRate);
      }

      // Call the calculation callback
      if (typeof this.onCalculate === 'function') {
        await this.onCalculate(loan, amortizationSchedule, inflationAdjusted);
      }

      // Complete the process
      loadingManager.updateProgress(100, 'Complete!', 'render');
      loadingManager.updateStepStatus('render', 'completed');

      // Small delay before hiding
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
    } catch (error) {
      console.error('Error calculating loan:', error);

      // Update progress to show error
      const currentStep = error.message.includes('timeout') ? 'amortization' : 'calculate';
      loadingManager.updateStepStatus(currentStep, 'error');
      loadingManager.updateProgress(0, `Error: ${error.message}`, currentStep);

      // Hide loading after a moment
      setTimeout(() => {
        loadingManager.hideProgressOverlay();
      }, 2000);

      this.showFormError(`Calculation error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      // Remove loading state from calculate button
      if (calculateButton) {
        calculateButton.disabled = false;
        calculateButton.classList.remove('loading');
        const originalText = calculateButton.getAttribute('data-original-text') || 'Calculate';
        calculateButton.textContent = originalText;
      }

      // Hide progress overlay after a short delay
      setTimeout(() => {
        loadingManager.hideProgressOverlay();
      }, 800);
    }
  }

  /**
   * Show form error message
   * @param {string} message - Error message to display
   */
  showFormError(message) {
    // Remove any existing error messages
    const existingError = this.container.querySelector('.form-error-message');
    if (existingError) {
      existingError.remove();
    }

    // Create error message element
    const errorContainer = document.createElement('div');
    errorContainer.className = 'form-error-message';
    errorContainer.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-text">${message}</span>
        <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Insert at the top of the form
    const form = this.container.querySelector('#loan-calculator-form');
    if (form) {
      form.insertBefore(errorContainer, form.firstChild);

      // Auto-remove error message after 8 seconds
      setTimeout(() => {
        if (errorContainer.parentNode) {
          errorContainer.remove();
        }
      }, 8000);
    }
  }

  /**
   * Get form data from inputs
   * @returns {Object} Form data
   */
  getFormData() {
    const form = this.container.querySelector('#loan-calculator-form');
    if (!form) {
      return this.formData;
    }

    const formData = {
      ...this.formData,
    };

    // Get values from form inputs
    const inputs = form.querySelectorAll('input, select');
    
    inputs.forEach((input) => {
      const field = input.name || input.id;
      let { value } = input;

      // Convert numeric values
      if (input.type === 'number' || input.type === 'range') {
        value = parseFloat(value);
        // Handle NaN values
        if (isNaN(value)) {
          value = 0;
        }
      }

      // Convert date values
      if (input.type === 'date') {
        value = new Date(value);
      }

      formData[field] = value;
    });

    // Ensure required fields have default values
    if (!formData.principal || formData.principal <= 0) {
      formData.principal = 300000; // Default loan amount
    }
    if (!formData.interestRate || formData.interestRate < 0) {
      formData.interestRate = 4.5; // Default interest rate
    }
    if (!formData.term || formData.term <= 0) {
      formData.term = 360; // Default 30 years
    }
    if (!formData.downPayment) {
      formData.downPayment = 0;
    }
    if (!formData.additionalPayment) {
      formData.additionalPayment = 0;
    }
    if (!formData.paymentFrequency) {
      formData.paymentFrequency = 'monthly';
    }
    if (!formData.type) {
      formData.type = 'mortgage';
    }
    if (!formData.startDate) {
      formData.startDate = new Date();
    }

    this.formData = formData;
    return formData;
  }

  /**
   * Set form data and update UI
   * @param {Object} data - Form data
   */
  setFormData(data) {
    this.formData = {
      ...this.formData,
      ...data,
    };

    // Update form inputs
    const form = this.container.querySelector('#loan-calculator-form');
    if (!form) return;

    Object.entries(data).forEach(([field, value]) => {
      const input = form.querySelector(`#${field}`);
      const slider = form.querySelector(`#${field}-slider`);

      if (input) {
        // Handle date fields
        if (input.type === 'date' && value instanceof Date) {
          const [dateString] = value.toISOString().split('T');
          input.value = dateString;
        } else {
          input.value = value;
        }
      }

      // Update sliders
      if (slider) {
        slider.value = value;
      }
    });

    // Validate and calculate
    this.validate();
    this.handleCalculate();
  }

  /**
   * Reset form to defaults
   */
  reset() {
    const loanType = this.formData.type || 'mortgage';
    const defaultLoan = Loan.createDefault(loanType);

    // Preserve inflation rate setting
    const inflationRate = this.formData.inflationRate || 2.5;

    this.setFormData({
      ...defaultLoan.toJSON(),
      inflationRate,
    });
  }

  /**
   * Update language and re-render component
   * @param {string} language - Language code
   */
  updateLanguage(language) {
    if (this.language !== language) {
      this.language = language;
      this.locale = formatters.getLocaleFromLanguage(language);
      this.render();
      this.bindEvents();

      // Re-initialize market rates with new language
      this.initMarketRates();

      // Update market rates component language if it exists
      if (this.marketRatesComponent) {
        this.marketRatesComponent.updateLanguage(language);
      }
    }
  }

  /**
   * Update currency format
   * @param {string} currency - Currency code
   */
  updateCurrencyFormat(currency) {
    if (this.formData.currency !== currency) {
      this.formData.currency = currency;
      this.render();
      this.bindEvents();
    }
  }

  /**
   * Initialize floating label behavior
   */
  initFloatingLabels() {
    if (!this.container) return;

    const inputs = this.container.querySelectorAll('.form-input, .form-select');

    inputs.forEach((input) => {
      const label = input.nextElementSibling;
      if (!label || !label.classList.contains('form-label')) return;

      // Check if input has value on load
      this.updateFloatingLabel(input, label);

      // Handle focus events
      input.addEventListener('focus', () => {
        label.classList.add('floating');
      });

      // Handle blur events
      input.addEventListener('blur', () => {
        this.updateFloatingLabel(input, label);
      });

      // Handle input events
      input.addEventListener('input', () => {
        this.updateFloatingLabel(input, label);
      });
    });
  }

  /**
   * Update floating label state based on input value
   * @param {HTMLElement} input - Input element
   * @param {HTMLElement} label - Label element
   */
  updateFloatingLabel(input, label) {
    const hasValue = input.value && input.value.trim() !== '';
    const isSelect = input.tagName.toLowerCase() === 'select';
    const isDate = input.type === 'date';

    if (hasValue || isSelect || isDate) {
      label.classList.add('floating');
    } else {
      label.classList.remove('floating');
    }
  }
}

export default CalculatorForm;
