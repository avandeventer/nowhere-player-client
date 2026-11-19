// Phase status on the game document (backend ActiveGameStateSession).
export interface ActiveGameStateSession {
    gameCode?: string;
    isPlayerDone?: { [authorId: string]: boolean };
    donePhase?: { [authorId: string]: string };
    // Who has submitted their own text in each writing phase, keyed "PHASE:round"
    submittedPlayers?: { [submissionKey: string]: string[] };
}

export function hasSubmittedInPhase(session: ActiveGameStateSession | null, phaseId: string, roundNumber: number, authorId: string): boolean {
    return !!session?.submittedPlayers?.[`${phaseId}:${roundNumber}`]?.includes(authorId);
}
