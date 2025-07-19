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
        <h2>${t('form.title')}</h2>
        <form id="loan-calculator-form">
          <!-- Loan Type Selector -->
          <div class="form-group">
            <label for="loan-type" class="form-label">
              ${t('form.loanType')}
              <span class="info-icon" data-tooltip="${t('tooltips.loanType')}" data-tooltip-position="top">?</span>
            </label>
            <select id="loan-type" class="form-select" name="type">
              ${Object.entries(LOAN_TYPES).map(([key, value]) => {
    const translationKey = `form.${key}`;
    const description = t(translationKey) !== translationKey ? t(translationKey) : value.description;
    return `<option value="${key}" ${this.formData.type === key ? 'selected' : ''}>${description}</option>`;
  }).join('')}
            </select>
          </div>
          
          <!-- Loan Amount -->
          <div class="form-group">
            <label for="principal" class="form-label">
              ${t('form.loanAmount')} (${this.formData.currency || 'USD'})
            </label>
            <input 
              type="number" 
              id="principal" 
              class="form-input" 
              name="principal" 
              value="${this.formData.principal}" 
              min="${LOAN_TYPES[this.formData.type].minAmount}" 
              max="${LOAN_TYPES[this.formData.type].maxAmount}" 
              step="1000"
            >
            <div class="range-container">
              <input 
                type="range" 
                id="principal-slider" 
                class="form-slider" 
                min="${LOAN_TYPES[this.formData.type].minAmount}" 
                max="${LOAN_TYPES[this.formData.type].maxAmount}" 
                step="1000" 
                value="${this.formData.principal}"
              >
              <div class="range-values">
                <span>${formatters.formatCurrency(LOAN_TYPES[this.formData.type].minAmount, this.formData.currency || 'USD', this.locale)}</span>
                <span>${formatters.formatCurrency(LOAN_TYPES[this.formData.type].maxAmount, this.formData.currency || 'USD', this.locale)}</span>
              </div>
            </div>
            <div class="invalid-feedback" id="principal-error"></div>
          </div>
          
          <!-- Down Payment -->
          <div class="form-group">
            <label for="downPayment" class="form-label">${t('form.downPayment')} (${this.formData.currency || 'USD'})</label>
            <input 
              type="number" 
              id="downPayment" 
              class="form-input" 
              name="downPayment" 
              value="${this.formData.downPayment}" 
              min="0" 
              max="${this.formData.principal}" 
              step="1000"
            >
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
            <label for="interestRate" class="form-label">${t('form.interestRate')} (%)</label>
            <input 
              type="number" 
              id="interestRate" 
              class="form-input" 
              name="interestRate" 
              value="${this.formData.interestRate}" 
              min="0" 
              max="30" 
              step="0.125"
            >
            <div class="range-container">
              <input 
                type="range" 
                id="interestRate-slider" 
                class="form-slider" 
                min="0" 
                max="30" 
                step="0.125" 
                value="${this.formData.interestRate}"
              >
              <div class="range-values">
                <span>0%</span>
                <span>30%</span>
              </div>
            </div>
            <div class="invalid-feedback" id="interestRate-error"></div>
          </div>
          
          <!-- Market Rates -->
          <div id="market-rates-container" class="market-rates-container"></div>
          
          <!-- Loan Term -->
          <div class="form-group">
            <label for="term" class="form-label">${t('form.loanTerm')} (${t('form.months')})</label>
            <input 
              type="number" 
              id="term" 
              class="form-input" 
              name="term" 
              value="${this.formData.term}" 
              min="1" 
              max="600" 
              step="1"
            >
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
              <button type="button" class="term-preset" data-term="60">5 ${t('form.years')}</button>
              <button type="button" class="term-preset" data-term="180">15 ${t('form.years')}</button>
              <button type="button" class="term-preset" data-term="360">30 ${t('form.years')}</button>
            </div>
            <div class="invalid-feedback" id="term-error"></div>
          </div>
          
          <!-- Payment Frequency -->
          <div class="form-group">
            <label for="paymentFrequency" class="form-label">${t('form.paymentFrequency')}</label>
            <select id="paymentFrequency" class="form-select" name="paymentFrequency">
              ${Object.entries(PAYMENT_FREQUENCIES).map(([key, value]) => {
    const translationKey = `form.${key}`;
    const description = t(translationKey) !== translationKey ? t(translationKey) : value.description;
    return `<option value="${key}" ${this.formData.paymentFrequency === key ? 'selected' : ''}>${description}</option>`;
  }).join('')}
            </select>
          </div>
          
          <!-- Start Date -->
          <div class="form-group">
            <label for="startDate" class="form-label">${t('form.startDate')}</label>
            <input 
              type="date" 
              id="startDate" 
              class="form-input" 
              name="startDate" 
              value="${new Date(this.formData.startDate).toISOString().split('T')[0]}"
            >
            <div class="invalid-feedback" id="startDate-error"></div>
          </div>
          
          <!-- Additional Payment -->
          <div class="form-group">
            <label for="additionalPayment" class="form-label">${t('form.additionalPayment')} (${this.formData.currency || 'USD'})</label>
            <input 
              type="number" 
              id="additionalPayment" 
              class="form-input" 
              name="additionalPayment" 
              value="${this.formData.additionalPayment}" 
              min="0" 
              step="10"
            >
            <div class="invalid-feedback" id="additionalPayment-error"></div>
          </div>
          
          <!-- Inflation Rate -->
          <div class="form-group">
            <label for="inflationRate" class="form-label">
              ${t('form.inflationRate') || 'Inflation Rate'} (%)
              <span class="info-icon" data-tooltip="${t('tooltips.inflationRate') || 'Annual inflation rate used to calculate the real value of future payments.'}" data-tooltip-position="top">?</span>
            </label>
            <input 
              type="number" 
              id="inflationRate" 
              class="form-input" 
              name="inflationRate" 
              value="${this.formData.inflationRate || 2.5}" 
              min="0" 
              max="20" 
              step="0.1"
            >
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
            <button type="submit" class="form-button" id="calculate-button">${t('form.calculate')}</button>
            <button type="button" class="form-button" id="reset-button">${t('form.reset')}</button>
          </div>
        </form>
      </div>
    `;

    this.container.innerHTML = formHtml;
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
        errorElement.textContent = '';
      } else {
        input.classList.add('is-invalid');
        errorElement.textContent = errorMessage;
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
   * Handle form calculation
   */
  async handleCalculate() {
    const formData = this.getFormData();

    // Validate form data before calculation
    if (!this.validate()) {
      this.showFormError('Please correct the errors in the form before calculating.');
      return;
    }

    // Disable calculate button during calculation
    const calculateButton = this.container.querySelector('#calculate-button');
    if (calculateButton) {
      calculateButton.disabled = true;
      calculateButton.textContent = 'Calculating...';
    }

    // Create loan object from form data
    try {
      const loan = Loan.fromJSON(formData);

      // Update market rates component with current interest rate
      if (this.marketRatesComponent) {
        this.marketRatesComponent.updateCurrentRate(formData.interestRate);
      }

      // Call the calculation callback
      if (typeof this.onCalculate === 'function') {
        await this.onCalculate(loan);
      }
    } catch (error) {
      console.error('Error calculating loan:', error);
      this.showFormError(`Calculation error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      // Re-enable calculate button
      if (calculateButton) {
        calculateButton.disabled = false;
        calculateButton.textContent = 'Calculate';
      }
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
    if (!form) return this.formData;

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
      }

      // Convert date values
      if (input.type === 'date') {
        value = new Date(value);
      }

      formData[field] = value;
    });

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
}

export default CalculatorForm;
