export interface User {
    id: string;
    username: string;
    elo: number;
}
export type MatchStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
export interface Match {
    id: string;
    players: string[];
    status: MatchStatus;
    problemId: string;
    winnerId?: string;
    createdAt: Date;
}
export interface SocketEvents {
    MATCH_FOUND: 'match_found';
    CODE_SUBMITTED: 'code_submitted';
    TEST_RESULT: 'test_result';
    OPPONENT_PROGRESS: 'opponent_progress';
}
