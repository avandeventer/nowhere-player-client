import { Player } from './player';

export class GameSession {
  id: number;
  code: String;
  players: any = [];

  constructor(id: number, code: String, players: Player[]) {
    this.id = id;
    this.code = code;
    this.players = players;
  }
}
