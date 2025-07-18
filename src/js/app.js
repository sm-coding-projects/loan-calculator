// Import styles
import '../css/main.css';

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
const loadAmortizationTable = () => import(/* webpackChunkName: "amortization-table" */ './components/amortization-table.js');
const loadCharts = () => import(/* webpackChunkName: "charts" */ './components/charts.js');
const loadCalculatorService = () => import(/* webpackChunkName: "calculator-service" */ './services/calculator.service.js');

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
      onCalculate: (loan) => {
        // Import the amortization model dynamically
        import(/* webpackChunkName: "amortization-model" */ './models/amortization.model.js')
          .then(({ AmortizationSchedule }) => {
            const amortizationSchedule = new AmortizationSchedule(loan);
            
            // Calculate inflation-adjusted values if inflation rate is provided
            let inflationAdjustedPromise = Promise.resolve(null);
            if (loan.inflationRate !== undefined && loan.inflationRate > 0) {
              inflationAdjustedPromise = loadCalculatorService()
                .then(module => {
                  const CalculatorService = module.default;
                  const calculatorService = new CalculatorService();
                  return calculatorService.calculateInflationAdjusted(amortizationSchedule, loan.inflationRate);
                });
            }
            
            // Wait for inflation calculation to complete
            inflationAdjustedPromise.then(inflationAdjusted => {
              // Update results display immediately (core component)
              if (resultsDisplay) {
                resultsDisplay.render({
                  loan,
                  amortizationSchedule,
                  inflationAdjusted
                });
              }
              
              // Update amortization table if it's loaded
              if (amortizationTable) {
                amortizationTable.render(amortizationSchedule);
              } else if (document.getElementById('amortization-table-container')) {
                // If amortization table isn't loaded yet, load it
                loadAmortizationTable().then(module => {
                  const AmortizationTable = module.default;
                  amortizationTable = new AmortizationTable({
                    container: document.getElementById('amortization-table-container')
                  });
                  amortizationTable.render(amortizationSchedule);
                });
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
                loadCharts().then(module => {
                  const Charts = module.default;
                  charts = new Charts({
                    container: document.getElementById('charts-container')
                  });
                  
                  // Render standard charts
                  charts.renderPrincipalVsInterestChart({ loan, amortizationSchedule });
                  charts.renderPaymentBreakdownPieChart({ loan, amortizationSchedule });
                  
                  // Render inflation impact chart if inflation rate is provided
                  if (inflationAdjusted) {
                    charts.renderInflationImpactChart({ loan, amortizationSchedule, inflationAdjusted });
                  }
                });
              }
            }).catch(error => {
              console.error('Error calculating loan:', error);
            });
          })
          .catch(error => {
            console.error('Error loading amortization model:', error);
          });
      }
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
      }
    });
  }
  
  // Initialize amortization table (lazy loaded)
  const amortizationTableContainer = document.getElementById('amortization-table-container');
  if (amortizationTableContainer) {
    // Show loading indicator
    amortizationTableContainer.innerHTML = '<div class="loading-indicator">Loading amortization table...</div>';
    
    // Lazy load the amortization table component
    loadAmortizationTable().then(module => {
      const AmortizationTable = module.default;
      amortizationTable = new AmortizationTable({
        container: amortizationTableContainer
      });
      
      // If we already have calculation results, render them
      if (calculatorForm && calculatorForm.getFormData()) {
        const loan = calculatorForm.getFormData();
        // Use dynamic import instead of require to avoid bundling issues
        import('./models/amortization.model.js').then(({ AmortizationSchedule }) => {
          const amortizationSchedule = new AmortizationSchedule(loan);
          amortizationTable.render(amortizationSchedule);
        }).catch(error => {
          console.error('Failed to load amortization model:', error);
        });
      }
    }).catch(error => {
      console.error('Failed to load amortization table:', error);
      amortizationTableContainer.innerHTML = '<div class="error-message">Failed to load amortization table. Please refresh the page.</div>';
    });
  }
  
  // Initialize charts (lazy loaded)
  const chartsContainer = document.getElementById('charts-container');
  if (chartsContainer) {
    // Show loading indicator
    chartsContainer.innerHTML = '<div class="loading-indicator">Loading charts...</div>';
    
    // Lazy load the charts component
    loadCharts().then(module => {
      const Charts = module.default;
      charts = new Charts({
        container: chartsContainer
      });
      
      // If we already have calculation results, render them
      if (calculatorForm && calculatorForm.getFormData()) {
        const loan = calculatorForm.getFormData();
        // Use dynamic import instead of require
        import('./models/amortization.model.js').then(({ AmortizationSchedule }) => {
          const amortizationSchedule = new AmortizationSchedule(loan);
          
          // Render standard charts
          charts.renderPrincipalVsInterestChart({ loan, amortizationSchedule });
          charts.renderPaymentBreakdownPieChart({ loan, amortizationSchedule });
        
          // Render inflation impact chart if inflation rate is provided
          if (loan.inflationRate !== undefined && loan.inflationRate > 0) {
            loadCalculatorService().then(serviceModule => {
              const CalculatorService = serviceModule.default;
              const calculatorService = new CalculatorService();
              const inflationAdjusted = calculatorService.calculateInflationAdjusted(amortizationSchedule, loan.inflationRate);
              charts.renderInflationImpactChart({ loan, amortizationSchedule, inflationAdjusted });
            });
          }
        }).catch(error => {
          console.error('Failed to load amortization model:', error);
        });
      }
    }).catch(error => {
      console.error('Failed to load charts:', error);
      chartsContainer.innerHTML = '<div class="error-message">Failed to load charts. Please refresh the page.</div>';
    });
  }
  
  // Initialize saved calculations manager
  const savedCalculationsContainer = document.getElementById('saved-calculations-container');
  if (savedCalculationsContainer) {
    savedCalculationsManager = new SavedCalculationsManager({
      containerId: 'saved-calculations-container',
      calculationManager: calculationManager,
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
      }
    });
  }
  
  // Initialize financial glossary
  const glossaryContainer = document.getElementById('glossary-container');
  if (glossaryContainer) {
    financialGlossary = new FinancialGlossary({
      container: glossaryContainer,
      language: currentLanguage
    });
  }
  
  // Initialize guidance manager
  const guidanceContainer = document.getElementById('guidance-container');
  if (guidanceContainer) {
    guidanceManager = new GuidanceManager({
      container: guidanceContainer,
      language: currentLanguage,
      calculatorForm: calculatorForm,
      resultsDisplay: resultsDisplay
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
      }
    });
  }
  
  // Application initialized
});