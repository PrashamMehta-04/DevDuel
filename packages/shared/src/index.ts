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

export const SOCKET_EVENTS = {
  FIND_MATCH: 'find_match',
  MATCH_FOUND: 'match_found',
  MATCH_START: 'match_start',
  MATCH_OVER: 'match_over',
  JOIN_MATCH: 'join_match',
  CODE_UPDATE: 'code_update',
  SUBMIT_CODE: 'submit_code',
  TEST_RESULT: 'test_result',
  OPPONENT_TYPING: 'opponent_typing',
  OPPONENT_PROGRESS: 'opponent_progress',
  CREATE_PRIVATE_MATCH: 'match:create_private',
  PRIVATE_MATCH_CREATED: 'match:private_created',
  JOIN_PRIVATE_MATCH: 'match:join_private',
  JOIN_PRIVATE_MATCH_ERROR: 'match:join_private_error',

  START_PRACTICE: 'match:start_practice',
} as const;

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
  input?: string;
}

export interface SubmissionPayload {
  matchId: string;
  userId: string;
  code: string;
  language: string;
  type: 'run' | 'submit';
  problemId?: string;
  testCases?: any[]; // The tests to run against
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
  opponentUsername?: string;
  opponentRating?: number;
  startTime: number;
  endTime: number;
  problem?: {
    id: string;
    title: string;
    description: string;
    defaultCode?: Record<string, string>;
  };
}

export interface MatchOverPayload {
  matchId: string;
  winnerId: string | null;
  loserId: string | null;
  winnerEloChange: number;
  loserEloChange: number;
  reason: string;
}
