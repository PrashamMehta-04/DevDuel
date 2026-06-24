import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { SOCKET_EVENTS, CodeUpdatePayload, SubmissionResultPayload, SubmissionPayload, MatchStartPayload, MatchOverPayload } from '@devduel/shared';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'devduel-super-secret-key';

interface WaitingPlayer {
  userId: string;
  rating: number;
  socketId: string;
}

interface ActiveMatchPlayer {
  userId: string;
  socketId: string;
  rating: number;
  score: number;
  lastSubmitTime: number;
}

interface ActiveMatch {
  matchId: string;
  problem: any;
  players: Record<string, ActiveMatchPlayer>;
  timer: NodeJS.Timeout;
  botInterval?: NodeJS.Timeout;
}

const activeMatches: Record<string, ActiveMatch> = {};
const MATCH_DURATION = 30 * 60 * 1000; // 30 mins
let matchmakingQueue: WaitingPlayer[] = [];

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

async function seedProblems() {
  const count = await prisma.problem.count();
  if (count === 0) {
    await prisma.problem.createMany({
      data: [
        {
          id: 'two-sum',
          title: 'Two Sum',
          description: 'Write a function twoSum(nums, target) that returns indices of the two numbers such that they add up to target.',
          testCases: [
            { id: 1, isHidden: false, input: '[[2,7,11,15], 9]', expected: '[0,1]' },
            { id: 2, isHidden: false, input: '[[3,2,4], 6]', expected: '[1,2]' },
            { id: 3, isHidden: true, input: '[[3,3], 6]', expected: '[0,1]' },
          ]
        },
        {
          id: 'reverse-string',
          title: 'Reverse String',
          description: 'Write a function reverseString(s) that reverses a string. The input string is given as an array of characters s.',
          testCases: [
            { id: 1, isHidden: false, input: '[["h","e","l","l","o"]]', expected: '["o","l","l","e","h"]' },
            { id: 2, isHidden: true, input: '[["H","a","n","n","a","h"]]', expected: '["h","a","n","n","a","H"]' },
          ]
        }
      ]
    });
    console.log('[Backend] Seeded initial problems');
  }
}
seedProblems();

app.get('/api/problems/random', async (req, res) => {
  try {
    const problems = await prisma.problem.findMany({
      select: { id: true, title: true, description: true } // Don't send testCases to frontend
    });
    if (problems.length === 0) return res.status(404).json({ error: 'No problems found' });
    const randomProblem = problems[Math.floor(Math.random() * problems.length)];
    res.json(randomProblem);
  } catch (error) {
    console.error('Random problem error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/problems', async (req, res) => {
  try {
    const { title, description, difficulty, testCases } = req.body;
    
    // Basic auth check: In a real app, verify admin role via JWT
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    
    const problem = await prisma.problem.create({
      data: {
        title,
        description,
        difficulty: difficulty || 'EASY',
        testCases, // Expects a JSON array
      }
    });
    
    res.json({ success: true, problem });
  } catch (error) {
    console.error('Create problem error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  
  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Username already taken' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, password: hashedPassword } });
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      id: user.id, username: user.username, elo: user.elo, 
      matchesWon: 0, matchesPlayed: 0, token 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    
    const matchesWon = await prisma.match.count({ where: { winnerId: user.id } });
    const matchesPlayed = await prisma.match.count({ where: { players: { some: { id: user.id } } } });
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      id: user.id, username: user.username, elo: user.elo, 
      matchesWon, matchesPlayed, token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: { elo: 'desc' },
      take: 50,
      select: { id: true, username: true, elo: true }
    });
    res.json(topUsers);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:userId/matches', async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: { players: { some: { id: req.params.userId } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        players: { select: { id: true, username: true } }
      }
    });
    res.json(matches);
  } catch (error) {
    console.error('Match history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for local development
    methods: ["GET", "POST"],
    credentials: true
  },
});

