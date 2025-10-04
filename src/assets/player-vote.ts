export class PlayerVote {
    voteId: string;
    playerId: string;
    submissionId: string;
    ranking: number; // 1, 2, or 3

    constructor(playerId: string, submissionId: string, ranking: number) {
        this.voteId = "";
        this.playerId = playerId;
        this.submissionId = submissionId;
        this.ranking = ranking;
    }
}
  