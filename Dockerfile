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

# Generate Prisma Clients for all schemas
RUN npx prisma generate --schema=./prisma/public.prisma
RUN npx prisma generate --schema=./prisma/magpie.prisma
RUN npx prisma generate --schema=./prisma/sunroof.prisma

# Build the application
RUN npm run build

# Remove dev dependencies after build to reduce size
RUN npm prune --production

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 4022

# Start the application (run migrations for all schemas first, then start the app)
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/public.prisma && npx prisma migrate deploy --schema=./prisma/magpie.prisma && npx prisma migrate deploy --schema=./prisma/sunroof.prisma && npm run start:prod"]