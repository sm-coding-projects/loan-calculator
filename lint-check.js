// Simple script to check if linting passes
console.log('Running ESLint check...');
const { ESLint } = require('eslint');

async function main() {
  // Create an instance of ESLint with the configuration
  const eslint = new ESLint();

  // Lint files
  const results = await eslint.lintFiles(['src/**/*.js']);

  // Format the results
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);

  // Log the results
  console.log(resultText);

  // Return exit code 1 if there are any errors
  const errorCount = results.reduce((acc, result) => acc + result.errorCount, 0);
  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Error running ESLint:', error);
  process.exit(1);
});