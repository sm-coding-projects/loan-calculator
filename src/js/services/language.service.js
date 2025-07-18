/**
 * Language Service
 * Manages language settings and translations for the application
 * Implements requirements 6.3, 6.4
 */

import { getTranslation, getTranslations, getAvailableLanguages } from '../utils/translations.js';
import { getLocaleFromLanguage } from '../utils/formatters.js';
import { updateDocumentLanguage } from '../utils/accessibility.js';

class LanguageService {
  /**
   * Create a new language service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.currentLanguage = options.defaultLanguage || 'en';
    this.storageKey = 'loan-calculator-language';
    this.listeners = [];

    // Load saved language
    this.loadLanguage();
  }

  /**
   * Load language from local storage
   */
  loadLanguage() {
    try {
      const savedLanguage = localStorage.getItem(this.storageKey);
      if (savedLanguage) {
        this.currentLanguage = savedLanguage;
      }
    } catch (error) {
      console.error('Error loading language setting:', error);
    }
  }

  /**
   * Save language to local storage
   */
  saveLanguage() {
    try {
      localStorage.setItem(this.storageKey, this.currentLanguage);
    } catch (error) {
      console.error('Error saving language setting:', error);
    }
  }

  /**
   * Get current language
   * @returns {string} Current language code
   */
  getLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get current locale based on language
   * @returns {string} Current locale
   */
  getLocale() {
    return getLocaleFromLanguage(this.currentLanguage);
  }

  /**
   * Set language
   * @param {string} language - Language code
   */
  setLanguage(language) {
    if (this.currentLanguage !== language) {
      this.currentLanguage = language;
      this.saveLanguage();

      // Update document language for accessibility
      updateDocumentLanguage(language);

      this.notifyListeners();

      // Dispatch a custom event for components to react to language change
      const languageChangeEvent = new CustomEvent('languagechange', {
        detail: { language },
      });
      document.dispatchEvent(languageChangeEvent);
    }
  }

  /**
   * Get translation for a key
   * @param {string} key - Translation key
   * @returns {string} Translated text
   */
  translate(key) {
    return getTranslation(key, this.currentLanguage);
  }

  /**
   * Get all translations for current language
   * @returns {Object} Translations object
   */
  getAllTranslations() {
    return getTranslations(this.currentLanguage);
  }

  /**
   * Get available languages
   * @returns {Array} Array of language objects
   */
  getAvailableLanguages() {
    return getAvailableLanguages();
  }

  /**
   * Add language change listener
   * @param {Function} listener - Callback function
   */
  addListener(listener) {
    if (typeof listener === 'function' && !this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  /**
   * Remove language change listener
   * @param {Function} listener - Callback function to remove
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of language change
   */
  notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentLanguage);
      } catch (error) {
        console.error('Error in language change listener:', error);
      }
    });
  }
}

export default LanguageService;
