# Use the official Nginx image as a base
FROM nginx:alpine

# Copy our HTML file to the Nginx web server directory
COPY loan-calculator.html /usr/share/nginx/html/index.html

# Expose port 80 for web traffic
EXPOSE 80

# Start Nginx when the container runs
CMD ["nginx", "-g", "daemon off;"]
