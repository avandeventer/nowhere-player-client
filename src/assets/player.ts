import { PlayerStat } from "./player-stat";

export class Player {
  userName: string;
  strength: number;
  intellect: number;
  charisma: number;
  dexterity: number;
  wealth: number;
  magic: number;
  favor: number;
  authorId: string;
  firstPlayer: boolean;
  playerStats: PlayerStat[];

  constructor() {
    this.userName = '';
    this.strength = 0;
    this.intellect = 0;
    this.charisma = 0;
    this.dexterity = 0;
    this.wealth = 0;
    this.magic = 0;
    this.favor = 0;
    this.authorId = "";
    this.firstPlayer = false;
    this.playerStats = [];
  }
}