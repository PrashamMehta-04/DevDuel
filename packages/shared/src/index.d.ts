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
export declare const SOCKET_EVENTS: {
    readonly FIND_MATCH: "find_match";
    readonly MATCH_FOUND: "match_found";
    readonly MATCH_START: "match_start";
    readonly MATCH_OVER: "match_over";
    readonly JOIN_MATCH: "join_match";
    readonly CODE_UPDATE: "code_update";
    readonly SUBMIT_CODE: "submit_code";
    readonly TEST_RESULT: "test_result";
    readonly OPPONENT_TYPING: "opponent_typing";
    readonly OPPONENT_PROGRESS: "opponent_progress";
};
export interface CodeUpdatePayload {
    matchId: string;
    userId: string;
    codeLength: number;
}
export interface ProgressUpdatePayload {
    matchId: string;
    userId: string;
    progress: number;
}
export interface TestResult {
    testCaseId: number;
    passed: boolean;
    output?: string;
    expected?: string;
    actual?: string;
    error?: string;
    executionTime: number;
    isHidden: boolean;
}
export interface SubmissionPayload {
    matchId: string;
    userId: string;
    code: string;
    language: string;
    type: 'run' | 'submit';
}
export interface SubmissionResultPayload {
    matchId: string;
    userId: string;
    success: boolean;
    type: 'run' | 'submit';
    results: TestResult[];
    overallProgress: number;
}
export interface MatchStartPayload {
    matchId: string;
    opponentId: string;
    startTime: number;
    endTime: number;
}
export interface MatchOverPayload {
    matchId: string;
    winnerId: string | null;
    loserId: string | null;
    winnerEloChange: number;
    loserEloChange: number;
    reason: string;
}
