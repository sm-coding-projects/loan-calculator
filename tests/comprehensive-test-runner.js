/**
 * Comprehensive Test Runner
 * Runs all tests and generates detailed reports for cross-browser compatibility
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ComprehensiveTestRunner {
  constructor() {
    this.testResults = {
      crossBrowser: {},
      userExperience: {},
      performance: {},
      accessibility: {},
      overall: {},
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Test Suite...\n');

    try {
      // Run cross-browser tests
      await this.runCrossBrowserTests();

      // Run user experience tests
      await this.runUserExperienceTests();

      // Run performance tests
      await this.runPerformanceTests();

      // Run accessibility tests
      await this.runAccessibilityTests();

      // Generate comprehensive report
      this.generateReport();
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async runCrossBrowserTests() {
    console.log('🌐 Running Cross-Browser Compatibility Tests...');

    try {
      const result = execSync('npm test -- --testPathPattern=cross-browser.test.js --verbose', {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      this.testResults.crossBrowser = {
        status: 'passed',
        output: result,
        timestamp: new Date().toISOString(),
      };

      console.log('✅ Cross-browser tests passed\n');
    } catch (error) {
      this.testResults.crossBrowser = {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };

      console.log('❌ Cross-browser tests failed\n');
    }
  }

  async runUserExperienceTests() {
    console.log('👤 Running User Experience Tests...');

    try {
      const result = execSync('npm test -- --testPathPattern=user-experience.test.js --verbose', {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      this.testResults.userExperience = {
        status: 'passed',
        output: result,
        timestamp: new Date().toISOString(),
      };

      console.log('✅ User experience tests passed\n');
    } catch (error) {
      this.testResults.userExperience = {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };

      console.log('❌ User experience tests failed\n');
    }
  }

  async runPerformanceTests() {
    console.log('⚡ Running Performance Tests...');

    try {
      // Run specific performance-related tests
      const result = execSync('npm test -- --testPathPattern="(async-calculation|integration)" --verbose', {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      this.testResults.performance = {
        status: 'passed',
        output: result,
        timestamp: new Date().toISOString(),
      };

      console.log('✅ Performance tests passed\n');
    } catch (error) {
      this.testResults.performance = {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };

      console.log('❌ Performance tests failed\n');
    }
  }

  async runAccessibilityTests() {
    console.log('♿ Running Accessibility Tests...');

    try {
      const result = execSync('npm test -- --testPathPattern=accessibility.test.js --verbose', {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      this.testResults.accessibility = {
        status: 'passed',
        output: result,
        timestamp: new Date().toISOString(),
      };

      console.log('✅ Accessibility tests passed\n');
    } catch (error) {
      this.testResults.accessibility = {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };

      console.log('❌ Accessibility tests failed\n');
    }
  }

  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const report = {
      summary: {
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        totalTests: this.countTotalTests(),
        passedSuites: this.countPassedSuites(),
        failedSuites: this.countFailedSuites(),
      },
      results: this.testResults,
      recommendations: this.generateRecommendations(),
    };

    // Write detailed report to file
    const reportPath = path.join(__dirname, '../test-reports/comprehensive-test-report.json');
    this.ensureDirectoryExists(path.dirname(reportPath));
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    this.generateHTMLReport(report);

    // Print summary to console
    this.printSummary(report);
  }

  countTotalTests() {
    return Object.keys(this.testResults).length;
  }

  countPassedSuites() {
    return Object.values(this.testResults).filter((result) => result.status === 'passed').length;
  }

  countFailedSuites() {
    return Object.values(this.testResults).filter((result) => result.status === 'failed').length;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.testResults.crossBrowser.status === 'failed') {
      recommendations.push({
        category: 'Cross-Browser Compatibility',
        priority: 'high',
        message: 'Fix cross-browser compatibility issues before deployment',
        actions: [
          'Test in Chrome, Firefox, Safari, and Edge',
          'Verify CSS Grid and Flexbox support',
          'Check JavaScript API compatibility',
        ],
      });
    }

    if (this.testResults.userExperience.status === 'failed') {
      recommendations.push({
        category: 'User Experience',
        priority: 'high',
        message: 'Address user experience issues to improve usability',
        actions: [
          'Fix error handling and user feedback',
          'Improve loading states and progress indicators',
          'Ensure smooth user flows',
        ],
      });
    }

    if (this.testResults.performance.status === 'failed') {
      recommendations.push({
        category: 'Performance',
        priority: 'medium',
        message: 'Optimize performance for better user experience',
        actions: [
          'Reduce calculation time to under 3 seconds',
          'Implement async processing',
          'Add progress indicators for long operations',
        ],
      });
    }

    if (this.testResults.accessibility.status === 'failed') {
      recommendations.push({
        category: 'Accessibility',
        priority: 'high',
        message: 'Fix accessibility issues to ensure inclusive design',
        actions: [
          'Add proper ARIA labels and roles',
          'Ensure keyboard navigation works',
          'Test with screen readers',
        ],
      });
    }

    return recommendations;
  }

  generateHTMLReport(report) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px; color: #495057; }
        .summary-card .value { font-size: 2em; font-weight: bold; color: #28a745; }
        .summary-card .value.failed { color: #dc3545; }
        .results { padding: 0 30px 30px; }
        .test-suite { margin-bottom: 30px; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; }
        .test-suite-header { background: #e9ecef; padding: 15px 20px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
        .test-suite-content { padding: 20px; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .recommendations { padding: 0 30px 30px; }
        .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 15px; }
        .recommendation h4 { margin: 0 0 10px; color: #856404; }
        .recommendation ul { margin: 10px 0 0; padding-left: 20px; }
        .footer { background: #f8f9fa; padding: 20px 30px; border-radius: 0 0 8px 8px; text-align: center; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Comprehensive Test Report</h1>
            <p>Generated on ${report.summary.timestamp}</p>
            <p>Total Duration: ${report.summary.duration}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Test Suites</h3>
                <div class="value">${report.summary.totalTests}</div>
            </div>
            <div class="summary-card">
                <h3>Passed Suites</h3>
                <div class="value">${report.summary.passedSuites}</div>
            </div>
            <div class="summary-card">
                <h3>Failed Suites</h3>
                <div class="value failed">${report.summary.failedSuites}</div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div class="value">${Math.round((report.summary.passedSuites / report.summary.totalTests) * 100)}%</div>
            </div>
        </div>
        
        <div class="results">
            <h2>Test Results</h2>
            ${Object.entries(report.results).map(([suite, result]) => `
                <div class="test-suite">
                    <div class="test-suite-header">
                        <span>${suite.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</span>
                        <span class="status-badge status-${result.status}">${result.status}</span>
                    </div>
                    <div class="test-suite-content">
                        <p><strong>Timestamp:</strong> ${result.timestamp}</p>
                        ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
                        ${result.output ? `<details><summary>View Output</summary><pre>${result.output}</pre></details>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${report.recommendations.length > 0 ? `
        <div class="recommendations">
            <h2>Recommendations</h2>
            ${report.recommendations.map((rec) => `
                <div class="recommendation">
                    <h4>${rec.category} (${rec.priority} priority)</h4>
                    <p>${rec.message}</p>
                    <ul>
                        ${rec.actions.map((action) => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="footer">
            <p>Report generated by Comprehensive Test Runner</p>
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(__dirname, '../test-reports/comprehensive-test-report.html');
    this.ensureDirectoryExists(path.dirname(htmlPath));
    fs.writeFileSync(htmlPath, htmlContent);

    console.log(`📊 HTML report generated: ${htmlPath}`);
  }

  printSummary(report) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${report.summary.duration}`);
    console.log(`📋 Total Test Suites: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passedSuites}`);
    console.log(`❌ Failed: ${report.summary.failedSuites}`);
    console.log(`📈 Success Rate: ${Math.round((report.summary.passedSuites / report.summary.totalTests) * 100)}%`);

    if (report.recommendations.length > 0) {
      console.log('\n🔧 RECOMMENDATIONS:');
      report.recommendations.forEach((rec) => {
        console.log(`   • ${rec.category}: ${rec.message}`);
      });
    }

    console.log(`\n${'='.repeat(60)}`);

    if (report.summary.failedSuites === 0) {
      console.log('🎉 All tests passed! Ready for deployment.');
    } else {
      console.log('⚠️  Some tests failed. Please address issues before deployment.');
    }
  }

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

// Run the comprehensive test suite
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  runner.runAllTests().catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveTestRunner;
