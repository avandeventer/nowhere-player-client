import { PlayerStat } from "./player-stat";
import { Stat } from "./stat";

export class OutcomeStat {
    impactedStat: Stat
    statChange: number
    playerStat: PlayerStat

    constructor() {
        this.impactedStat = Stat.CHARISMA;
        this.statChange = 0;
        this.playerStat = new PlayerStat();
    }
}