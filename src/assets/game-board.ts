import { Encounter } from './encounter';
import { PlayerCoordinates } from './player-coordinates';

export interface GameBoard {
  dungeonGrid: { [key: string]: Encounter };
  playerCoordinates: PlayerCoordinates;
}

