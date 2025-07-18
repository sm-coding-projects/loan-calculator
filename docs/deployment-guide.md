# Loan Calculator Deployment Guide

This document provides instructions for building, deploying, and configuring the Loan Calculator application in various environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Build Process](#build-process)
3. [Docker Deployment](#docker-deployment)
4. [Manual Deployment](#manual-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Continuous Integration](#continuous-integration)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the Loan Calculator application, ensure you have the following:

- Node.js 16 or later
- npm 7 or later
- Docker (for containerized deployment)
- Access to a web server (for manual deployment)

## Build Process

### Local Development Build

To build the application for local development:

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The development server will be available at http://localhost:9000.

### Production Build

To create a production-ready build:

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This will generate optimized assets in the `dist` directory, including:
- Minified JavaScript files with content hashing
- Optimized CSS files
- Compressed images
- HTML with optimized resource references

### Analyzing the Bundle

To analyze the production bundle size:

```bash
npm run analyze
```

This will open a visualization of the bundle size in your browser.

## Docker Deployment

### Building the Docker Image

To build the Docker image:

```bash
docker build -t loan-calculator:latest .
```

### Running the Container

To run the container:

```bash
docker run -d -p 8080:80 --name loan-calculator loan-calculator:latest
```

The application will be available at http://localhost:8080.

### Docker Compose

For more complex deployments, you can use Docker Compose:

```yaml
version: '3'
services:
  loan-calculator:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

Save this as `docker-compose.yml` and run:

```bash
docker-compose up -d
```

## Manual Deployment

### Web Server Requirements

- Any web server capable of serving static files (Nginx, Apache, etc.)
- Proper MIME type configuration
- HTTPS support recommended for production

### Deployment Steps

1. Build the application as described in the [Production Build](#production-build) section
2. Copy the contents of the `dist` directory to your web server's document root
3. Configure your web server to handle single-page application routing

#### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/loan-calculator/dist;
    index index.html;

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

## Environment Configuration

The Loan Calculator application is a client-side only application with no backend dependencies. However, you may want to customize certain aspects of the deployment:

### Custom Base URL

If you're deploying to a subdirectory, you'll need to update the `publicPath` in `webpack.config.js`:

```javascript
output: {
  // ...
  publicPath: '/your-subdirectory/',
  // ...
}
```

Then rebuild the application.

### Feature Flags

Feature flags can be configured by creating a `config.js` file in the `dist` directory after building:

```javascript
window.LOAN_CALCULATOR_CONFIG = {
  enableExperimentalFeatures: false,
  maxSavedCalculations: 10,
  defaultCurrency: 'USD',
  // Add other configuration options here
};
```

## Continuous Integration

The project is configured for CI/CD using GitHub Actions. See the `.github/workflows/main.yml` file for details.

The CI pipeline includes:
- Code linting
- Unit tests
- Build verification
- Docker image creation
- Automated deployment (for specific branches)

## Troubleshooting

### Common Issues

#### Build Failures

If the build fails, check:
- Node.js version compatibility
- Missing dependencies
- Syntax errors in code

#### Runtime Errors

If the application doesn't work after deployment:
- Check browser console for JavaScript errors
- Verify all assets are being served correctly
- Ensure the web server is configured for SPA routing

#### Performance Issues

If the application is slow:
- Check network waterfall in browser dev tools
- Verify compression is enabled on the web server
- Consider enabling a CDN for static assets

### Getting Help

If you encounter issues not covered in this guide:
- Check the project's GitHub issues
- Review the documentation in the `docs` directory
- Contact the development team