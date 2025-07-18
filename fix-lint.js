// Script to fix linting issues automatically
console.log('Running ESLint fix...');
const { ESLint } = require('eslint');

async function main() {
  // Create an instance of ESLint with the configuration
  const eslint = new ESLint({ fix: true });

  // Lint files
  const results = await eslint.lintFiles(['src/**/*.js']);

  // Apply fixes
  await ESLint.outputFixes(results);

  // Format the results
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);

  // Log the results
  console.log(resultText);

  // Return exit code 1 if there are any errors
  const errorCount = results.reduce((acc, result) => acc + result.errorCount, 0);
  console.log(`Remaining errors: ${errorCount}`);
  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Error running ESLint:', error);
  process.exit(1);
});