import { StatType } from "./stat-type";

export class PlayerStat {
    statType: StatType;
    value: number;

    constructor () {
        this.statType = new StatType;
        this.value = 0;
    }
}