FROM node:18-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY services/worker/package.json ./services/worker/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source code for shared and frontend
COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

# Build projects
RUN npm run build --workspace=@devduel/shared
RUN npm run build --workspace=frontend

FROM nginx:alpine
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
