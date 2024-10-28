import { ActivePlayerSession } from './active-player-session';
import { Player } from './player';

export class GameSession {
  id: number;
  code: String;
  activePlayerSession: ActivePlayerSession;
  players: any = [];

  constructor(id: number, code: String, players: Player[], activePlayerSession: ActivePlayerSession) {
    this.id = id;
    this.code = code;
    this.players = players;
    this.activePlayerSession = activePlayerSession;
  }
}
