import { OutcomeStat } from "./outcome-stat";
import { PlayerStat } from "./player-stat";
import { Stat } from "./stat";

export interface OutcomeFork {
    // minimal shape for OutcomeFork; expand fields as needed
    forkId?: string;
    description?: string;
}

export class Option {
    optionId: string;
    optionText: string;
    attemptText: string;
    statRequirement: Stat;
    playerStatDCs: PlayerStat[];
    statDC: number;
    successText: string;
    failureText: string;
    successResults: OutcomeStat[];
    failureResults: OutcomeStat[];
    outcomeAuthorId: string;
    selectedByPlayerId: string;
    playerSucceeded: boolean;
    pointsRewarded: number;
    successMarginText: string;
    outcomeForks: OutcomeFork[] = [];

    constructor () {
        this.optionId = "";
        this.optionText = "";
        this.attemptText = "";
        this.statRequirement = Stat.CHARISMA;
        this.statDC = 0;
        this.successText = "";
        this.failureText = "";
        this.successResults = [];
        this.failureResults = [];
        this.outcomeAuthorId = "";
        this.playerStatDCs = [];
        this.selectedByPlayerId = "";
        this.playerSucceeded = false;
        this.pointsRewarded = 0;
        this.successMarginText = "";
    }
}