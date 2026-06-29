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
RUN npm install

# Copy source code for shared and worker
COPY packages/shared ./packages/shared
COPY services/worker ./services/worker

# Build projects
RUN npm run build --workspace=@devduel/shared
RUN npm run build --workspace=worker

CMD ["npm", "run", "start", "--workspace=worker"]
