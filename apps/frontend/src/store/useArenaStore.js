import { create } from 'zustand';
const LANGUAGES = [
    { id: 'python', name: 'Python', defaultCode: '# Write your Python code here\n\ndef solution():\n    pass' },
    { id: 'javascript', name: 'JavaScript', defaultCode: '// Write your JavaScript code here\n\nfunction solution() {\n    \n}' },
    { id: 'cpp', name: 'C++', defaultCode: '// Write your C++ code here\n#include <iostream>\n\nint main() {\n    return 0;\n}' },
    { id: 'java', name: 'Java', defaultCode: '// Write your Java code here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}' },
];
export const useArenaStore = create((set) => ({
    matchId: 'demo-match',
    userId: '',
    username: 'Guest',
    elo: 1200,
    matchesWon: 0,
    matchesPlayed: 0,
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
    matchEndTime: null,
    testResult: null,
    gameMode: 'solo',
    matchOverResult: null,
    setMatchId: (matchId) => set({ matchId }),
    setUserId: (userId) => set({ userId }),
    setUsername: (username) => set({ username }),
    setElo: (elo) => set({ elo }),
    setMatchesWon: (matchesWon) => set({ matchesWon }),
    setMatchesPlayed: (matchesPlayed) => set({ matchesPlayed }),
    setCode: (code) => set({ code }),
    setLanguage: (lang) => {
        const selected = LANGUAGES.find(l => l.id === lang);
        set({ language: lang, code: selected?.defaultCode || '' });
    },
    setOpponentProgress: (progress) => set({ opponentProgress: progress }),
    setIsOpponentTyping: (isOpponentTyping) => set({ isOpponentTyping }),
    setIsConnected: (isConnected) => set({ isConnected }),
    setMatchEndTime: (matchEndTime) => set({ matchEndTime }),
    setProblem: (problem) => set({ problem }),
    setTestResult: (testResult) => set({ testResult }),
    setGameMode: (gameMode) => set({ gameMode }),
    setMatchOverResult: (matchOverResult) => set({ matchOverResult }),
}));
//# sourceMappingURL=useArenaStore.js.map