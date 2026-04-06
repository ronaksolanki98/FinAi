### Multi-stage Dockerfile for production

# 1. Build the application (client + server)
FROM node:20.8.0-slim AS builder
WORKDIR /app

# Copy only the manifest files first to leverage cache
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally and project dependencies
RUN npm install -g pnpm@10.14.0
RUN pnpm install --frozen-lockfile

# Copy the rest of the sources
COPY . .

# Build both the frontend and the bundled server artifacts
RUN pnpm build

# 2. Production runtime
FROM node:20.8.0-alpine
WORKDIR /app

# Run only production dependencies (required for Express)
COPY package.json pnpm-lock.yaml ./

# Install only prod deps; pnpm stores cache in /root/.cache
RUN npm install -g pnpm@10.14.0
RUN pnpm install --prod --frozen-lockfile

# Copy compiled assets and server output
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/app/server ./server
COPY --from=builder /app/app/shared ./shared
COPY --from=builder /app/public ./public
COPY --from=builder /app/vite.config.* ./

# Expose the default port
EXPOSE 3000

# Use environment variable to configure production port
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Entry point: use production server build
CMD ["node", "dist/server/node-build.mjs"]
