# ⚔️ DevDuel

> A full-stack competitive coding platform enabling live 1v1 algorithmic multiplayer duels, distributed asynchronous code execution, and AI-automated problem generation.

## 🌟 Key Features
- **Real-Time Multiplayer Duels:** Instantly match with opponents around the globe. Both players receive the same algorithmic challenge, and the first to pass all test cases wins.
- **Private Custom Rooms:** Challenge your friends in unranked private duels by sharing a unique 6-character room code.
- **Practice Range:** Practice problems stress-free with no timer or rating changes. The system automatically serves you random problems you haven't solved yet.
- **Global Elo Rating System:** Win matches to increase your global Elo rating. Lose, and your rating drops. Climb the global leaderboard!
- **AI-Powered Problem Generation:** An integrated Admin dashboard that leverages Google Gemini AI to instantly generate new competitive programming problems, test cases, and boilerplate code across multiple languages.
- **Distributed Code Execution Sandbox:** A highly scalable backend architecture that isolates untrusted user code execution into background workers using Redis and BullMQ, completely decoupled from the real-time WebSocket server.
- **Massive Test Case Injection:** Implements a custom server-side evaluation layer to dynamically generate massive 50MB+ datasets natively, bypassing strict AI token limits.

## 🏗️ Architecture & System Design
DevDuel is engineered as a **Distributed System** to ensure sub-second WebSocket latency even under heavy load. 

Instead of executing submitted code on the primary Express server (which would block the main thread and crash the real-time game state), DevDuel utilizes **Redis** as a message broker. When a user submits code, a job is placed in a BullMQ queue. Isolated background worker nodes consume these jobs, securely execute the code against hidden test cases, and return the output to the web server, which broadcasts the results via **Socket.io**.

The project is structured as a **Turborepo Monorepo**, sharing TypeScript interfaces, types, and WebSocket event dictionaries between the frontend and backend to guarantee strict type safety across the network boundary.

## 💻 Tech Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS, Zustand, React Router, Socket.io-client, Monaco Editor, Lucide React
- **Backend:** Node.js, Express.js, TypeScript, Socket.io, BullMQ
- **Database & Message Broker:** PostgreSQL, Prisma ORM, Redis
- **AI & Integrations:** Google Gemini API, Google OAuth 2.0
- **Tooling:** Turborepo, npm workspaces, Vite, ESLint

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your local machine:
- Node.js (v18+)
- Docker & Docker Compose (for easily running Postgres & Redis)

### 1. Clone the repository
```bash
git clone https://github.com/PrashamMehta-04/DevDuel.git
cd DevDuel
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory as well as in `apps/backend/` and `apps/frontend/` based on their respective `.env.example` files. You will need:
- `DATABASE_URL` (PostgreSQL connection string)
- `REDIS_URL` (e.g., `redis://localhost:6379`)
- `GEMINI_API_KEY`
- `VITE_GOOGLE_CLIENT_ID` (Frontend only)

### 4. Start Infrastructure (Postgres & Redis)
```bash
docker-compose up -d postgres redis
```

### 5. Database Setup
```bash
cd apps/backend
npx prisma generate
npx prisma migrate deploy
cd ../../
```

### 6. Start the Servers
From the root directory, start the frontend, backend, and worker concurrently:
```bash
npm run dev
```
The Frontend will be available at `http://localhost:5173` and the Backend API at `http://localhost:3001`.

## 📝 License
This project is open-source and available under the MIT License.