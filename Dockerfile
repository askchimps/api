# Use Node.js 22 Alpine
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build to reduce size
RUN npm prune --production

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 4022

# Start the application
CMD ["npm", "run", "start:prod"]