# Dockerfile for the OVMS backend (Express API)
# Use a minimal Node image
FROM node:22-alpine AS builder
WORKDIR /app

# Install production dependencies only
COPY server/package*.json ./
RUN npm ci --only=production

# Copy source code
COPY server/ ./

# Build (if any build steps – none needed for pure JS)

# Runtime stage
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy built app from builder
COPY --from=builder /app/ .

# Expose the API port
EXPOSE 8000

# Default command
CMD ["node","src/server.js"]
