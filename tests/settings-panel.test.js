/**
 * Settings Panel Component Tests
 */

import SettingsPanel from '../src/js/components/settings-panel';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Settings Panel Component', () => {
  let settingsPanel;
  let container;
  
  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    container.id = 'settings-container';
    document.body.appendChild(container);
    
    // Clear localStorage mock
    localStorageMock.clear();
    
    // Create callbacks
    const onThemeChange = jest.fn();
    const onLanguageChange = jest.fn();
    const onCurrencyChange = jest.fn();
    
    // Initialize settings panel
    settingsPanel = new SettingsPanel({
      container,
      onThemeChange,
      onLanguageChange,
      onCurrencyChange
    });
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });
  
  test('should initialize with default settings', () => {
    expect(settingsPanel.settings.theme).toBe('light');
    expect(settingsPanel.settings.language).toBe('en');
    expect(settingsPanel.settings.currency).toBe('USD');
  });
  
  test('should render settings panel with toggle button', () => {
    expect(container.querySelector('.settings-panel')).not.toBeNull();
    expect(container.querySelector('.settings-toggle')).not.toBeNull();
    expect(container.querySelector('.settings-dropdown')).not.toBeNull();
  });
  
  test('should toggle dropdown visibility when button is clicked', () => {
    const toggleButton = container.querySelector('.settings-toggle');
    const dropdown = container.querySelector('.settings-dropdown');
    
    // Initially hidden
    expect(dropdown.classList.contains('active')).toBe(false);
    expect(dropdown.getAttribute('aria-hidden')).toBe('true');
    
    // Click to show
    toggleButton.click();
    expect(dropdown.classList.contains('active')).toBe(true);
    expect(dropdown.getAttribute('aria-hidden')).toBe('false');
    
    // Click to hide
    toggleButton.click();
    expect(dropdown.classList.contains('active')).toBe(false);
    expect(dropdown.getAttribute('aria-hidden')).toBe('true');
  });
  
  test('should render theme toggle section', () => {
    const themeSection = container.querySelector('.settings-section:nth-child(1)');
    expect(themeSection).not.toBeNull();
    expect(themeSection.querySelector('h3').textContent).toBe('Theme');
    expect(themeSection.querySelector('.theme-toggle')).not.toBeNull();
    expect(themeSection.querySelector('input[type="checkbox"]')).not.toBeNull();
  });
  
  test('should render language selector section', () => {
    const languageSection = container.querySelector('.settings-section:nth-child(2)');
    expect(languageSection).not.toBeNull();
    expect(languageSection.querySelector('h3').textContent).toBe('Language');
    expect(languageSection.querySelector('select')).not.toBeNull();
    
    // Check options
    const options = languageSection.querySelectorAll('option');
    expect(options.length).toBe(2);
    expect(options[0].value).toBe('en');
    expect(options[1].value).toBe('es');
  });
  
  test('should render currency selector section', () => {
    const currencySection = container.querySelector('.settings-section:nth-child(3)');
    expect(currencySection).not.toBeNull();
    expect(currencySection.querySelector('h3').textContent).toBe('Currency');
    expect(currencySection.querySelector('select')).not.toBeNull();
    
    // Check options
    const options = currencySection.querySelectorAll('option');
    expect(options.length).toBe(7); // USD, EUR, GBP, JPY, CAD, AUD, MXN
  });
  
  test('should save settings to localStorage', () => {
    settingsPanel.settings.theme = 'dark';
    settingsPanel.settings.language = 'es';
    settingsPanel.settings.currency = 'EUR';
    
    settingsPanel.saveSettings();
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'loan-calculator-settings',
      JSON.stringify({
        theme: 'dark',
        language: 'es',
        currency: 'EUR'
      })
    );
  });
  
  test('should load settings from localStorage', () => {
    // Set up mock localStorage with saved settings
    const savedSettings = {
      theme: 'dark',
      language: 'es',
      currency: 'EUR'
    };
    
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedSettings));
    
    // Create new settings panel to test loading
    const newPanel = new SettingsPanel({ container });
    
    // Check if settings were loaded
    expect(newPanel.settings.theme).toBe('dark');
    expect(newPanel.settings.language).toBe('es');
    expect(newPanel.settings.currency).toBe('EUR');
  });
  
  test('should apply theme correctly', () => {
    // Initially no dark theme
    expect(document.body.classList.contains('dark-theme')).toBe(false);
    
    // Apply dark theme
    settingsPanel.applyTheme('dark');
    expect(document.body.classList.contains('dark-theme')).toBe(true);
    
    // Apply light theme
    settingsPanel.applyTheme('light');
    expect(document.body.classList.contains('dark-theme')).toBe(false);
  });
  
  test('should update settings and apply theme', () => {
    const saveSettingsSpy = jest.spyOn(settingsPanel, 'saveSettings');
    const applyThemeSpy = jest.spyOn(settingsPanel, 'applyTheme');
    
    settingsPanel.updateSettings({
      theme: 'dark',
      language: 'es'
    });
    
    expect(settingsPanel.settings.theme).toBe('dark');
    expect(settingsPanel.settings.language).toBe('es');
    expect(saveSettingsSpy).toHaveBeenCalled();
    expect(applyThemeSpy).toHaveBeenCalledWith('dark');
  });
});