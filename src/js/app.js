// Import styles
import '../css/main.css';
import '../css/themes/light.css';
import '../css/themes/dark.css';
import '../css/components/forms.css';
import '../css/components/tables.css';
import '../css/components/charts.css';
import '../css/components/results.css';
import '../css/components/saved-calculations.css';
import '../css/components/settings.css';
import '../css/components/theme-transitions.css';
import '../css/components/accessibility.css';
import '../css/components/glossary.css';
import '../css/components/market-rates.css';
import '../css/components/tooltips.css';
import '../css/components/inflation.css';
import '../css/responsive.css';

// Import core components
import CalculatorForm from './components/calculator-form';
import ResultsDisplay from './components/results-display';
import SavedCalculationsManager from './components/saved-calculations-manager';
import SettingsPanel from './components/settings-panel';
import FinancialGlossary from './components/financial-glossary';
import GuidanceManager from './components/guidance-manager';

// Import services
import CalculationManagerService from './services/calculation-manager.service';
import StorageService from './services/storage.service';
import LanguageService from './services/language.service';

// Lazy-loaded components
const loadAmortizationTable = () => import(/* webpackChunkName: "amortization-table" */ './components/amortization-table');
const loadCharts = () => import(/* webpackChunkName: "charts" */ './components/charts');
const loadCalculatorService = () => import(/* webpackChunkName: "calculator-service" */ './services/calculator.service');

