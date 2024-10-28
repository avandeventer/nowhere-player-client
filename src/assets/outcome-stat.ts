import { Stat } from "./stat";

export class OutcomeStat {
    impactedStat: Stat
    statChange: number

    constructor() {
        this.impactedStat = Stat.CHARISMA;
        this.statChange = 0;
    }
}