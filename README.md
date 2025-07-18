# Loan Calculator

An enhanced loan calculator web application with advanced features for calculating and comparing loan options, amortization schedules, and financial planning.

![Loan Calculator Screenshot](https://via.placeholder.com/800x450.png?text=Loan+Calculator+Screenshot)

## Features

- **Loan Calculation**: Calculate monthly payments, total interest, and loan costs
- **Amortization Schedule**: View detailed payment breakdowns over the loan term
- **Multiple Loan Comparison**: Compare different loan options side by side
- **Interactive Charts**: Visualize payment breakdowns and amortization
- **Inflation Adjustment**: See how inflation affects the real cost of your loan
- **Save Calculations**: Store and retrieve previous calculations
- **Export Options**: Download results as PDF or CSV
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Accessibility**: WCAG 2.1 AA compliant
- **Multilingual Support**: Available in multiple languages
- **Dark/Light Themes**: Choose your preferred visual style

## Getting Started

### Prerequisites

- Node.js 16 or later
- npm 7 or later

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/loan-calculator.git
   cd loan-calculator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:9000
   ```

## Usage

### Basic Loan Calculation

1. Enter the loan amount
2. Set the interest rate
3. Choose the loan term
4. Click "Calculate" to see results

### Advanced Features

- **Amortization Table**: Click "Show Amortization" to see the payment schedule
- **Loan Comparison**: Use the "Add Comparison" button to compare multiple scenarios
- **Save Calculation**: Click "Save" to store the current calculation
- **Export Results**: Use the "Export" dropdown to choose PDF or CSV format
- **Change Settings**: Click the gear icon to access theme and language options

## Development

### Project Structure

```
loan-calculator/
├── src/
│   ├── js/
│   │   ├── components/    # UI components
│   │   ├── models/        # Data models
│   │   ├── services/      # Business logic
│   │   └── utils/         # Helper functions
│   ├── css/               # Stylesheets
│   └── assets/            # Images and icons
├── tests/                 # Test files
├── docs/                  # Documentation
└── dist/                  # Production build (generated)
```

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Check code style
- `npm run analyze` - Analyze bundle size

### Testing

The project uses Jest for unit and integration testing:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage
```

## Deployment

### Docker Deployment

Build and run with Docker:

```bash
# Build the Docker image
docker build -t loan-calculator .

# Run the container
docker run -d -p 8080:80 loan-calculator
```

For more detailed deployment instructions, see the [Deployment Guide](docs/deployment-guide.md).

## Performance Optimization

The application is optimized for performance:

- Code splitting and lazy loading
- Asset minification and compression
- Efficient bundle chunking
- Image optimization
- Caching strategies

For more details, see the [Performance Optimization Guide](docs/performance-optimization.md).

## Accessibility

The loan calculator is designed to be accessible to all users:

- Semantic HTML structure
- ARIA attributes where needed
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Chart.js for data visualization
- jsPDF for PDF generation
- PapaParse for CSV handling