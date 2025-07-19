/**
 * Tests for Export Service
 * Tests the functionality of the export service
 * Implements requirements 4.5, 4.7 - Unit tests for data services and error handling
 */

import ExportService from '../src/js/services/export.service';
import Loan from '../src/js/models/loan.model';
import { AmortizationSchedule } from '../src/js/models/amortization.model';

// Required modules for tests
const fs = require('fs');
const path = require('path');
const jsPDF = require('jspdf');
const Papa = require('papaparse');

// Mock jsPDF and Papa
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    internal: {
      pageSize: { width: 210, height: 297 },
      getNumberOfPages: jest.fn().mockReturnValue(1),
    },
    autoTable: jest.fn().mockImplementation(() => ({
      finalY: 100,
    })),
    previousAutoTable: { finalY: 100 },
    setPage: jest.fn(),
    save: jest.fn(),
    output: jest.fn().mockReturnValue('pdf-content'),
  })),
}));

jest.mock('jspdf-autotable', () => ({}));

jest.mock('papaparse', () => ({
  unparse: jest.fn().mockReturnValue('csv-content'),
  parse: jest.fn().mockImplementation((csvData) => ({
    data: [{
      'Loan Name': 'Test Loan',
      'Loan Type': 'Home Mortgage',
      'Principal Amount': '200000',
      'Down Payment': '40000',
      'Interest Rate': '4.5',
      'Term (Months)': '360',
      'Payment Frequency': 'Monthly',
    }],
  })),
}));

// Mock document methods for CSV download
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();
document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();
document.createElement = jest.fn().mockImplementation(() => ({
  href: '',
  style: {},
  download: '',
  click: jest.fn(),
}));

// Mock navigator.msSaveBlob for IE testing
Object.defineProperty(global.navigator, 'msSaveBlob', {
  value: jest.fn(),
  configurable: true,
});

// Mock btoa and atob for shareable links
global.btoa = jest.fn().mockReturnValue('base64-encoded-data');
global.atob = jest.fn().mockReturnValue('{"name":"Test Loan","type":"mortgage","principal":200000,"interestRate":4.5,"term":360,"paymentFrequency":"monthly","downPayment":40000,"additionalPayment":0,"startDate":"2023-01-01T00:00:00.000Z"}');

