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
  phaseQuestion: string;
  phaseInstructions: string;
  collaborativeMode: CollaborativeMode;
  collaborativeModeInstructions: string;
  phaseType: PhaseType;
  showGameBoard?: boolean;
}

