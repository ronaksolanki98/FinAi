# ---------- BUILDER ----------
  FROM node:22-alpine AS builder

  RUN npm install -g pnpm
  WORKDIR /app
  
  COPY package.json pnpm-lock.yaml ./
  RUN pnpm install --frozen-lockfile
  
  COPY . .
  
  RUN pnpm run build:client
  RUN pnpm run build:server
  
  
  # ---------- RUNTIME ----------
  FROM node:22-alpine
  
  RUN npm install -g pnpm
  WORKDIR /app
  
  COPY package.json pnpm-lock.yaml ./
  RUN pnpm install --prod --frozen-lockfile
  
  COPY --from=builder /app/dist ./dist
  
  EXPOSE 8080
  
  CMD ["node", "dist/server/node-build.mjs"]