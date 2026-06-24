interface ArenaState {
    matchId: string;
    userId: string;
    username: string;
    elo: number;
    matchesWon: number;
    matchesPlayed: number;
    code: string;
    language: string;
    supportedLanguages: {
        id: string;
        name: string;
        defaultCode: string;
    }[];
    problem: {
        title: string;
        description: string;
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
    setProblem: (problem: {
        title: string;
        description: string;
    }) => void;
    testResult: any | null;
    setTestResult: (result: any | null) => void;
    gameMode: 'solo' | 'battle';
    setGameMode: (mode: 'solo' | 'battle') => void;
    matchOverResult: any | null;
    setMatchOverResult: (result: any | null) => void;
}
export declare const useArenaStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ArenaState>>;
export {};
