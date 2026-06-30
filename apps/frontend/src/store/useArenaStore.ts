import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ArenaState {
  matchId: string;
  userId: string;
  username: string;
  elo: number;
  matchesWon: number;
  matchesPlayed: number;
  code: string;
  language: string;
  supportedLanguages: { id: string; name: string; defaultCode: string }[];
  problem: {
    id?: string;
    title: string;
    description: string;
    defaultCode?: Record<string, string>;
  };
  opponentProgress: number;
  isOpponentTyping: boolean;
  isConnected: boolean;
  matchEndTime: number | null;
  setMatchId: (id: string) => void;
  setUserId: (id: string) => void;
  setUsername: (username: string) => void;
  setElo: (elo: number) => void;
  setMatchesWon: (won: number) => void;
  setMatchesPlayed: (played: number) => void;
  setCode: (code: string) => void;
  setLanguage: (lang: string) => void;
  setOpponentProgress: (progress: number) => void;
  setIsOpponentTyping: (isTyping: boolean) => void;
  setIsConnected: (connected: boolean) => void;
  setMatchEndTime: (time: number | null) => void;
  setProblem: (problem: { title: string; description: string; defaultCode?: Record<string, string> }) => void;
  testResult: any | null;
  setTestResult: (result: any | null) => void;
  gameMode: 'solo' | 'battle';
  setGameMode: (mode: 'solo' | 'battle') => void;
  matchOverResult: any | null;
  setMatchOverResult: (result: any | null) => void;
  isExecuting: boolean;
  setIsExecuting: (isExecuting: boolean) => void;
  loadSubmission: (language: string, code: string) => void;
}

const LANGUAGES = [
  { id: 'python', name: 'Python', defaultCode: 'import sys, math, collections, itertools, heapq, bisect, string, re\n\n# Write your Python code here\n\ndef solution():\n    pass' },
  { id: 'javascript', name: 'JavaScript', defaultCode: '// Built-in methods are available (Math, Array, Object, etc.)\n// Write your JavaScript code here\n\nfunction solution() {\n    \n}' },
  { id: 'cpp', name: 'C++', defaultCode: '// Write your C++ code here\n#include <bits/stdc++.h>\n\nusing namespace std;\n\nvector<int> solution(vector<int>& nums, int target) {\n    \n}' },
  { id: 'java', name: 'Java', defaultCode: '// Write your Java code here\nimport java.util.*;\nimport java.io.*;\n\npublic class Solution {\n    public int[] solution(int[] nums, int target) {\n        \n    }\n}' },
];

export const useArenaStore = create<ArenaState>()(
  persist(
    (set, get) => ({
      matchId: 'demo-match',
      userId: '',
      username: 'Guest',
      elo: 1200,
      matchesWon: 0,
      matchesPlayed: 0,
      code: 'def solution(nums, target):\n    # Write your code here\n    pass',
      language: 'python',
      supportedLanguages: LANGUAGES,
      problem: {
        id: 'two-sum',
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        defaultCode: {
          python: 'import sys, math, collections, itertools, heapq, bisect, string, re\n\ndef solution(nums, target):\n    # Write your code here\n    pass',
          javascript: '// Built-in methods are available (Math, Array, Object, etc.)\n\nfunction solution(nums, target) {\n    // Write your code here\n    \n}',
          cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> solution(vector<int>& nums, int target) {\n    // Write your code here\n    \n}',
          java: 'import java.util.*;\nimport java.io.*;\n\npublic class Solution {\n    public int[] solution(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n}'
        }
      },
      opponentProgress: 0,
      isOpponentTyping: false,
      isConnected: false,
      matchEndTime: null,
      testResult: null,
      gameMode: 'solo',
      matchOverResult: null,
      isExecuting: false,
      setMatchId: (matchId) => set({ matchId }),
      setUserId: (userId) => set({ userId }),
      setUsername: (username) => set({ username }),
      setElo: (elo) => set({ elo }),
      setMatchesWon: (matchesWon) => set({ matchesWon }),
      setMatchesPlayed: (matchesPlayed) => set({ matchesPlayed }),
      setCode: (code) => set({ code }),
      setLanguage: (lang) => {
        const problem = get().problem;
        const code = problem.defaultCode?.[lang] || LANGUAGES.find(l => l.id === lang)?.defaultCode || '';
        set({ language: lang, code });
      },
      setOpponentProgress: (progress) => set({ opponentProgress: progress }),
      setIsOpponentTyping: (isOpponentTyping) => set({ isOpponentTyping }),
      setIsConnected: (isConnected) => set({ isConnected }),
      setMatchEndTime: (matchEndTime) => set({ matchEndTime }),
      setProblem: (problem) => {
        const lang = get().language;
        const code = problem.defaultCode?.[lang] || LANGUAGES.find(l => l.id === lang)?.defaultCode || '';
        set({ problem, code });
      },
      setTestResult: (testResult) => set({ testResult, isExecuting: false }),
      setGameMode: (gameMode) => set({ gameMode }),
      setMatchOverResult: (matchOverResult) => set({ matchOverResult, isExecuting: false }),
      setIsExecuting: (isExecuting) => set({ isExecuting }),
      loadSubmission: (language, code) => set({ language, code }),
    }),
    {
      name: 'devduel-auth',
      partialize: (state) => ({
        userId: state.userId,
        username: state.username,
        elo: state.elo,
        matchesWon: state.matchesWon,
        matchesPlayed: state.matchesPlayed,
      }),
    }
  )
);