async function endMatch(matchId: string, reason: string) {
  const match = activeMatches[matchId];
  if (!match) return;

  clearTimeout(match.timer);
  if (match.botInterval) {
    clearInterval(match.botInterval);
  }

  const playerIds = Object.keys(match.players);
  if (playerIds.length === 2) {
    const p1 = match.players[playerIds[0]];
    const p2 = match.players[playerIds[1]];

    let winnerId: string | null = null;
    let loserId: string | null = null;

    if (p1.score > p2.score) {
      winnerId = p1.userId; loserId = p2.userId;
    } else if (p2.score > p1.score) {
      winnerId = p2.userId; loserId = p1.userId;
    } else {
      // Tie breaker: Speed! Lowest lastSubmitTime wins.
      if (p1.lastSubmitTime > 0 && p2.lastSubmitTime > 0) {
        if (p1.lastSubmitTime < p2.lastSubmitTime) {
          winnerId = p1.userId; loserId = p2.userId;
        } else if (p2.lastSubmitTime < p1.lastSubmitTime) {
          winnerId = p2.userId; loserId = p1.userId;
        }
      } else if (p1.lastSubmitTime > 0) {
        winnerId = p1.userId; loserId = p2.userId;
      } else if (p2.lastSubmitTime > 0) {
        winnerId = p2.userId; loserId = p1.userId;
      }
    }

    let winnerEloChange = 0;
    let loserEloChange = 0;
    if (winnerId) {
      winnerEloChange = 25;
      loserEloChange = -25;
    }

    // Save match to database and update Elo
    try {
      const realPlayers = playerIds.filter(id => !id.startsWith('Bot_'));
      if (realPlayers.length > 0) {
        await prisma.match.create({
          data: {
            id: matchId,
            status: 'COMPLETED',
            problemId: 'two-sum',
            winnerId: winnerId && !winnerId.startsWith('Bot_') ? winnerId : null,
            players: {
              connect: realPlayers.map(id => ({ id }))
            }
          }
        });

        for (const pid of realPlayers) {
          if (pid === winnerId) {
            await prisma.user.update({
              where: { id: pid },
              data: { elo: { increment: winnerEloChange } }
            });
          } else if (pid === loserId) {
            await prisma.user.update({
              where: { id: pid },
              data: { elo: { increment: loserEloChange } }
            });
          }
        }
      }
    } catch (err) {
      console.error('[Backend] Error saving match to DB:', err);
    }

    const payload: MatchOverPayload = {
      matchId,
      winnerId,
      loserId,
      winnerEloChange,
      loserEloChange,
      reason
    };

    io.to(matchId).emit(SOCKET_EVENTS.MATCH_OVER, payload);
  }
  delete activeMatches[matchId];
}

// Setup the connection to Redis for the Queue
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Create the 'code-execution' queue and its events listener
const executionQueue = new Queue('code-execution', { connection: redisConnection });
const queueEvents = new QueueEvents('code-execution', { connection: redisConnection });

// Listen for when the worker finishes a job
queueEvents.on('completed', async ({ jobId }) => {
  console.log(`[Backend] Queue event: Job ${jobId} completed`);
  const job = await executionQueue.getJob(jobId);
  
  if (job && job.returnvalue) {
    const result = job.returnvalue as SubmissionResultPayload;
    console.log(`[Backend] Broadcasting result to match ${result.matchId}. Success: ${result.success}`);
    
    const match = activeMatches[result.matchId];
    if (match && match.players[result.userId]) {
      const player = match.players[result.userId];
      const newScore = result.results.filter(r => r.passed).length;
      if (newScore > player.score) {
        player.score = newScore;
        player.lastSubmitTime = Date.now();
      }
    }

    // Send the result to everyone in that specific match room
    const emitResult = io.to(result.matchId).emit(SOCKET_EVENTS.TEST_RESULT, result);
    console.log(`[Backend] Emit Test Result success: ${!!emitResult}`);
    
    // Also notify about progress
    io.to(result.matchId).emit(SOCKET_EVENTS.OPPONENT_PROGRESS, {
      userId: result.userId,
      progress: result.overallProgress
    });

    // Check for win condition
    if (result.success && result.type === 'submit') {
      endMatch(result.matchId, 'All tests passed');
    }
  } else {
    console.warn(`[Backend] Job ${jobId} completed but returnvalue was missing!`);
  }
});

