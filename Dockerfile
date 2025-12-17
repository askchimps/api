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

# Generate Prisma Clients for all schemas BEFORE building
RUN npx prisma generate --schema=./prisma/public.prisma
RUN npx prisma generate --schema=./prisma/magpie.prisma
RUN npx prisma generate --schema=./prisma/sunroof.prisma

# Build the application
RUN npm run build

# Remove dev dependencies after build to reduce size (but keep prisma)
RUN npm prune --production

# Re-generate Prisma Clients after pruning (since prune removes them)
RUN npx prisma generate --schema=./prisma/public.prisma
RUN npx prisma generate --schema=./prisma/magpie.prisma
RUN npx prisma generate --schema=./prisma/sunroof.prisma

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 4022

# Start the application
CMD ["npm", "run", "start:prod"]