import { Option } from "./option";

export class RitualOption extends Option {
    selectedByPlayerId: string;
    playerSucceeded: boolean;
    pointsRewarded: number;
    successMarginText: string;

    constructor() {
        super();
        this.selectedByPlayerId = "";
        this.playerSucceeded = false;
        this.pointsRewarded = 0;
        this.successMarginText = "";
    }
}
