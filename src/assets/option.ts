import { Stat } from "./stat";

export class Option {
    optionId: string;
    optionText: string;
    attemptText: string;
    statRequirement: Stat;
    statDC: number;
    successText: string;

    constructor () {
        this.optionId = "";
        this.optionText = "";
        this.attemptText = "";
        this.statRequirement = Stat.CHARISMA;
        this.statDC = 0;
        this.successText = ""
    }
}