const PORT = process.env.PORT || 3001;

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error: Token missing'));

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    socket.data.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket] 🔌 New connection: ${socket.id} (User: ${socket.data.userId})`);

  socket.on(SOCKET_EVENTS.JOIN_MATCH, (matchId: string) => {
    socket.join(matchId);
    console.log(`[Socket] 🏠 User ${socket.id} joined match room: ${matchId}`);
  });

  socket.on(SOCKET_EVENTS.FIND_MATCH, async (payload: { userId: string, rating: number }) => {
    payload.userId = socket.data.userId; // Secure override
    console.log(`[Socket] 🔍 User ${payload.userId} (Rating: ${payload.rating}) is looking for a match.`);

    // Check if there is a suitable opponent in the queue (within 200 rating points)
    const RATING_TOLERANCE = 200;
    const opponentIndex = matchmakingQueue.findIndex(p => Math.abs(p.rating - payload.rating) <= RATING_TOLERANCE);

    if (opponentIndex !== -1) {
      // Found a real match!
      const opponent = matchmakingQueue.splice(opponentIndex, 1)[0];
      const matchId = `match-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      console.log(`[Socket] ⚔️ Match found: ${payload.userId} vs ${opponent.userId} (MatchID: ${matchId})`);

      const startTime = Date.now();
      const endTime = startTime + MATCH_DURATION;
      
      const problems = await prisma.problem.findMany();
      const randomProblem = problems[Math.floor(Math.random() * problems.length)];

      // Create Active Match
      activeMatches[matchId] = {
        matchId,
        problem: randomProblem,
        players: {
          [payload.userId]: { userId: payload.userId, socketId: socket.id, rating: payload.rating, score: 0, lastSubmitTime: 0 },
          [opponent.userId]: { userId: opponent.userId, socketId: opponent.socketId, rating: opponent.rating, score: 0, lastSubmitTime: 0 }
        },
        timer: setTimeout(() => endMatch(matchId, 'Time expired'), MATCH_DURATION)
      };

      const startPayload1: MatchStartPayload = { matchId, opponentId: opponent.userId, startTime, endTime, problem: { id: randomProblem.id, title: randomProblem.title, description: randomProblem.description } };
      const startPayload2: MatchStartPayload = { matchId, opponentId: payload.userId, startTime, endTime, problem: { id: randomProblem.id, title: randomProblem.title, description: randomProblem.description } };

      // Notify both players
      io.to(socket.id).emit(SOCKET_EVENTS.MATCH_FOUND, startPayload1);
      io.to(opponent.socketId).emit(SOCKET_EVENTS.MATCH_FOUND, startPayload2);
    } else {
      // No match found immediately, add to queue
      matchmakingQueue.push({ userId: payload.userId, rating: payload.rating, socketId: socket.id });

      // Start a 15-second timer for AI Bot fallback
      setTimeout(async () => {
        const pIndex = matchmakingQueue.findIndex(p => p.socketId === socket.id);
        if (pIndex !== -1) {
          // Still waiting! Remove from queue and spawn bot.
          const player = matchmakingQueue.splice(pIndex, 1)[0];
          const botId = `Bot_CodeMaster_${Math.floor(Math.random() * 100)}`;
          const matchId = `match-bot-${Date.now()}`;
          const startTime = Date.now();
          const endTime = startTime + MATCH_DURATION;
          
          const problems = await prisma.problem.findMany();
          const randomProblem = problems[Math.floor(Math.random() * problems.length)];
          
          console.log(`[Socket] 🤖 Spawning AI Bot Match: ${player.userId} (Elo: ${player.rating}) vs ${botId}`);

          // Scale Bot Difficulty based on Player's Elo
          let intervalMs = 15000;
          let progressChance = 0.4; // 60% chance to gain progress
          let progressMin = 5;
          let progressMax = 15;

          if (player.rating >= 2000) {
            intervalMs = 6000;       // Very fast updates
            progressChance = 0.1;    // 90% chance to progress
            progressMin = 15;
            progressMax = 30;        // Huge jumps
          } else if (player.rating >= 1500) {
            intervalMs = 10000;      // Fast updates
            progressChance = 0.2;    // 80% chance
            progressMin = 10;
            progressMax = 20;
          } else if (player.rating < 1200) {
            intervalMs = 25000;      // Very slow
            progressChance = 0.6;    // 40% chance (stuck often)
            progressMin = 5;
            progressMax = 10;        // Small jumps
          }

          let botProgress = 0;
          const botInterval = setInterval(() => {
            io.to(matchId).emit(SOCKET_EVENTS.OPPONENT_TYPING, { userId: botId, isTyping: true });
            
            if (Math.random() > progressChance) {
              botProgress += Math.floor(Math.random() * (progressMax - progressMin + 1)) + progressMin;
              if (botProgress > 100) botProgress = 100;
              
              io.to(matchId).emit(SOCKET_EVENTS.OPPONENT_PROGRESS, { userId: botId, progress: botProgress });
              
              if (botProgress === 100) {
                 const match = activeMatches[matchId];
                 if (match && match.players[botId]) {
                    match.players[botId].score = 999; // Represents all tests passed
                    match.players[botId].lastSubmitTime = Date.now();
                 }
                 endMatch(matchId, 'Opponent passed all tests');
              }
            }
          }, intervalMs);

          activeMatches[matchId] = {
            matchId,
            problem: randomProblem,
            players: {
              [player.userId]: { userId: player.userId, socketId: player.socketId, rating: player.rating, score: 0, lastSubmitTime: 0 },
              [botId]: { userId: botId, socketId: 'bot-socket', rating: player.rating, score: 0, lastSubmitTime: 0 }
            },
            timer: setTimeout(() => endMatch(matchId, 'Time expired'), MATCH_DURATION),
            botInterval
          };

          io.to(player.socketId).emit(SOCKET_EVENTS.MATCH_FOUND, { matchId, opponentId: botId, startTime, endTime, problem: { id: randomProblem.id, title: randomProblem.title, description: randomProblem.description } });
        }
      }, 15000); // 15 seconds wait
    }
  });

  socket.on(SOCKET_EVENTS.CODE_UPDATE, (payload: CodeUpdatePayload) => {
    payload.userId = socket.data.userId; // Secure override
    socket.to(payload.matchId).emit(SOCKET_EVENTS.OPPONENT_TYPING, {
      userId: payload.userId,
      isTyping: true
    });
  });

  socket.on(SOCKET_EVENTS.SUBMIT_CODE, async (payload: SubmissionPayload) => {
    payload.userId = socket.data.userId; // Secure override
    console.log(`[Socket] 🚀 Received ${payload.type.toUpperCase()} from ${payload.userId}`);
    
    try {
      const job = await executionQueue.add('execute', {
        matchId: payload.matchId,
        userId: payload.userId,
        code: payload.code,
        language: payload.language,
        type: payload.type,
        testCases: activeMatches[payload.matchId]?.problem?.testCases || []
      });
      console.log(`[Queue] 🎟️  Job added to queue with ID: ${job.id}`);
    } catch (err) {
      console.error(`[Queue] ❌ Failed to add job to queue:`, err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
