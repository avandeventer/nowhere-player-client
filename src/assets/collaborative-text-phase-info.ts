import { GameState } from "./game-state";
import { Player } from "./player";
import { Story } from "./story";

export enum CollaborativeMode {
  RAPID_FIRE = 'RAPID_FIRE',
  SHARE_TEXT = 'SHARE_TEXT'
}

export enum PhaseType {
  SUBMISSION = 'SUBMISSION',
  VOTING = 'VOTING',
  WINNING = 'WINNING'
}

export interface CollaborativeTextPhaseInfo {
  phaseId: GameState;
  phaseQuestion: string;
  phaseInstructions: string;
  collaborativeMode: CollaborativeMode;
  collaborativeModeInstructions: string;
  phaseType: PhaseType;
  showGameBoard?: boolean;
  storyToIterateOn?: Story;
  locationVotingSubmissions?: { submissionId: string; currentText: string; outcomeType?: string }[];
  activePlayers?: Player[]
}

