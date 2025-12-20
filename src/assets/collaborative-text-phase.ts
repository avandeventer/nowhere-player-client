import { OutcomeType } from './outcome-type';
import { PlayerVote } from './player-vote';

export interface CollaborativeTextPhase {
  phaseId: string;
  question: string;
  phaseType: 'SUBMISSION' | 'VOTING';
  submissions: TextSubmission[];
  playerVotes: { [playerId: string]: PlayerVote[] };
  playersWhoSubmitted: string[];
  playersWhoVoted: string[];
  isComplete: boolean;
}

export interface TextSubmission {
  submissionId: string;
  authorId: string;
  originalText: string;
  currentText: string;
  additions: TextAddition[];
  createdAt: string;
  lastModified: string;
  isFinalized: boolean;
  totalVotes: number;
  averageRanking: number;
  outcomeType?: string; // "success", "neutral", or "failure" - used for WHAT_WILL_BECOME_OF_US phase
  outcomeTypeWithLabel?: OutcomeType;
}

export interface TextAddition {
  additionId: string;
  authorId: string;
  addedText: string;
  submissionId: string | null; // null for new submissions
  outcomeType?: string; // Optional: "success", "neutral", or "failure" - used for WHAT_WILL_BECOME_OF_US phase
}