// Set current year in footer and apply saved theme
document.addEventListener('DOMContentLoaded', () => {
  // Set current year
  const currentYearElement = document.getElementById('current-year');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }

  // Apply saved theme if available
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }

  // Initialize services
  const storageService = new StorageService();
  const languageService = new LanguageService();
  const calculationManager = new CalculationManagerService({ storageService });

  // Apply saved language
  const currentLanguage = languageService.getLanguage();

  // Initialize components
  let calculatorForm;
  let resultsDisplay;
  let amortizationTable;
  let charts;
  let savedCalculationsManager;
  let settingsPanel;
  let financialGlossary;
  let guidanceManager;

  // Initialize calculator form
  const calculatorFormContainer = document.getElementById('calculator-form-container');
  if (calculatorFormContainer) {
    calculatorForm = new CalculatorForm({
      container: calculatorFormContainer,
      onCalculate: async (loan) => {
        try {
          // Show loading state immediately
          showCalculationLoading('Starting calculation...');

          // Show skeleton loading in amortization table if it exists
          if (amortizationTable) {
            amortizationTable.showLoadingSkeleton();
          }

          // Import the amortization model dynamically
          const { AmortizationSchedule } = await import(/* webpackChunkName: "amortization-model" */ './models/amortization.model');
          
          // Create amortization schedule without auto-generation
          const amortizationSchedule = new AmortizationSchedule(loan, false);

          // Generate schedule asynchronously with progress updates
          await amortizationSchedule.generateScheduleAsync({
            includeAdditionalPayments: true,
            timeout: 10000, // 10 second timeout
            onProgress: (progress, message) => {
              updateCalculationProgress(progress, message);
            }
          });

          // Update progress for inflation calculation
          updateCalculationProgress(95, 'Calculating inflation adjustments...');

          // Calculate inflation-adjusted values if inflation rate is provided
          let inflationAdjusted = null;
          if (loan.inflationRate !== undefined && loan.inflationRate > 0) {
            const module = await loadCalculatorService();
            const CalculatorService = module.default;
            const calculatorService = new CalculatorService();
            inflationAdjusted = calculatorService.calculateInflationAdjusted(amortizationSchedule, loan.inflationRate);
          }

          // Update progress for rendering
          updateCalculationProgress(98, 'Rendering results...');

          // Update results display immediately (core component)
          if (resultsDisplay) {
            resultsDisplay.render({
              loan,
              amortizationSchedule,
              inflationAdjusted,
            });
          }

          // Update amortization table if it's loaded
          if (amortizationTable) {
            amortizationTable.render(amortizationSchedule);
          } else if (document.getElementById('amortization-table-container')) {
            // If amortization table isn't loaded yet, load it
            const module = await loadAmortizationTable();
            const AmortizationTable = module.default;
            amortizationTable = new AmortizationTable({
              container: document.getElementById('amortization-table-container'),
            });
            amortizationTable.render(amortizationSchedule);
          }

          // Update charts if they're loaded
          if (charts) {
            // Render standard charts
            charts.renderPrincipalVsInterestChart({ loan, amortizationSchedule });
            charts.renderPaymentBreakdownPieChart({ loan, amortizationSchedule });

            // Render inflation impact chart if inflation rate is provided
            if (inflationAdjusted) {
              charts.renderInflationImpactChart({ loan, amortizationSchedule, inflationAdjusted });
            }
          } else if (document.getElementById('charts-container')) {
            // If charts aren't loaded yet, load them
            const module = await loadCharts();
            const Charts = module.default;
            charts = new Charts({
              container: document.getElementById('charts-container'),
            });

            // Render standard charts
            charts.renderPrincipalVsInterestChart({ loan, amortizationSchedule });
            charts.renderPaymentBreakdownPieChart({ loan, amortizationSchedule });

            // Render inflation impact chart if inflation rate is provided
            if (inflationAdjusted) {
              charts.renderInflationImpactChart({ loan, amortizationSchedule, inflationAdjusted });
            }
          }

          // Complete calculation
          hideCalculationLoading();

        } catch (error) {
          console.error('Error calculating loan:', error);
          
          // Categorize error types for better user experience
          let errorCategory = 'general';
          let userMessage = error.message;
          let suggestions = [];

          if (error.message.includes('timeout')) {
            errorCategory = 'timeout';
            suggestions = [
              'Try reducing the loan amount',
              'Check if your interest rate is reasonable',
              'Reduce the loan term if it\'s very long'
            ];
          } else if (error.message.includes('Loan amount')) {
            errorCategory = 'validation';
            suggestions = ['Please enter a valid loan amount between $1,000 and $100,000,000'];
          } else if (error.message.includes('Interest rate')) {
            errorCategory = 'validation';
            suggestions = ['Please enter an interest rate between 0% and 50%'];
          } else if (error.message.includes('payment is too low')) {
            errorCategory = 'payment';
            suggestions = [
              'Increase the loan term to reduce monthly payments',
              'Reduce the loan amount',
              'Lower the interest rate if possible'
            ];
          } else if (error.message.includes('Maximum payment limit')) {
            errorCategory = 'calculation';
            suggestions = [
              'Check your loan parameters for reasonableness',
              'Ensure interest rate is not too low',
              'Verify loan term is appropriate'
            ];
          }

          showCalculationError({
            ...error,
            category: errorCategory,
            suggestions
          });
        }
      },
    });
  }

  // Initialize results display
  const resultsDisplayContainer = document.getElementById('results-display-container');
  if (resultsDisplayContainer) {
    resultsDisplay = new ResultsDisplay({
      containerId: 'results-display-container',
      onSave: (loan, amortizationSchedule) => {
        // Save calculation and refresh saved calculations list
        calculationManager.saveCalculation(loan, amortizationSchedule);

        if (savedCalculationsManager) {
          savedCalculationsManager.refresh();
        }
      },
    });
  }

  // Initialize amortization table (lazy loaded)
  const amortizationTableContainer = document.getElementById('amortization-table-container');
  if (amortizationTableContainer) {
    // Show modern loading indicator
    amortizationTableContainer.innerHTML = `
      <div class="component-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading amortization table...</div>
      </div>
    `;

    // Lazy load the amortization table component
    loadAmortizationTable().then((module) => {
      const AmortizationTable = module.default;
      amortizationTable = new AmortizationTable({
        container: amortizationTableContainer,
      });

      // If we already have calculation results, render them
      if (calculatorForm && calculatorForm.getFormData()) {
        const loan = calculatorForm.getFormData();
        // Use dynamic import instead of require to avoid bundling issues
        import('./models/amortization.model').then(({ AmortizationSchedule }) => {
          const amortizationSchedule = new AmortizationSchedule(loan);
          amortizationTable.render(amortizationSchedule);
        }).catch((error) => {
          console.error('Failed to load amortization model:', error);
        });
      }
    }).catch((error) => {
      console.error('Failed to load amortization table:', error);
      amortizationTableContainer.innerHTML = `
        <div class="component-error">
          <div class="error-icon">⚠️</div>
          <div class="error-text">Failed to load amortization table</div>
          <button class="retry-button" onclick="location.reload()">Retry</button>
        </div>
      `;
    });
  }

  // Initialize charts (lazy loaded)
  const chartsContainer = document.getElementById('charts-container');
  if (chartsContainer) {
    // Show modern loading indicator
    chartsContainer.innerHTML = `
      <div class="component-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading charts...</div>
      </div>
    `;

    // Lazy load the charts component
    loadCharts().then((module) => {
      const Charts = module.default;
      charts = new Charts({
        container: chartsContainer,
      });

      // If we already have calculation results, render them
      if (calculatorForm && calculatorForm.getFormData()) {
        const loan = calculatorForm.getFormData();
        // Use dynamic import instead of require
        import('./models/amortization.model').then(({ AmortizationSchedule }) => {
          const amortizationSchedule = new AmortizationSchedule(loan);

          // Render standard charts
          charts.renderPrincipalVsInterestChart({ loan, amortizationSchedule });
          charts.renderPaymentBreakdownPieChart({ loan, amortizationSchedule });

          // Render inflation impact chart if inflation rate is provided
          if (loan.inflationRate !== undefined && loan.inflationRate > 0) {
            loadCalculatorService().then((serviceModule) => {
              const CalculatorService = serviceModule.default;
              const calculatorService = new CalculatorService();
              const inflationAdjusted = calculatorService.calculateInflationAdjusted(amortizationSchedule, loan.inflationRate);
              charts.renderInflationImpactChart({ loan, amortizationSchedule, inflationAdjusted });
            });
          }
        }).catch((error) => {
          console.error('Failed to load amortization model:', error);
        });
      }
    }).catch((error) => {
      console.error('Failed to load charts:', error);
      chartsContainer.innerHTML = `
        <div class="component-error">
          <div class="error-icon">⚠️</div>
          <div class="error-text">Failed to load charts</div>
          <button class="retry-button" onclick="location.reload()">Retry</button>
        </div>
      `;
    });
  }

  // Initialize saved calculations manager
  const savedCalculationsContainer = document.getElementById('saved-calculations-container');
  if (savedCalculationsContainer) {
    savedCalculationsManager = new SavedCalculationsManager({
      containerId: 'saved-calculations-container',
      calculationManager,
      onLoadCalculation: (calculation) => {
        // Load calculation into other components
        if (calculatorForm) {
          calculatorForm.loadLoan(calculation.loan);
        }

        if (resultsDisplay) {
          resultsDisplay.updateResults(calculation.loan, calculation.amortizationSchedule);
        }

        if (amortizationTable) {
          amortizationTable.updateTable(calculation.amortizationSchedule);
        }

        if (charts) {
          charts.updateCharts(calculation.loan, calculation.amortizationSchedule);
        }
      },
      onCompareCalculations: (comparison) => {
        // Handle comparison view
        if (charts) {
          charts.showComparisonCharts(comparison);
        }
      },
    });
  }

  // Initialize financial glossary
  const glossaryContainer = document.getElementById('glossary-container');
  if (glossaryContainer) {
    financialGlossary = new FinancialGlossary({
      container: glossaryContainer,
      language: currentLanguage,
    });
  }

  // Initialize guidance manager
  const guidanceContainer = document.getElementById('guidance-container');
  if (guidanceContainer) {
    guidanceManager = new GuidanceManager({
      container: guidanceContainer,
      language: currentLanguage,
      calculatorForm,
      resultsDisplay,
    });
  }

  // Initialize settings panel
  const settingsContainer = document.getElementById('settings-container');
  if (settingsContainer) {
    settingsPanel = new SettingsPanel({
      container: settingsContainer,
      onThemeChange: (theme) => {
        // Theme is automatically applied in the settings panel component
      },
      onLanguageChange: (language) => {
        // Update language in the language service
        languageService.setLanguage(language);

        // Update components with new language
        if (calculatorForm) {
          calculatorForm.updateLanguage(language);
        }

        if (resultsDisplay) {
          resultsDisplay.updateLanguage(language);
        }

        if (amortizationTable) {
          amortizationTable.updateLanguage(language);
        }

        if (charts) {
          charts.updateLanguage(language);
        }

        if (savedCalculationsManager) {
          savedCalculationsManager.updateLanguage(language);
        }

        if (financialGlossary) {
          financialGlossary.updateLanguage(language);
        }

        if (guidanceManager) {
          guidanceManager.updateLanguage(language);
        }
      },
      onCurrencyChange: (currency) => {
        // Update currency format in all components that display monetary values
        if (resultsDisplay) {
          resultsDisplay.updateCurrencyFormat(currency);
        }

        if (amortizationTable) {
          amortizationTable.updateCurrencyFormat(currency);
        }

        if (charts) {
          charts.updateCurrencyFormat(currency);
        }

        if (calculatorForm) {
          calculatorForm.updateCurrencyFormat(currency);
        }
      },
    });
  }

  // Application initialized
});

