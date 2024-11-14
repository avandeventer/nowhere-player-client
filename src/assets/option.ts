import { OutcomeStat } from "./outcome-stat";
import { Stat } from "./stat";

export class Option {
    optionId: string;
    optionText: string;
    attemptText: string;
    statRequirement: Stat;
    statDC: number;
    successText: string;
    failureText: string;
    successResults: OutcomeStat[];
    failureResults: OutcomeStat[];
    outcomeAuthorId: string;

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
    }
}