describe('ExportService', () => {
  let exportService;
  let testLoan;
  let testAmortizationSchedule;
  let testCalculationData;

  beforeEach(() => {
    // Create a test loan
    testLoan = new Loan({
      name: 'Test Loan',
      type: 'mortgage',
      principal: 200000,
      interestRate: 4.5,
      term: 360,
      paymentFrequency: 'monthly',
      downPayment: 40000,
      additionalPayment: 0,
      startDate: new Date('2023-01-01'),
    });

    // Create a test amortization schedule
    testAmortizationSchedule = new AmortizationSchedule(testLoan);

    // Create test calculation data
    testCalculationData = {
      loan: testLoan,
      amortizationSchedule: testAmortizationSchedule,
    };

    // Create export service
    exportService = new ExportService({
      appName: 'Test Loan Calculator',
      appUrl: 'https://example.com/loan-calculator',
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default values', () => {
      const defaultService = new ExportService();
      expect(defaultService.appName).toBe('Loan Calculator');
      expect(defaultService.appUrl).toBe(window.location.origin);
    });

    it('should initialize with custom values', () => {
      expect(exportService.appName).toBe('Test Loan Calculator');
      expect(exportService.appUrl).toBe('https://example.com/loan-calculator');
    });
  });

  describe('exportToPDF', () => {
    it('should export loan data to PDF', () => {
      const result = exportService.exportToPDF(testCalculationData);
      expect(result).toBe(true);
    });

    it('should handle invalid input', () => {
      const result = exportService.exportToPDF(null);
      expect(result).toBe(false);
    });

    it('should handle missing loan data', () => {
      const result = exportService.exportToPDF({});
      expect(result).toBe(false);
    });

    it('should include additional payment info if present', () => {
      // Create a loan with additional payment
      const loanWithAdditionalPayment = testLoan.update({ additionalPayment: 200 });

      // Mock the calculateAdditionalPaymentImpact method
      loanWithAdditionalPayment.calculateAdditionalPaymentImpact = jest.fn().mockReturnValue({
        interestSaved: 20000,
        timeSavedYears: 5,
        timeSavedMonths: 3,
      });

      const result = exportService.exportToPDF({
        loan: loanWithAdditionalPayment,
        amortizationSchedule: testAmortizationSchedule,
      });

      expect(result).toBe(true);
      expect(loanWithAdditionalPayment.calculateAdditionalPaymentImpact).toHaveBeenCalled();
    });

    it('should handle errors during PDF generation', () => {
      // Mock jsPDF to throw an error
      jsPDF.jsPDF.mockImplementationOnce(() => {
        throw new Error('PDF generation error');
      });

      const result = exportService.exportToPDF(testCalculationData);
      expect(result).toBe(false);
    });
  });

  describe('exportToCSV', () => {
    it('should export loan data to CSV', () => {
      const result = exportService.exportToCSV(testCalculationData);
      // Our implementation adds the amortization schedule section
      expect(result).toContain('csv-content');
    });

    it('should handle invalid input', () => {
      const result = exportService.exportToCSV(null);
      expect(result).toBe('');
    });

    it('should handle missing loan data', () => {
      const result = exportService.exportToCSV({});
      expect(result).toBe('');
    });

    it('should handle errors during CSV generation', () => {
      // Mock Papa.unparse to throw an error
      Papa.unparse.mockImplementationOnce(() => {
        throw new Error('CSV generation error');
      });

      const result = exportService.exportToCSV(testCalculationData);
      expect(result).toBe('');
    });

    it('should use IE-specific download method if available', () => {
      // Set up navigator.msSaveBlob to be available
      const msSaveBlobMock = jest.fn();
      Object.defineProperty(navigator, 'msSaveBlob', {
        value: msSaveBlobMock,
        configurable: true,
      });

      exportService.exportToCSV(testCalculationData);

      expect(msSaveBlobMock).toHaveBeenCalled();

      // Reset navigator.msSaveBlob
      delete navigator.msSaveBlob;
    });
  });

  describe('generateShareableLink', () => {
    it('should generate a shareable link', () => {
      const result = exportService.generateShareableLink(testCalculationData);
      expect(result).toContain('https://example.com/loan-calculator');
      expect(result).toContain('loan=');
    });

    it('should handle invalid input', () => {
      const result = exportService.generateShareableLink(null);
      expect(result).toBe('');
    });

    it('should handle missing loan data', () => {
      const result = exportService.generateShareableLink({});
      expect(result).toBe('');
    });

    it('should handle errors during link generation', () => {
      // Mock btoa to throw an error
      global.btoa = jest.fn().mockImplementationOnce(() => {
        throw new Error('Encoding error');
      });

      const result = exportService.generateShareableLink(testCalculationData);
      expect(result).toBe('');

      // Reset btoa
      global.btoa = jest.fn().mockReturnValue('base64-encoded-data');
    });
  });

  describe('importFromJSON', () => {
    it('should import loan data from JSON', () => {
      const jsonData = JSON.stringify({
        loan: testLoan.toJSON(),
        amortizationSchedule: testAmortizationSchedule.toJSON(),
      });

      const result = exportService.importFromJSON(jsonData);
      expect(result).toHaveProperty('loan');
      expect(result).toHaveProperty('amortizationSchedule');
      expect(result.loan.principal).toBe(200000);
    });

    it('should handle invalid input', () => {
      const result = exportService.importFromJSON(null);
      expect(result).toBe(null);
    });

    it('should handle invalid JSON format', () => {
      const result = exportService.importFromJSON('{"invalid": "json"');
      expect(result).toBe(null);
    });

    it('should handle missing loan data in JSON', () => {
      const result = exportService.importFromJSON('{"notLoan": {}}');
      expect(result).toBe(null);
    });

    it('should generate amortization schedule if not provided', () => {
      const jsonData = JSON.stringify({
        loan: testLoan.toJSON(),
        // No amortizationSchedule
      });

      const result = exportService.importFromJSON(jsonData);
      expect(result).toHaveProperty('loan');
      expect(result).toHaveProperty('amortizationSchedule');
      expect(result.amortizationSchedule).toBeInstanceOf(AmortizationSchedule);
    });

    it('should accept pre-parsed JSON object', () => {
      const jsonObject = {
        loan: testLoan.toJSON(),
        amortizationSchedule: testAmortizationSchedule.toJSON(),
      };

      const result = exportService.importFromJSON(jsonObject);
      expect(result).toHaveProperty('loan');
      expect(result.loan.principal).toBe(200000);
    });
  });

  describe('importFromCSV', () => {
    it('should import loan data from CSV', () => {
      const csvData = 'Loan Name,Loan Type,Principal Amount\nTest Loan,Home Mortgage,200000';

      const result = exportService.importFromCSV(csvData);
      expect(result).toHaveProperty('loan');
      expect(result).toHaveProperty('amortizationSchedule');
    });

    it('should handle invalid input', () => {
      const result = exportService.importFromCSV(null);
      expect(result).toBe(null);
    });

    it('should handle empty CSV data', () => {
      // Mock Papa.parse to return empty data
      Papa.parse.mockImplementationOnce(() => ({
        data: [],
      }));

      const result = exportService.importFromCSV('empty,csv');
      expect(result).toBe(null);
    });

    it('should handle parsing errors', () => {
      // Mock Papa.parse to throw an error
      Papa.parse.mockImplementationOnce(() => {
        throw new Error('CSV parsing error');
      });

      const result = exportService.importFromCSV('invalid,csv');
      expect(result).toBe(null);
    });

    it('should handle missing required fields', () => {
      // Mock Papa.parse to return data without required fields
      Papa.parse.mockImplementationOnce(() => ({
        data: [{
          'Some Field': 'Some Value',
          // Missing required fields
        }],
      }));

      const result = exportService.importFromCSV('header\nvalue');
      expect(result).toHaveProperty('loan');
      // Should use defaults for missing fields
      expect(result.loan.name).toBe('Imported Loan');
    });
  });

  describe('parseShareableLink', () => {
    it('should parse a shareable link', () => {
      // Mock the importFromJSON method to return a valid result
      exportService.importFromJSON = jest.fn().mockReturnValue({
        loan: testLoan,
        amortizationSchedule: testAmortizationSchedule,
      });

      const url = 'https://example.com/loan-calculator?loan=base64-encoded-data';

      const result = exportService.parseShareableLink(url);
      expect(result).toHaveProperty('loan');
      expect(result).toHaveProperty('amortizationSchedule');
    });

    it('should handle invalid input', () => {
      const result = exportService.parseShareableLink(null);
      expect(result).toBe(null);
    });

    it('should handle URL without loan parameter', () => {
      const result = exportService.parseShareableLink('https://example.com/loan-calculator');
      expect(result).toBe(null);
    });

    it('should handle invalid URL format', () => {
      const result = exportService.parseShareableLink('not-a-url');
      expect(result).toBe(null);
    });

    it('should handle decoding errors', () => {
      // Mock atob to throw an error
      global.atob = jest.fn().mockImplementationOnce(() => {
        throw new Error('Decoding error');
      });

      const result = exportService.parseShareableLink('https://example.com/loan-calculator?loan=invalid-base64');
      expect(result).toBe(null);

      // Reset atob
      global.atob = jest.fn().mockReturnValue('{"name":"Test Loan","type":"mortgage","principal":200000,"interestRate":4.5,"term":360,"paymentFrequency":"monthly","downPayment":40000,"additionalPayment":0,"startDate":"2023-01-01T00:00:00.000Z"}');
    });
  });

  describe('Helper methods', () => {
    it('should format loan term correctly', () => {
      expect(exportService._formatTerm(6)).toBe('6 months');
      expect(exportService._formatTerm(12)).toBe('1 year');
      expect(exportService._formatTerm(18)).toBe('1 year and 6 months');
      expect(exportService._formatTerm(24)).toBe('2 years');
    });

    it('should format time saved correctly', () => {
      expect(exportService._formatTimeSaved(0, 0)).toBe('None');
      expect(exportService._formatTimeSaved(0, 6)).toBe('6 months');
      expect(exportService._formatTimeSaved(1, 0)).toBe('1 year');
      expect(exportService._formatTimeSaved(2, 3)).toBe('2 years and 3 months');
    });

    it('should sanitize filenames correctly', () => {
      expect(exportService._sanitizeFilename('My Loan (2023)')).toBe('my_loan__2023_');
    });

    it('should get loan type description correctly', () => {
      expect(exportService._getLoanTypeDescription('mortgage')).toBe('Home Mortgage');
      expect(exportService._getLoanTypeDescription('auto')).toBe('Auto Loan');
      expect(exportService._getLoanTypeDescription('personal')).toBe('Personal Loan');
      expect(exportService._getLoanTypeDescription('student')).toBe('Student Loan');
      expect(exportService._getLoanTypeDescription('unknown')).toBe('unknown');
    });

    it('should get loan type from description correctly', () => {
      expect(exportService._getLoanTypeFromDescription('Home Mortgage')).toBe('mortgage');
      expect(exportService._getLoanTypeFromDescription('Auto Loan')).toBe('auto');
      expect(exportService._getLoanTypeFromDescription('Personal Loan')).toBe('personal');
      expect(exportService._getLoanTypeFromDescription('Student Loan')).toBe('student');
      expect(exportService._getLoanTypeFromDescription('Unknown')).toBe('mortgage');
    });

    it('should get payment frequency description correctly', () => {
      expect(exportService._getPaymentFrequencyDescription('monthly')).toBe('Monthly');
      expect(exportService._getPaymentFrequencyDescription('bi-weekly')).toBe('Bi-Weekly');
      expect(exportService._getPaymentFrequencyDescription('weekly')).toBe('Weekly');
      expect(exportService._getPaymentFrequencyDescription('unknown')).toBe('unknown');
    });

    it('should get payment frequency from description correctly', () => {
      expect(exportService._getPaymentFrequencyFromDescription('Monthly')).toBe('monthly');
      expect(exportService._getPaymentFrequencyFromDescription('Bi-Weekly')).toBe('bi-weekly');
      expect(exportService._getPaymentFrequencyFromDescription('Weekly')).toBe('weekly');
      expect(exportService._getPaymentFrequencyFromDescription('Unknown')).toBe('monthly');
    });
  });
});
