/**
 * Export Service
 * Handles exporting and importing loan calculations
 * Implements requirements 2.7, 3.4, 3.5, 5.4
 */

// eslint-disable-next-line new-cap
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import Loan from '../models/loan.model';
import { AmortizationSchedule } from '../models/amortization.model';
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters';

class ExportService {
  /**
   * Create a new export service
   * @param {Object} options - Configuration options
   * @param {string} [options.appName] - Application name for exports
   * @param {string} [options.appUrl] - Application URL for shareable links
   */
  constructor(options = {}) {
    this.appName = options.appName || 'Loan Calculator';
    this.appUrl = options.appUrl || window.location.origin;
    console.log('Export Service initialized');
  }

  /**
   * Export loan calculation to PDF
   * @param {Object} calculationData - Calculation data to export
   * @param {Loan} calculationData.loan - Loan object
   * @param {AmortizationSchedule} [calculationData.amortizationSchedule] - Amortization schedule
   * @returns {boolean} Success status
   */
  exportToPDF(calculationData) {
    try {
      if (!calculationData || !calculationData.loan) {
        throw new Error('Invalid calculation data');
      }

      const { loan, amortizationSchedule } = calculationData;
      // eslint-disable-next-line new-cap
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Add header
      doc.setFontSize(20);
      doc.text(this.appName, pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(16);
      doc.text(`Loan Summary: ${loan.name}`, pageWidth / 2, 25, { align: 'center' });

      // Add loan details
      doc.setFontSize(12);
      doc.text('Loan Details', 14, 35);

      const loanDetails = [
        ['Loan Type', this._getLoanTypeDescription(loan.type)],
        ['Principal Amount', formatCurrency(loan.principal)],
        ['Down Payment', formatCurrency(loan.downPayment)],
        ['Loan Amount', formatCurrency(loan.totalLoanAmount)],
        ['Interest Rate', formatPercentage(loan.interestRate / 100)],
        ['Term', this._formatTerm(loan.term)],
        ['Payment Frequency', this._getPaymentFrequencyDescription(loan.paymentFrequency)],
        ['Payment Amount', formatCurrency(loan.paymentAmount)],
        ['Start Date', formatDate(loan.startDate)],
        ['Payoff Date', formatDate(loan.payoffDate)],
      ];

      // Add additional payment info if applicable
      if (loan.additionalPayment > 0) {
        loanDetails.push(['Additional Payment', formatCurrency(loan.additionalPayment)]);

        // Calculate impact of additional payments
        const impact = loan.calculateAdditionalPaymentImpact();
        loanDetails.push(['Interest Saved', formatCurrency(impact.interestSaved)]);
        loanDetails.push(['Time Saved', this._formatTimeSaved(impact.timeSavedYears, impact.timeSavedMonths)]);
      }

      // Add loan details table
      doc.autoTable({
        startY: 40,
        head: [['Parameter', 'Value']],
        body: loanDetails,
        theme: 'striped',
        headStyles: { fillColor: [66, 133, 244] },
      });

      // Add summary section
      const summaryY = doc.previousAutoTable.finalY + 10;
      doc.text('Payment Summary', 14, summaryY);

      const summaryDetails = [
        ['Monthly Payment', formatCurrency(loan.paymentAmount)],
        ['Total Principal', formatCurrency(loan.totalLoanAmount)],
        ['Total Interest', formatCurrency(loan.totalInterest)],
        ['Total Cost', formatCurrency(loan.totalLoanAmount + loan.totalInterest)],
      ];

      doc.autoTable({
        startY: summaryY + 5,
        body: summaryDetails,
        theme: 'striped',
        headStyles: { fillColor: [66, 133, 244] },
      });

      // Add amortization schedule if available
      if (amortizationSchedule && amortizationSchedule.payments && amortizationSchedule.payments.length > 0) {
        const scheduleY = doc.previousAutoTable.finalY + 10;
        doc.text('Amortization Schedule', 14, scheduleY);

        // Prepare amortization data (limit to first 50 payments to keep PDF manageable)
        const maxPayments = Math.min(amortizationSchedule.payments.length, 50);
        const scheduleData = amortizationSchedule.payments.slice(0, maxPayments).map((payment) => [
          payment.number,
          formatDate(payment.date),
          formatCurrency(payment.amount),
          formatCurrency(payment.principal),
          formatCurrency(payment.interest),
          formatCurrency(payment.balance),
        ]);

        // Add note if we're limiting the displayed payments
        if (amortizationSchedule.payments.length > maxPayments) {
          doc.setFontSize(10);
          doc.text(`Note: Showing first ${maxPayments} of ${amortizationSchedule.payments.length} payments`, 14, scheduleY + 5);
        }

        doc.autoTable({
          startY: scheduleY + (amortizationSchedule.payments.length > maxPayments ? 10 : 5),
          head: [['#', 'Date', 'Payment', 'Principal', 'Interest', 'Balance']],
          body: scheduleData,
          theme: 'striped',
          headStyles: { fillColor: [66, 133, 244] },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 25 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 },
            4: { cellWidth: 30 },
            5: { cellWidth: 30 },
          },
        });
      }

      // Add footer with date and page numbers
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Generated on ${formatDate(new Date())}`, 14, doc.internal.pageSize.height - 10);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, doc.internal.pageSize.height - 10, { align: 'right' });
      }

      // Save the PDF
      doc.save(`${this._sanitizeFilename(loan.name)}_loan_summary.pdf`);
      return true;
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      return false;
    }
  }

  /**
   * Export loan calculation to CSV
   * @param {Object} calculationData - Calculation data to export
   * @param {Loan} calculationData.loan - Loan object
   * @param {AmortizationSchedule} [calculationData.amortizationSchedule] - Amortization schedule
   * @returns {string} CSV content or empty string if failed
   */
  exportToCSV(calculationData) {
    try {
      if (!calculationData || !calculationData.loan) {
        throw new Error('Invalid calculation data');
      }

      const { loan, amortizationSchedule } = calculationData;

      // Prepare loan details
      const loanDetails = {
        'Loan Name': loan.name,
        'Loan Type': this._getLoanTypeDescription(loan.type),
        'Principal Amount': loan.principal,
        'Down Payment': loan.downPayment,
        'Loan Amount': loan.totalLoanAmount,
        'Interest Rate': loan.interestRate,
        'Term (Months)': loan.term,
        'Payment Frequency': this._getPaymentFrequencyDescription(loan.paymentFrequency),
        'Payment Amount': loan.paymentAmount,
        'Start Date': formatDate(loan.startDate),
        'Payoff Date': formatDate(loan.payoffDate),
        'Additional Payment': loan.additionalPayment,
        'Total Interest': loan.totalInterest,
        'Total Cost': loan.totalLoanAmount + loan.totalInterest,
      };

      // Convert loan details to CSV
      const loanDetailsCSV = Papa.unparse([loanDetails]);

      // If we have an amortization schedule, add it as a separate section
      let amortizationCSV = '';
      if (amortizationSchedule && amortizationSchedule.payments && amortizationSchedule.payments.length > 0) {
        const scheduleData = amortizationSchedule.payments.map((payment) => ({
          'Payment Number': payment.number,
          Date: formatDate(payment.date),
          'Payment Amount': payment.amount,
          Principal: payment.principal,
          Interest: payment.interest,
          Balance: payment.balance,
        }));

        amortizationCSV = `\n\nAmortization Schedule\n${Papa.unparse(scheduleData)}`;
      }

      // Combine the sections
      const csvContent = loanDetailsCSV + amortizationCSV;

      // Trigger download
      this._downloadCSV(csvContent, `${this._sanitizeFilename(loan.name)}_loan_details.csv`);

      return csvContent;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      return '';
    }
  }

  /**
   * Generate a shareable link for the loan calculation
   * @param {Object} calculationData - Calculation data to share
   * @param {Loan} calculationData.loan - Loan object
   * @returns {string} Shareable link URL
   */
  generateShareableLink(calculationData) {
    try {
      if (!calculationData || !calculationData.loan) {
        throw new Error('Invalid calculation data');
      }

      const { loan } = calculationData;

      // Create a simplified object with just the essential loan parameters
      const shareableData = {
        name: loan.name,
        type: loan.type,
        principal: loan.principal,
        interestRate: loan.interestRate,
        term: loan.term,
        paymentFrequency: loan.paymentFrequency,
        downPayment: loan.downPayment,
        additionalPayment: loan.additionalPayment,
        startDate: loan.startDate.toISOString(),
      };

      // Convert to base64
      const encodedData = btoa(JSON.stringify(shareableData));

      // Create URL with data as a parameter
      const shareableUrl = new URL(this.appUrl);
      shareableUrl.searchParams.append('loan', encodedData);

      return shareableUrl.toString();
    } catch (error) {
      console.error('Error generating shareable link:', error);
      return '';
    }
  }

  /**
   * Import loan data from JSON
   * @param {string} jsonData - JSON string with loan data
   * @returns {Object|null} Object with loan and amortizationSchedule properties, or null if import failed
   */
  importFromJSON(jsonData) {
    try {
      if (!jsonData) {
        throw new Error('No JSON data provided');
      }

      // Parse the JSON
      const parsedData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      // Validate that it contains loan data
      if (!parsedData || !parsedData.loan) {
        throw new Error('Invalid JSON format: missing loan data');
      }

      // Create loan object
      const loan = Loan.fromJSON(parsedData.loan);

      // Create amortization schedule if available
      let amortizationSchedule = null;
      if (parsedData.amortizationSchedule) {
        amortizationSchedule = AmortizationSchedule.fromJSON(parsedData.amortizationSchedule, loan);
      } else {
        // Generate a new schedule if not provided
        amortizationSchedule = new AmortizationSchedule(loan);
      }

      return { loan, amortizationSchedule };
    } catch (error) {
      console.error('Error importing from JSON:', error);
      return null;
    }
  }

  /**
   * Import loan data from CSV
   * @param {string} csvData - CSV string with loan data
   * @returns {Object|null} Object with loan and amortizationSchedule properties, or null if import failed
   */
  importFromCSV(csvData) {
    try {
      if (!csvData) {
        throw new Error('No CSV data provided');
      }

      // Parse the CSV
      const parsedData = Papa.parse(csvData, { header: true });

      if (!parsedData.data || parsedData.data.length === 0) {
        throw new Error('Invalid CSV format or empty data');
      }

      // Extract loan details from the first row
      const loanData = parsedData.data[0];

      // Map CSV fields to loan properties
      const loanOptions = {
        name: loanData['Loan Name'] || 'Imported Loan',
        type: this._getLoanTypeFromDescription(loanData['Loan Type']) || 'mortgage',
        principal: parseFloat(loanData['Principal Amount']) || 0,
        interestRate: parseFloat(loanData['Interest Rate']) || 0,
        term: parseInt(loanData['Term (Months)']) || 360,
        paymentFrequency: this._getPaymentFrequencyFromDescription(loanData['Payment Frequency']) || 'monthly',
        downPayment: parseFloat(loanData['Down Payment']) || 0,
        additionalPayment: parseFloat(loanData['Additional Payment']) || 0,
        startDate: loanData['Start Date'] ? new Date(loanData['Start Date']) : new Date(),
      };

      // Create loan object
      const loan = new Loan(loanOptions);

      // Generate amortization schedule
      const amortizationSchedule = new AmortizationSchedule(loan);

      return { loan, amortizationSchedule };
    } catch (error) {
      console.error('Error importing from CSV:', error);
      return null;
    }
  }

  /**
   * Parse a shareable link to extract loan data
   * @param {string} url - Shareable link URL
   * @returns {Object|null} Object with loan and amortizationSchedule properties, or null if parsing failed
   */
  parseShareableLink(url) {
    try {
      if (!url) {
        throw new Error('No URL provided');
      }

      // Parse the URL
      const parsedUrl = new URL(url);
      const encodedData = parsedUrl.searchParams.get('loan');

      if (!encodedData) {
        throw new Error('No loan data found in URL');
      }

      // Decode the base64 data
      const jsonData = atob(encodedData);

      // Parse the JSON
      return this.importFromJSON(jsonData);
    } catch (error) {
      console.error('Error parsing shareable link:', error);
      return null;
    }
  }

  /**
   * Get loan type description
   * @param {string} type - Loan type
   * @returns {string} Description
   * @private
   */
  _getLoanTypeDescription(type) {
    const descriptions = {
      mortgage: 'Home Mortgage',
      auto: 'Auto Loan',
      personal: 'Personal Loan',
      student: 'Student Loan',
    };

    return descriptions[type] || type;
  }

  /**
   * Get loan type from description
   * @param {string} description - Loan type description
   * @returns {string} Loan type
   * @private
   */
  _getLoanTypeFromDescription(description) {
    const types = {
      'Home Mortgage': 'mortgage',
      'Auto Loan': 'auto',
      'Personal Loan': 'personal',
      'Student Loan': 'student',
    };

    return types[description] || 'mortgage';
  }

  /**
   * Get payment frequency description
   * @param {string} frequency - Payment frequency
   * @returns {string} Description
   * @private
   */
  _getPaymentFrequencyDescription(frequency) {
    const descriptions = {
      monthly: 'Monthly',
      'bi-weekly': 'Bi-Weekly',
      weekly: 'Weekly',
    };

    return descriptions[frequency] || frequency;
  }

  /**
   * Get payment frequency from description
   * @param {string} description - Payment frequency description
   * @returns {string} Payment frequency
   * @private
   */
  _getPaymentFrequencyFromDescription(description) {
    const frequencies = {
      Monthly: 'monthly',
      'Bi-Weekly': 'bi-weekly',
      Weekly: 'weekly',
    };

    return frequencies[description] || 'monthly';
  }

  /**
   * Format loan term
   * @param {number} months - Term in months
   * @returns {string} Formatted term
   * @private
   */
  _formatTerm(months) {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
      return `${months} months`;
    } if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  }

  /**
   * Format time saved
   * @param {number} years - Years saved
   * @param {number} months - Months saved
   * @returns {string} Formatted time saved
   * @private
   */
  _formatTimeSaved(years, months) {
    if (years === 0 && months === 0) {
      return 'None';
    } if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''}`;
  }

  /**
   * Sanitize a string for use as a filename
   * @param {string} name - Name to sanitize
   * @returns {string} Sanitized name
   * @private
   */
  _sanitizeFilename(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  /**
   * Download CSV content as a file
   * @param {string} csvContent - CSV content
   * @param {string} filename - File name
   * @private
   */
  _downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    // Create a download link
    if (navigator.msSaveBlob) {
      // IE 10+
      navigator.msSaveBlob(blob, filename);
    } else {
      // Other browsers
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.style.visibility = 'hidden';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}

export default ExportService;
