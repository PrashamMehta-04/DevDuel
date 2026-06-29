FROM node:18-alpine

WORKDIR /app

# Copy package configurations
COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY services/worker/package.json ./services/worker/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN apk add --no-cache openssl
RUN npm install

# Copy source code for shared and backend
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Build shared package
RUN npm run build --workspace=@devduel/shared

# Generate Prisma Client
RUN cd apps/backend && npx prisma generate

# Build backend
RUN npm run build --workspace=backend

EXPOSE 3001
ENV PORT=3001

CMD ["npm", "run", "start", "--workspace=backend"]
