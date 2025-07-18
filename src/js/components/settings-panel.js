/**
 * Settings Panel Component
 * Manages application settings and preferences
 * Implements requirements 2.5, 6.3, 6.4
 */

class SettingsPanel {
  /**
   * Create a new settings panel
   * @param {Object} options - Configuration options
   * @param {HTMLElement|string} [options.container] - Container element or ID
   * @param {Function} [options.onThemeChange] - Callback when theme changes
   * @param {Function} [options.onLanguageChange] - Callback when language changes
   * @param {Function} [options.onCurrencyChange] - Callback when currency format changes
   */
  constructor(options = {}) {
    this.container = typeof options.container === 'string' 
      ? document.getElementById(options.container) 
      : options.container || document.getElementById('settings-container');
    
    this.onThemeChange = options.onThemeChange || (() => {});
    this.onLanguageChange = options.onLanguageChange || (() => {});
    this.onCurrencyChange = options.onCurrencyChange || (() => {});
    
    // Default settings
    this.settings = {
      theme: 'light',
      language: 'en',
      currency: 'USD'
    };
    
    // Available options
    this.availableLanguages = [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' }
    ];
    
    this.availableCurrencies = [
      { code: 'USD', symbol: '$', name: 'US Dollar' },
      { code: 'EUR', symbol: '€', name: 'Euro' },
      { code: 'GBP', symbol: '£', name: 'British Pound' },
      { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
      { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
      { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
      { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' }
    ];
    
    // Storage key for settings
    this.storageKey = 'loan-calculator-settings';
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the settings panel
   */
  init() {
    // Load saved settings
    this.loadSettings();
    
    // Apply current settings
    this.applyTheme(this.settings.theme);
    
    // Render the panel
    this.render();
    
    console.log('Settings Panel component initialized');
  }
  
  /**
   * Render the settings panel
   */
  render() {
    if (!this.container) {
      console.error('Settings panel container not found');
      return;
    }
    
    // Create the settings panel structure
    const panel = document.createElement('div');
    panel.className = 'settings-panel';
    
    // Create settings toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'settings-toggle';
    toggleButton.setAttribute('aria-label', 'Open settings');
    toggleButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    `;
    
    // Create dropdown container
    const dropdown = document.createElement('div');
    dropdown.className = 'settings-dropdown';
    dropdown.setAttribute('aria-hidden', 'true');
    
    // Add theme toggle section
    const themeSection = document.createElement('div');
    themeSection.className = 'settings-section';
    themeSection.appendChild(this.createThemeToggle());
    dropdown.appendChild(themeSection);
    
    // Add language selector section
    const languageSection = document.createElement('div');
    languageSection.className = 'settings-section';
    languageSection.appendChild(this.createLanguageSelector());
    dropdown.appendChild(languageSection);
    
    // Add currency selector section
    const currencySection = document.createElement('div');
    currencySection.className = 'settings-section';
    currencySection.appendChild(this.createCurrencySelector());
    dropdown.appendChild(currencySection);
    
    // Add toggle button and dropdown to panel
    panel.appendChild(toggleButton);
    panel.appendChild(dropdown);
    
    // Add panel to container
    this.container.innerHTML = '';
    this.container.appendChild(panel);
    
    // Add event listener for toggle button
    toggleButton.addEventListener('click', () => {
      const isActive = dropdown.classList.contains('active');
      dropdown.classList.toggle('active');
      dropdown.setAttribute('aria-hidden', isActive ? 'true' : 'false');
      toggleButton.setAttribute('aria-label', isActive ? 'Open settings' : 'Close settings');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      if (!panel.contains(event.target) && dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
        dropdown.setAttribute('aria-hidden', 'true');
        toggleButton.setAttribute('aria-label', 'Open settings');
      }
    });
  }
  
  /**
   * Create theme toggle element
   * @returns {HTMLElement} Theme toggle section
   */
  createThemeToggle() {
    const section = document.createElement('div');
    
    const heading = document.createElement('h3');
    heading.textContent = 'Theme';
    section.appendChild(heading);
    
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'theme-toggle';
    
    const lightLabel = document.createElement('span');
    lightLabel.textContent = 'Light';
    
    const toggleSwitch = document.createElement('label');
    toggleSwitch.className = 'toggle-switch';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = this.settings.theme === 'dark';
    checkbox.setAttribute('aria-label', 'Toggle dark theme');
    
    const slider = document.createElement('span');
    slider.className = 'toggle-slider';
    
    const darkLabel = document.createElement('span');
    darkLabel.textContent = 'Dark';
    
    toggleSwitch.appendChild(checkbox);
    toggleSwitch.appendChild(slider);
    
    toggleContainer.appendChild(lightLabel);
    toggleContainer.appendChild(toggleSwitch);
    toggleContainer.appendChild(darkLabel);
    
    section.appendChild(toggleContainer);
    
    // Add event listener
    checkbox.addEventListener('change', () => {
      const newTheme = checkbox.checked ? 'dark' : 'light';
      this.settings.theme = newTheme;
      this.saveSettings();
      this.applyTheme(newTheme);
      this.onThemeChange(newTheme);
    });
    
    return section;
  }
  
  /**
   * Create language selector element
   * @returns {HTMLElement} Language selector section
   */
  createLanguageSelector() {
    const section = document.createElement('div');
    
    const heading = document.createElement('h3');
    heading.textContent = 'Language';
    section.appendChild(heading);
    
    const select = document.createElement('select');
    select.className = 'settings-select';
    select.setAttribute('aria-label', 'Select language');
    
    // Add language options
    this.availableLanguages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = lang.name;
      option.selected = this.settings.language === lang.code;
      select.appendChild(option);
    });
    
    section.appendChild(select);
    
    // Add event listener
    select.addEventListener('change', () => {
      const newLanguage = select.value;
      this.settings.language = newLanguage;
      this.saveSettings();
      this.onLanguageChange(newLanguage);
    });
    
    return section;
  }
  
  /**
   * Create currency selector element
   * @returns {HTMLElement} Currency selector section
   */
  createCurrencySelector() {
    const section = document.createElement('div');
    
    const heading = document.createElement('h3');
    heading.textContent = 'Currency';
    section.appendChild(heading);
    
    const select = document.createElement('select');
    select.className = 'settings-select';
    select.setAttribute('aria-label', 'Select currency');
    
    // Add currency options
    this.availableCurrencies.forEach(currency => {
      const option = document.createElement('option');
      option.value = currency.code;
      option.textContent = `${currency.symbol} - ${currency.name}`;
      option.selected = this.settings.currency === currency.code;
      select.appendChild(option);
    });
    
    section.appendChild(select);
    
    // Add event listener
    select.addEventListener('change', () => {
      const newCurrency = select.value;
      this.settings.currency = newCurrency;
      this.saveSettings();
      this.onCurrencyChange(newCurrency);
    });
    
    return section;
  }
  
  /**
   * Apply theme to the document
   * @param {string} theme - Theme name ('light' or 'dark')
   */
  applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
    
    // Dispatch a custom event for other components to react to theme change
    const themeChangeEvent = new CustomEvent('themechange', { 
      detail: { theme } 
    });
    document.dispatchEvent(themeChangeEvent);
  }
  
  /**
   * Load settings from local storage
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem(this.storageKey);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        this.settings = {
          ...this.settings,
          ...parsedSettings
        };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  /**
   * Save settings to local storage
   */
  saveSettings() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
  
  /**
   * Get current settings
   * @returns {Object} Current settings object
   */
  getSettings() {
    return { ...this.settings };
  }
  
  /**
   * Update settings
   * @param {Object} newSettings - New settings to apply
   */
  updateSettings(newSettings) {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
    
    // Apply theme if it changed
    if (newSettings.theme) {
      this.applyTheme(newSettings.theme);
    }
    
    this.saveSettings();
  }
}

export default SettingsPanel;