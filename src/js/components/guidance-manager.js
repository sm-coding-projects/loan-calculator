/**
 * Guidance Manager Component
 * Provides tooltips and guidance for the loan calculator
 * Implements requirement 5.2
 */

import { getTranslation } from '../utils/translations.js';
import { initTooltips, createGuidancePanel, createTutorial } from '../utils/tooltips.js';

class GuidanceManager {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('guidance-container');
    this.language = options.language || 'en';
    this.calculatorForm = options.calculatorForm;
    this.resultsDisplay = options.resultsDisplay;
    
    this.init();
  }
  
  /**
   * Initialize the component
   */
  init() {
    this.render();
    this.bindEvents();
    
    // Initialize tooltips throughout the application
    this.initializeTooltips();
  }
  
  /**
   * Render the guidance manager component
   */
  render() {
    if (!this.container) return;
    
    // Get translations based on current language
    const t = (key) => getTranslation(key, this.language);
    
    const guidanceHtml = `
      <div class="guidance-manager">
        <button id="show-tutorial" class="guidance-button" data-tooltip="${t('tooltips.startTutorial')}" data-tooltip-position="bottom">
          <span class="guidance-icon">🔍</span>
          <span class="guidance-text">${t('guidance.tutorial')}</span>
        </button>
        <button id="show-guidance" class="guidance-button" data-tooltip="${t('tooltips.showGuidance')}" data-tooltip-position="bottom">
          <span class="guidance-icon">💡</span>
          <span class="guidance-text">${t('guidance.help')}</span>
        </button>
      </div>
    `;
    
    this.container.innerHTML = guidanceHtml;
  }
  
  /**
   * Bind event listeners
   */
  bindEvents() {
    if (!this.container) return;
    
    // Tutorial button
    const tutorialButton = this.container.querySelector('#show-tutorial');
    if (tutorialButton) {
      tutorialButton.addEventListener('click', () => this.startTutorial());
    }
    
    // Guidance button
    const guidanceButton = this.container.querySelector('#show-guidance');
    if (guidanceButton) {
      guidanceButton.addEventListener('click', () => this.showGuidance());
    }
    
    // Initialize tooltips on the guidance buttons
    initTooltips(this.container);
  }
  
  /**
   * Initialize tooltips throughout the application
   */
  initializeTooltips() {
    // Initialize tooltips on all elements with data-tooltip attribute
    initTooltips(document);
    
    // Add tooltips to form fields if calculator form exists
    if (this.calculatorForm && this.calculatorForm.container) {
      this.addFormTooltips();
    }
    
    // Add tooltips to results if results display exists
    if (this.resultsDisplay && this.resultsDisplay.container) {
      this.addResultsTooltips();
    }
  }
  
  /**
   * Add tooltips to form fields
   */
  addFormTooltips() {
    const t = (key) => getTranslation(key, this.language);
    const formContainer = this.calculatorForm.container;
    
    // Add tooltips to form labels
    const addTooltipToField = (fieldId, tooltipKey, position = 'top') => {
      const label = formContainer.querySelector(`label[for="${fieldId}"]`);
      if (label) {
        // Check if info icon already exists
        if (!label.querySelector('.info-icon')) {
          const infoIcon = document.createElement('span');
          infoIcon.className = 'info-icon';
          infoIcon.textContent = '?';
          infoIcon.setAttribute('data-tooltip', t(tooltipKey));
          infoIcon.setAttribute('data-tooltip-position', position);
          label.appendChild(infoIcon);
        }
      }
    };
    
    // Add tooltips to all form fields
    addTooltipToField('loan-type', 'tooltips.loanType');
    addTooltipToField('principal', 'tooltips.loanAmount');
    addTooltipToField('interestRate', 'tooltips.interestRate');
    addTooltipToField('term', 'tooltips.loanTerm');
    addTooltipToField('downPayment', 'tooltips.downPayment');
    addTooltipToField('additionalPayment', 'tooltips.additionalPayment');
    addTooltipToField('paymentFrequency', 'tooltips.paymentFrequency');
    addTooltipToField('startDate', 'tooltips.startDate');
    
    // Initialize tooltips
    initTooltips(formContainer);
  }
  
  /**
   * Add tooltips to results
   */
  addResultsTooltips() {
    const t = (key) => getTranslation(key, this.language);
    const resultsContainer = this.resultsDisplay.container;
    
    // Add tooltips to result items
    const addTooltipToResult = (selector, tooltipKey, position = 'top') => {
      const element = resultsContainer.querySelector(selector);
      if (element) {
        // Check if info icon already exists
        if (!element.querySelector('.info-icon')) {
          const infoIcon = document.createElement('span');
          infoIcon.className = 'info-icon';
          infoIcon.textContent = '?';
          infoIcon.setAttribute('data-tooltip', t(tooltipKey));
          infoIcon.setAttribute('data-tooltip-position', position);
          element.appendChild(infoIcon);
        }
      }
    };
    
    // Add tooltips to all result items
    addTooltipToResult('.monthly-payment-label', 'tooltips.monthlyPayment');
    addTooltipToResult('.total-payment-label', 'tooltips.totalPayment');
    addTooltipToResult('.total-interest-label', 'tooltips.totalInterest');
    addTooltipToResult('.payoff-date-label', 'tooltips.payoffDate');
    addTooltipToResult('.interest-savings-label', 'tooltips.interestSavings');
    
    // Initialize tooltips
    initTooltips(resultsContainer);
  }
  
  /**
   * Start interactive tutorial
   */
  startTutorial() {
    const t = (key) => getTranslation(key, this.language);
    
    // Define tutorial steps
    const tutorialSteps = [
      {
        selector: '#loan-type',
        title: t('tutorial.loanTypeTitle'),
        content: t('tutorial.loanTypeContent'),
        position: 'bottom'
      },
      {
        selector: '#principal',
        title: t('tutorial.loanAmountTitle'),
        content: t('tutorial.loanAmountContent'),
        position: 'bottom'
      },
      {
        selector: '#interestRate',
        title: t('tutorial.interestRateTitle'),
        content: t('tutorial.interestRateContent'),
        position: 'bottom'
      },
      {
        selector: '#term',
        title: t('tutorial.loanTermTitle'),
        content: t('tutorial.loanTermContent'),
        position: 'bottom'
      },
      {
        selector: '.term-presets',
        title: t('tutorial.termPresetsTitle'),
        content: t('tutorial.termPresetsContent'),
        position: 'top'
      },
      {
        selector: '#additionalPayment',
        title: t('tutorial.additionalPaymentTitle'),
        content: t('tutorial.additionalPaymentContent'),
        position: 'top'
      },
      {
        selector: '#calculate-button',
        title: t('tutorial.calculateTitle'),
        content: t('tutorial.calculateContent'),
        position: 'top'
      },
      {
        selector: '.results-summary',
        title: t('tutorial.resultsTitle'),
        content: t('tutorial.resultsContent'),
        position: 'bottom'
      },
      {
        selector: '#amortization-table-container',
        title: t('tutorial.amortizationTitle'),
        content: t('tutorial.amortizationContent'),
        position: 'top'
      },
      {
        selector: '#charts-container',
        title: t('tutorial.chartsTitle'),
        content: t('tutorial.chartsContent'),
        position: 'top'
      }
    ];
    
    // Start tutorial
    createTutorial(tutorialSteps, () => {
      // Show completion message
      this.showGuidancePanel(
        t('tutorial.completedTitle'),
        t('tutorial.completedContent'),
        'tutorial-completed'
      );
    });
  }
  
  /**
   * Show guidance panel
   */
  showGuidance() {
    const t = (key) => getTranslation(key, this.language);
    
    // Create guidance content
    const guidanceContent = `
      <div class="guidance-sections">
        <div class="guidance-section">
          <h4>${t('guidance.interpretingResultsTitle')}</h4>
          <p>${t('guidance.interpretingResultsContent')}</p>
        </div>
        
        <div class="guidance-section">
          <h4>${t('guidance.affordabilityTitle')}</h4>
          <p>${t('guidance.affordabilityContent')}</p>
          <ul>
            <li>${t('guidance.affordabilityTip1')}</li>
            <li>${t('guidance.affordabilityTip2')}</li>
            <li>${t('guidance.affordabilityTip3')}</li>
          </ul>
        </div>
        
        <div class="guidance-section">
          <h4>${t('guidance.additionalPaymentsTitle')}</h4>
          <p>${t('guidance.additionalPaymentsContent')}</p>
        </div>
        
        <div class="guidance-section">
          <h4>${t('guidance.refinanceTitle')}</h4>
          <p>${t('guidance.refinanceContent')}</p>
          <ul>
            <li>${t('guidance.refinanceTip1')}</li>
            <li>${t('guidance.refinanceTip2')}</li>
            <li>${t('guidance.refinanceTip3')}</li>
          </ul>
        </div>
      </div>
    `;
    
    // Show guidance panel
    this.showGuidancePanel(
      t('guidance.title'),
      guidanceContent,
      'loan-guidance'
    );
  }
  
  /**
   * Show guidance panel with custom content
   * @param {string} title - Panel title
   * @param {string} content - Panel content
   * @param {string} id - Panel ID
   */
  showGuidancePanel(title, content, id) {
    // Find or create guidance panel container
    let panelContainer = document.getElementById('guidance-panels-container');
    
    if (!panelContainer) {
      panelContainer = document.createElement('div');
      panelContainer.id = 'guidance-panels-container';
      document.body.appendChild(panelContainer);
    }
    
    // Create guidance panel
    createGuidancePanel(panelContainer, title, content, id);
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
      this.initializeTooltips();
    }
  }
}

export default GuidanceManager;