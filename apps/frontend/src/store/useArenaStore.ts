import { create } from 'zustand';

interface ArenaState {
  matchId: string;
  userId: string;
  code: string;
  language: string;
  supportedLanguages: { id: string; name: string; defaultCode: string }[];
  problem: {
    title: string;
    description: string;
  };
  opponentProgress: number;
  isOpponentTyping: boolean;
  isConnected: boolean;
  setMatchId: (id: string) => void;
  setUserId: (id: string) => void;
  setCode: (code: string) => void;
  setLanguage: (lang: string) => void;
  setOpponentProgress: (progress: number) => void;
  setIsOpponentTyping: (isTyping: boolean) => void;
  setIsConnected: (connected: boolean) => void;
  testResult: any | null;
  setTestResult: (result: any | null) => void;
  gameMode: 'solo' | 'battle';
  setGameMode: (mode: 'solo' | 'battle') => void;
  matchOverResult: any | null;
  setMatchOverResult: (result: any | null) => void;
}

const LANGUAGES = [
  { id: 'python', name: 'Python', defaultCode: '# Write your Python code here\n\ndef solution():\n    pass' },
  { id: 'javascript', name: 'JavaScript', defaultCode: '// Write your JavaScript code here\n\nfunction solution() {\n    \n}' },
  { id: 'cpp', name: 'C++', defaultCode: '// Write your C++ code here\n#include <iostream>\n\nint main() {\n    return 0;\n}' },
  { id: 'java', name: 'Java', defaultCode: '// Write your Java code here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}' },
];

export const useArenaStore = create<ArenaState>((set) => ({
  matchId: 'demo-match',
  userId: `user-${Math.floor(Math.random() * 1000)}`,
  code: LANGUAGES[0].defaultCode,
  language: LANGUAGES[0].id,
  supportedLanguages: LANGUAGES,
  problem: {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
  },
  opponentProgress: 0,
  isOpponentTyping: false,
  isConnected: false,
  testResult: null,
  gameMode: 'solo',
  matchOverResult: null,
  setMatchId: (matchId) => set({ matchId }),
  setUserId: (userId) => set({ userId }),
  setCode: (code) => set({ code }),
  setLanguage: (lang) => {
    const selected = LANGUAGES.find(l => l.id === lang);
    set({ language: lang, code: selected?.defaultCode || '' });
  },
  setOpponentProgress: (progress) => set({ opponentProgress: progress }),
  setIsOpponentTyping: (isOpponentTyping) => set({ isOpponentTyping }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setTestResult: (testResult) => set({ testResult }),
  setGameMode: (gameMode) => set({ gameMode }),
  setMatchOverResult: (matchOverResult) => set({ matchOverResult }),
}));