// Loading state management functions
function showCalculationLoading(message = 'Calculating...') {
  // Show loading overlay
  let loadingOverlay = document.getElementById('calculation-loading-overlay');
  if (!loadingOverlay) {
    loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'calculation-loading-overlay';
    loadingOverlay.className = 'calculation-loading-overlay';
    loadingOverlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-message" id="loading-message">${message}</div>
        <div class="loading-progress">
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
          </div>
          <div class="progress-text" id="progress-text">0%</div>
        </div>
      </div>
    `;
    document.body.appendChild(loadingOverlay);
  }
  
  loadingOverlay.style.display = 'flex';
  
  // Reset progress
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const loadingMessage = document.getElementById('loading-message');
  
  if (progressFill) progressFill.style.width = '0%';
  if (progressText) progressText.textContent = '0%';
  if (loadingMessage) loadingMessage.textContent = message;
}

function updateCalculationProgress(progress, message) {
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const loadingMessage = document.getElementById('loading-message');
  
  if (progressFill) {
    progressFill.style.width = `${Math.round(progress)}%`;
  }
  if (progressText) {
    progressText.textContent = `${Math.round(progress)}%`;
  }
  if (loadingMessage && message) {
    loadingMessage.textContent = message;
  }
}

function hideCalculationLoading() {
  const loadingOverlay = document.getElementById('calculation-loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
}

function showCalculationError(error) {
  hideCalculationLoading();
  
  // Show error overlay
  let errorOverlay = document.getElementById('calculation-error-overlay');
  if (!errorOverlay) {
    errorOverlay = document.createElement('div');
    errorOverlay.id = 'calculation-error-overlay';
    errorOverlay.className = 'calculation-error-overlay';
    document.body.appendChild(errorOverlay);
  }
  
  const errorMessage = error.message || 'An unknown error occurred during calculation.';
  const category = error.category || 'general';
  const suggestions = error.suggestions || [];
  
  // Choose appropriate icon based on error category
  const icons = {
    timeout: '⏱️',
    validation: '📝',
    payment: '💰',
    calculation: '🔢',
    general: '⚠️'
  };
  
  const icon = icons[category] || icons.general;
  
  // Build suggestions HTML
  const suggestionsHtml = suggestions.length > 0 ? `
    <div class="error-suggestions">
      <h4>Suggestions:</h4>
      <ul>
        ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
      </ul>
    </div>
  ` : '';
  
  errorOverlay.innerHTML = `
    <div class="error-content">
      <div class="error-icon">${icon}</div>
      <h3>Calculation Error</h3>
      <p class="error-message">${errorMessage}</p>
      ${suggestionsHtml}
      <div class="error-actions">
        <button class="btn-retry" onclick="retryCalculation()">Try Again</button>
        <button class="btn-close" onclick="closeCalculationError()">Close</button>
      </div>
    </div>
  `;
  
  errorOverlay.style.display = 'flex';
}

function closeCalculationError() {
  const errorOverlay = document.getElementById('calculation-error-overlay');
  if (errorOverlay) {
    errorOverlay.style.display = 'none';
  }
}

function retryCalculation() {
  closeCalculationError();
  // Trigger calculation again if calculator form exists
  if (calculatorForm && typeof calculatorForm.handleCalculate === 'function') {
    calculatorForm.handleCalculate();
  }
}
