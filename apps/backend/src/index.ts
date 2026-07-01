import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Queue, QueueEvents } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { SOCKET_EVENTS } from '@devduel/shared';
import type { CodeUpdatePayload, SubmissionResultPayload, SubmissionPayload, MatchStartPayload, MatchOverPayload } from '@devduel/shared';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'devduel-super-secret-key';

interface WaitingPlayer {
  userId: string;
  rating: number;
  socketId: string;
  username: string;
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
interface PrivateRoom {
  roomCode: string;
  creator: { userId: string, socketId: string, rating: number, username: string };
}
const privateRooms: Record<string, PrivateRoom> = {};
const MATCH_DURATION = 30 * 60 * 1000; // 30 mins
let matchmakingQueue: WaitingPlayer[] = [];

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

async function seedAdmin() {
  const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        isAdmin: true
      }
    });
    console.log('Seeded admin user (admin / admin123)');
  }
}

async function seedProblems() {
  const count = await prisma.problem.count();
  if (count === 0) {
    await prisma.problem.createMany({
      data: [
        {
          id: 'two-sum',
          title: 'Two Sum',
          description: 'Write a function named `solution(nums, target)` that returns indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
          constraints: '- 2 <= nums.length <= 10^4\n- -10^9 <= nums[i] <= 10^9\n- -10^9 <= target <= 10^9\n- Only one valid answer exists.',
          testCases: [
            { id: 1, isHidden: false, input: '[[2,7,11,15], 9]', expected: '[0,1]' },
            { id: 2, isHidden: false, input: '[[3,2,4], 6]', expected: '[1,2]' },
            { id: 3, isHidden: true, input: '[[3,3], 6]', expected: '[0,1]' },
            { id: 4, isHidden: true, input: '[[2,5,5,11], 10]', expected: '[1,2]' },
          ],
          defaultCode: {
            python: 'def solution(nums, target):\n    # Write your code here\n    pass',
            javascript: 'function solution(nums, target) {\n    // Write your code here\n    \n}'
          }
        },
        {
          id: 'reverse-string',
          title: 'Reverse String',
          description: 'Write a function named `solution(s)` that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place with O(1) extra memory, and returning the modified array.',
          constraints: '- 1 <= s.length <= 10^5\n- s[i] is a printable ascii character.',
          testCases: [
            { id: 1, isHidden: false, input: '[["h","e","l","l","o"]]', expected: '["o","l","l","e","h"]' },
            { id: 2, isHidden: true, input: '[["H","a","n","n","a","h"]]', expected: '["h","a","n","n","a","H"]' },
          ],
          defaultCode: {
            python: 'def solution(s):\n    # Write your code here\n    pass',
            javascript: 'function solution(s) {\n    // Write your code here\n    \n}'
          }
        },
        {
          id: 'valid-palindrome',
          title: 'Valid Palindrome',
          description: 'Write a function named `solution(s)` that returns true if a string is a palindrome, and false otherwise. A string is a palindrome when it reads the same forward and backward, ignoring non-alphanumeric characters and case.',
          constraints: '- 1 <= s.length <= 2 * 10^5\n- s consists only of printable ASCII characters.',
          testCases: [
            { id: 1, isHidden: false, input: '["A man, a plan, a canal: Panama"]', expected: 'true' },
            { id: 2, isHidden: false, input: '["race a car"]', expected: 'false' },
            { id: 3, isHidden: true, input: '[" "]', expected: 'true' },
          ],
          defaultCode: {
            python: 'def solution(s):\n    # Write your code here\n    pass',
            javascript: 'function solution(s) {\n    // Write your code here\n    \n}'
          }
        },
        {
          id: 'contains-duplicate',
          title: 'Contains Duplicate',
          description: 'Write a function named `solution(nums)` that returns true if any value appears at least twice in the array, and returns false if every element is distinct.',
          constraints: '- 1 <= nums.length <= 10^5\n- -10^9 <= nums[i] <= 10^9',
          testCases: [
            { id: 1, isHidden: false, input: '[[1,2,3,1]]', expected: 'true' },
            { id: 2, isHidden: false, input: '[[1,2,3,4]]', expected: 'false' },
            { id: 3, isHidden: true, input: '[[1,1,1,3,3,4,3,2,4,2]]', expected: 'true' },
          ],
          defaultCode: {
            python: 'def solution(nums):\n    # Write your code here\n    pass',
            javascript: 'function solution(nums) {\n    // Write your code here\n    \n}'
          }
        },
        {
          id: 'fizz-buzz',
          title: 'Fizz Buzz',
          description: 'Write a function named `solution(n)` that returns an array of strings from 1 to n where: answer[i] == "FizzBuzz" if i is divisible by 3 and 5, answer[i] == "Fizz" if i is divisible by 3, answer[i] == "Buzz" if i is divisible by 5, and answer[i] == i (as a string) if none of the above conditions are true.',
          constraints: '- 1 <= n <= 10^4',
          testCases: [
            { id: 1, isHidden: false, input: '[3]', expected: '["1","2","Fizz"]' },
            { id: 2, isHidden: false, input: '[5]', expected: '["1","2","Fizz","4","Buzz"]' },
            { id: 3, isHidden: true, input: '[15]', expected: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' },
          ],
          defaultCode: {
            python: 'def solution(n):\n    # Write your code here\n    pass',
            javascript: 'function solution(n) {\n    // Write your code here\n    \n}'
          }
        },
        {
          id: 'valid-parentheses',
          title: 'Valid Parentheses',
          description: 'Write a function named `solution(s)` that takes a string containing just the characters "(", ")", "{", "}", "[" and "]", and determines if the input string is valid. Open brackets must be closed by the same type of brackets, in the correct order.',
          constraints: '- 1 <= s.length <= 10^4\n- s consists of parentheses only \'()[]{}\'.',
          testCases: [
            { id: 1, isHidden: false, input: '["()"]', expected: 'true' },
            { id: 2, isHidden: false, input: '["()[]{}"]', expected: 'true' },
            { id: 3, isHidden: false, input: '["(]"]', expected: 'false' },
            { id: 4, isHidden: true, input: '["([)]"]', expected: 'false' },
            { id: 5, isHidden: true, input: '["{[]}"]', expected: 'true' },
          ],
          defaultCode: {
            python: 'def solution(s):\n    # Write your code here\n    pass',
            javascript: 'function solution(s) {\n    // Write your code here\n    \n}'
          }
        },
        {
          id: 'missing-number',
          title: 'Missing Number',
          description: 'Write a function named `solution(nums)` that takes an array nums containing n distinct numbers in the range [0, n], and returns the only number in the range that is missing from the array.',
          constraints: '- n == nums.length\n- 1 <= n <= 10^4\n- 0 <= nums[i] <= n\n- All the numbers of nums are unique.',
          testCases: [
            { id: 1, isHidden: false, input: '[[3,0,1]]', expected: '2' },
            { id: 2, isHidden: false, input: '[[0,1]]', expected: '2' },
            { id: 3, isHidden: true, input: '[[9,6,4,2,3,5,7,0,1]]', expected: '8' },
          ],
          defaultCode: {
            python: 'def solution(nums):\n    # Write your code here\n    pass',
            javascript: 'function solution(nums) {\n    // Write your code here\n    \n}'
          }
        }
      ]
    });
    console.log('[Backend] Seeded initial problems');
  }
}
seedProblems();
seedAdmin();

const adminAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Forbidden: Admin access required' });
    
    (req as any).user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/api/problems/random', async (req, res) => {
  try {
    const problems = await prisma.problem.findMany({
      select: { id: true, title: true, description: true, defaultCode: true }
    });
    if (problems.length === 0) return res.status(404).json({ error: 'No problems found' });
    const randomProblem = problems[Math.floor(Math.random() * problems.length)];
    res.json(randomProblem);
  } catch (error) {
    console.error('Random problem error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/problems/daily', async (req, res) => {
  try {
    // For now, hardcode "two-sum" as the daily problem, or pick one based on the day of the year
    const problem = await prisma.problem.findUnique({
      where: { id: 'two-sum' },
      select: { id: true, title: true, description: true, defaultCode: true }
    });
    if (!problem) return res.status(404).json({ error: 'Daily problem not found' });
    res.json(problem);
  } catch (error) {
    console.error('Daily problem error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/problems/:problemId', async (req, res) => {
  try {
    // Avoid conflicting with other routes like /random
    if (req.params.problemId === 'random') return;

    const problem = await prisma.problem.findUnique({
      where: { id: req.params.problemId },
      select: { id: true, title: true, description: true, defaultCode: true }
    });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    res.json(problem);
  } catch (error) {
    console.error('Fetch problem error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/problems/:problemId/submissions', async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  try {
    const submissions = await prisma.submission.findMany({
      where: { problemId: req.params.problemId, userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(submissions);
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/problems', adminAuth, async (req, res) => {
  try {
    const { title, description, constraints, difficulty, testCases } = req.body;
    
    const problem = await prisma.problem.create({
      data: {
        title,
        description,
        constraints,
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

app.get('/api/problems', async (req, res) => {
  try {
    const problems = await prisma.problem.findMany({
      orderBy: { title: 'asc' }
    });
    res.json(problems);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/problems/:problemId', adminAuth, async (req, res) => {
  try {
    const { problemId } = req.params;
    const { title, description, constraints, difficulty, testCases } = req.body;
    
    const problem = await prisma.problem.update({
      where: { id: problemId },
      data: {
        title,
        description,
        constraints,
        difficulty: difficulty || 'EASY',
        testCases,
      }
    });
    
    res.json({ success: true, problem });
  } catch (error) {
    console.error('Update problem error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/problems/:problemId', adminAuth, async (req, res) => {
  try {
    const { problemId } = req.params;
    await prisma.problem.delete({ where: { id: problemId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete problem error:', error);
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
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '12h' });
    
    res.json({ 
      id: user.id, username: user.username, elo: user.elo, 
      matchesWon: 0, matchesPlayed: 0, token, isAdmin: user.isAdmin
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
    
    if (!user.password) return res.status(400).json({ error: 'Please login with Google' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    
    const matchesWon = await prisma.match.count({ where: { winnerId: user.id } });
    const matchesPlayed = await prisma.match.count({ where: { players: { some: { id: user.id } } } });
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '12h' });
    
    res.json({ 
      id: user.id, username: user.username, elo: user.elo, 
      matchesWon, matchesPlayed, token, isAdmin: user.isAdmin
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-client-id');

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Credential is required' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) return res.status(400).json({ error: 'Invalid Google token' });

    const { sub: googleId, name, email } = payload;
    let username = name?.replace(/\s+/g, '').toLowerCase() || 'user' + Math.floor(Math.random() * 10000);

    let user = await prisma.user.findUnique({ where: { googleId } });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Create user if they don't exist
      // Make sure username is unique
      let isUnique = false;
      let suffix = '';
      while (!isUnique) {
        const existing = await prisma.user.findUnique({ where: { username: username + suffix } });
        if (existing) {
          suffix = Math.floor(Math.random() * 10000).toString();
        } else {
          isUnique = true;
          username = username + suffix;
        }
      }

      user = await prisma.user.create({
        data: {
          username,
          googleId,
          elo: 1200
        }
      });
    }

    const matchesWon = await prisma.match.count({ where: { winnerId: user.id } });
    const matchesPlayed = await prisma.match.count({ where: { players: { some: { id: user.id } } } });
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '12h' });
    
    res.json({ 
      id: user.id, username: user.username, elo: user.elo, 
      matchesWon, matchesPlayed, token, isNewUser, isAdmin: user.isAdmin
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

app.put('/api/auth/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  
  const token = authHeader.split(' ')[1] || authHeader;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { username } = req.body;
    
    if (!username) return res.status(400).json({ error: 'Username required' });
    if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
    
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== decoded.userId) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { username }
    });
    
    res.json({ success: true, username: user.username, isAdmin: user.isAdmin });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:userId/stats', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalUsers = await prisma.user.count();
    const rankNum = await prisma.user.count({ where: { elo: { gt: user.elo } } }) + 1;
    let globalRank = Math.ceil((rankNum / totalUsers) * 100);
    if (globalRank < 1) globalRank = 1;

    const acceptedSubmissions = await prisma.submission.findMany({
      where: { userId, status: 'Accepted' },
      select: { createdAt: true, problemId: true },
      orderBy: { createdAt: 'desc' }
    });

    const solvedProblems = new Set(acceptedSubmissions.map(s => s.problemId)).size;

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentDate = new Date(today);

    // Group submissions by day
    const solveDays = new Set(
      acceptedSubmissions.map(s => {
        const d = new Date(s.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    // Check if solved today, if not, check yesterday to keep streak active
    if (solveDays.has(currentDate.getTime())) {
      streak = 1;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() - 1);
      if (solveDays.has(currentDate.getTime())) {
        streak = 1;
        currentDate.setDate(currentDate.getDate() - 1);
      }
    }

    if (streak > 0) {
      while (solveDays.has(currentDate.getTime())) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
    }

    res.json({
      problemsSolved: solvedProblems,
      globalRank: `Top ${globalRank}%`,
      streak
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stats/global', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const uniqueSolves = await prisma.submission.findMany({
      where: {
        status: 'Accepted',
        createdAt: { gte: today }
      },
      distinct: ['userId', 'problemId'],
      select: { id: true }
    });
    const solvedToday = uniqueSolves.length;
    
    res.json({ solvedToday });
  } catch (error) {
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

app.get('/api/matches/:matchId/submissions', async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { matchId: req.params.matchId },
      orderBy: { id: 'desc' }, // Latest first
    });
    // Group by user and only get their latest submission
    const finalSubmissions: Record<string, any> = {};
    for (const sub of submissions) {
      if (!finalSubmissions[sub.userId]) {
        finalSubmissions[sub.userId] = sub;
      }
    }
    res.json(Object.values(finalSubmissions));
  } catch (error) {
    console.error('Match submissions error:', error);
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
        await prisma.match.update({
          where: { id: matchId },
          data: {
            status: 'COMPLETED',
            winnerId: winnerId,
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
  } else if (playerIds.length === 1) {
    const payload: MatchOverPayload = {
      matchId,
      winnerId: playerIds[0],
      loserId: null,
      winnerEloChange: 0,
      loserEloChange: 0,
      reason: 'Sandbox Completed!'
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
    
    if (job.data && job.data.type === 'submit' && job.data.problemId) {
      try {
        await prisma.submission.create({
          data: {
            userId: result.userId,
            problemId: job.data.problemId,
            matchId: !result.matchId.startsWith('solo') ? result.matchId : null,
            code: job.data.code,
            language: job.data.language,
            status: result.success ? "Accepted" : (result.results?.find(r => r.error)?.error ? "Runtime Error" : "Wrong Answer"),
          }
        });
      } catch (err) {
        console.error(`[Backend] Failed to save submission:`, err);
      }
    }

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

  socket.on(SOCKET_EVENTS.START_PRACTICE, async (payload: { userId: string, username: string }) => {
    payload.userId = socket.data.userId;
    
    // Helper to get random unsolved problem
    const getRandomUnsolvedProblem = async (userIds: string[]) => {
      const solvedMatches = await prisma.match.findMany({
        where: { winnerId: { in: userIds } },
        select: { problemId: true }
      });
      const solvedIds = new Set(solvedMatches.map(m => m.problemId));
      const problems = await prisma.problem.findMany();
      const unsolved = problems.filter(p => !solvedIds.has(p.id));
      if (unsolved.length > 0) return unsolved[Math.floor(Math.random() * unsolved.length)];
      return problems[Math.floor(Math.random() * problems.length)];
    };

    const randomProblem = await getRandomUnsolvedProblem([payload.userId]);
    const matchId = `solo-${Date.now()}`;
    const startTime = Date.now();
    
    // We don't save solo matches to the DB to keep them entirely separate from history and Elo
    activeMatches[matchId] = {
      matchId,
      problem: randomProblem,
      players: {
        [payload.userId]: { userId: payload.userId, socketId: socket.id, rating: 1200, score: 0, lastSubmitTime: 0, username: payload.username }
      }
      // No timer for Zen Mode Sandbox!
    };

    const startPayload: MatchStartPayload = { 
      matchId, 
      opponentId: 'practice', 
      startTime, 
      endTime: startTime + 31536000000, // 1 year timer (virtually infinite)
      problem: { 
        id: randomProblem.id, 
        title: randomProblem.title, 
        description: randomProblem.description, 
        defaultCode: randomProblem.defaultCode as any 
      } 
    };

    io.to(socket.id).emit(SOCKET_EVENTS.MATCH_FOUND, startPayload);
  });

  socket.on(SOCKET_EVENTS.SEND_EMOTE, (payload: { matchId: string, emote: string }) => {
    socket.to(payload.matchId).emit(SOCKET_EVENTS.RECEIVE_EMOTE, { emote: payload.emote });
  });

  // Private Match Handlers
  socket.on(SOCKET_EVENTS.CREATE_PRIVATE_MATCH, (payload: { userId: string, username: string, rating: number }) => {
    payload.userId = socket.data.userId;
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    privateRooms[roomCode] = {
      roomCode,
      creator: { userId: payload.userId, username: payload.username, socketId: socket.id, rating: payload.rating }
    };
    console.log(`[Socket] 🔒 User ${payload.userId} created private room: ${roomCode}`);
    io.to(socket.id).emit(SOCKET_EVENTS.PRIVATE_MATCH_CREATED, { roomCode });
  });

  socket.on(SOCKET_EVENTS.JOIN_PRIVATE_MATCH, async (payload: { userId: string, username: string, rating: number, roomCode: string }) => {
    payload.userId = socket.data.userId;
    const roomCode = payload.roomCode.toUpperCase();
    const room = privateRooms[roomCode];

    if (!room) {
      io.to(socket.id).emit(SOCKET_EVENTS.JOIN_PRIVATE_MATCH_ERROR, { error: 'Invalid room code or room no longer exists' });
      return;
    }

    if (room.creator.userId === payload.userId) {
      io.to(socket.id).emit(SOCKET_EVENTS.JOIN_PRIVATE_MATCH_ERROR, { error: 'You cannot join your own room' });
      return;
    }

    // Room found, let's match them!
    const opponent = room.creator;
    delete privateRooms[roomCode]; // Remove room once filled

    const matchId = `match-private-${Date.now()}-${roomCode}`;
    console.log(`[Socket] ⚔️ Private Match started: ${opponent.userId} vs ${payload.userId} (Room: ${roomCode})`);

    const startTime = Date.now();
    const endTime = startTime + MATCH_DURATION;

    // Helper to get random unsolved problem
    const getRandomUnsolvedProblem = async (userIds: string[]) => {
      const solvedMatches = await prisma.match.findMany({
        where: { winnerId: { in: userIds } },
        select: { problemId: true }
      });
      const solvedIds = new Set(solvedMatches.map(m => m.problemId));
      const problems = await prisma.problem.findMany();
      const unsolved = problems.filter(p => !solvedIds.has(p.id));
      
      if (unsolved.length > 0) {
        return unsolved[Math.floor(Math.random() * unsolved.length)];
      }
      return problems[Math.floor(Math.random() * problems.length)];
    };
    
    const randomProblem = await getRandomUnsolvedProblem([payload.userId, opponent.userId]);

    await prisma.match.create({
      data: {
        id: matchId,
        status: 'IN_PROGRESS',
        problemId: randomProblem.id,
        players: { connect: [{ id: payload.userId }, { id: opponent.userId }] }
      }
    });

    activeMatches[matchId] = {
      matchId,
      problem: randomProblem,
      players: {
        [payload.userId]: { userId: payload.userId, socketId: socket.id, rating: payload.rating, score: 0, lastSubmitTime: 0 },
        [opponent.userId]: { userId: opponent.userId, socketId: opponent.socketId, rating: opponent.rating, score: 0, lastSubmitTime: 0 }
      },
      timer: setTimeout(() => endMatch(matchId, 'Time expired'), MATCH_DURATION)
    };

    const startPayload1: MatchStartPayload = { matchId, opponentId: opponent.userId, opponentUsername: opponent.username, opponentRating: opponent.rating, startTime, endTime, problem: { id: randomProblem.id, title: randomProblem.title, description: randomProblem.description, defaultCode: randomProblem.defaultCode as any } };
    const startPayload2: MatchStartPayload = { matchId, opponentId: payload.userId, opponentUsername: payload.username, opponentRating: payload.rating, startTime, endTime, problem: { id: randomProblem.id, title: randomProblem.title, description: randomProblem.description, defaultCode: randomProblem.defaultCode as any } };

    // Notify both players
    io.to(socket.id).emit(SOCKET_EVENTS.MATCH_FOUND, startPayload1);
    io.to(opponent.socketId).emit(SOCKET_EVENTS.MATCH_FOUND, startPayload2);
  });

  socket.on(SOCKET_EVENTS.FIND_MATCH, async (payload: { userId: string, username: string, rating: number }) => {
    payload.userId = socket.data.userId; // Secure override
    console.log(`[Socket] 🔍 User ${payload.userId} (${payload.username}, Rating: ${payload.rating}) is looking for a match.`);

    // Helper to get random unsolved problem
    const getRandomUnsolvedProblem = async (userIds: string[]) => {
      const solvedMatches = await prisma.match.findMany({
        where: { winnerId: { in: userIds } },
        select: { problemId: true }
      });
      const solvedIds = new Set(solvedMatches.map(m => m.problemId));
      const problems = await prisma.problem.findMany();
      const unsolved = problems.filter(p => !solvedIds.has(p.id));
      
      if (unsolved.length > 0) {
        return unsolved[Math.floor(Math.random() * unsolved.length)];
      }
      return problems[Math.floor(Math.random() * problems.length)];
    };

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
      
      const randomProblem = await getRandomUnsolvedProblem([payload.userId, opponent.userId]);

      await prisma.match.create({
        data: {
          id: matchId,
          status: 'IN_PROGRESS',
          problemId: randomProblem.id,
          players: { connect: [{ id: payload.userId }, { id: opponent.userId }] }
        }
      });

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

      const startPayload1: MatchStartPayload = { matchId, opponentId: opponent.userId, opponentUsername: opponent.username, opponentRating: opponent.rating, startTime, endTime, problem: { id: randomProblem.id, title: randomProblem.title, description: randomProblem.description, defaultCode: randomProblem.defaultCode as any } };
      const startPayload2: MatchStartPayload = { matchId, opponentId: payload.userId, opponentUsername: payload.username, opponentRating: payload.rating, startTime, endTime, problem: { id: randomProblem.id, title: randomProblem.title, description: randomProblem.description, defaultCode: randomProblem.defaultCode as any } };

      // Notify both players
      io.to(socket.id).emit(SOCKET_EVENTS.MATCH_FOUND, startPayload1);
      io.to(opponent.socketId).emit(SOCKET_EVENTS.MATCH_FOUND, startPayload2);
    } else {
      // No match found immediately, add to queue
      matchmakingQueue.push({ userId: payload.userId, username: payload.username, rating: payload.rating, socketId: socket.id });

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
          
          const randomProblem = await getRandomUnsolvedProblem([player.userId]);
          
          await prisma.match.create({
            data: {
              id: matchId,
              status: 'IN_PROGRESS',
              problemId: randomProblem.id,
              players: { connect: [{ id: player.userId }] }
            }
          });

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

          io.to(player.socketId).emit(SOCKET_EVENTS.MATCH_FOUND, { matchId, opponentId: botId, startTime, endTime, problem: { id: randomProblem.id, title: randomProblem.title, description: randomProblem.description, defaultCode: randomProblem.defaultCode as any } });
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
      let problemId = activeMatches[payload.matchId]?.problem?.id;
      let testCases = activeMatches[payload.matchId]?.problem?.testCases || [];

      if (!problemId) {
         // In Daily Problem mode, matchId might be the problemId itself
         let searchId = payload.matchId;
         if (searchId === 'demo-match') searchId = 'two-sum';
         
         let problem = await prisma.problem.findUnique({
           where: { id: searchId }
         });
         
         if (!problem && searchId !== 'two-sum') {
            problem = await prisma.problem.findUnique({ where: { id: 'two-sum' } });
         }

         if (problem) {
            problemId = problem.id;
            testCases = problem.testCases as any[];
         } else {
            console.error(`[Socket] ❌ Could not find problem for matchId: ${payload.matchId}`);
            socket.emit(SOCKET_EVENTS.TEST_RESULT, { userId: payload.userId, success: false, results: [], error: 'Problem not found' });
            return;
         }
      }

      const job = await executionQueue.add('execute', {
        matchId: payload.matchId,
        userId: payload.userId,
        code: payload.code,
        language: payload.language,
        type: payload.type,
        problemId: problemId,
        testCases: testCases
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
