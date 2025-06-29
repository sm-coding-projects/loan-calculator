# Loan Calculator Docker Application

A responsive loan calculator web application packaged as a Docker container.

## Features
- Calculate monthly loan payments
- View total interest and total payment amounts
- Detailed amortization schedule
- Responsive design works on all devices
- Interactive sliders and input fields

## How to Run

1. Build the Docker image:
```bash
docker build -t loan-calculator .
## Run the container
docker run -d -p 8080:80 --name loan-calc loan-calculator
## Navigate to
http://localhost:8080

## Stop the container
docker stop loan-calc