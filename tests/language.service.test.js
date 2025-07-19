/**
 * Tests for the Language Service
 */

import LanguageService from '../src/js/services/language.service.js';
import { getTranslation } from '../src/js/utils/translations.js';

describe('LanguageService', () => {
  let languageService;

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn(),
    };

    global.localStorage = localStorageMock;

    // Create a new instance for each test
    languageService = new LanguageService();
  });

  test('should initialize with default language', () => {
    expect(languageService.getLanguage()).toBe('en');
  });

  test('should load language from localStorage if available', () => {
    localStorage.getItem.mockReturnValue('es');
    languageService = new LanguageService();
    expect(languageService.getLanguage()).toBe('es');
  });

  test('should save language to localStorage when changed', () => {
    languageService.setLanguage('es');
    expect(localStorage.setItem).toHaveBeenCalledWith('loan-calculator-language', 'es');
  });

  test('should notify listeners when language changes', () => {
    const listener = jest.fn();
    languageService.addListener(listener);
    languageService.setLanguage('es');
    expect(listener).toHaveBeenCalledWith('es');
  });

  test('should remove listeners', () => {
    const listener = jest.fn();
    languageService.addListener(listener);
    languageService.removeListener(listener);
    languageService.setLanguage('es');
    expect(listener).not.toHaveBeenCalled();
  });

  test('should get correct locale for language', () => {
    languageService.setLanguage('en');
    expect(languageService.getLocale()).toBe('en-US');

    languageService.setLanguage('es');
    expect(languageService.getLocale()).toBe('es-ES');
  });

  test('should translate keys correctly', () => {
    languageService.setLanguage('en');
    expect(languageService.translate('form.title')).toBe('Loan Calculator');

    languageService.setLanguage('es');
    expect(languageService.translate('form.title')).toBe('Calculadora de Préstamos');
  });
});

describe('Translations', () => {
  test('should return English translations by default', () => {
    expect(getTranslation('form.title')).toBe('Loan Calculator');
    expect(getTranslation('form.loanAmount')).toBe('Loan Amount');
  });

  test('should return Spanish translations when specified', () => {
    expect(getTranslation('form.title', 'es')).toBe('Calculadora de Préstamos');
    expect(getTranslation('form.loanAmount', 'es')).toBe('Monto del Préstamo');
  });

  test('should return the key if translation not found', () => {
    expect(getTranslation('nonexistent.key')).toBe('nonexistent.key');
  });

  test('should handle nested keys', () => {
    expect(getTranslation('common.yes')).toBe('Yes');
    expect(getTranslation('common.yes', 'es')).toBe('Sí');
  });
});
