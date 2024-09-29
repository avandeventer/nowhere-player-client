import { Component, OnInit } from '@angular/core';
import { GameService } from './game-session.service';

@Component({
  selector: 'app-game-state-listener',
  template: `
    <div *ngIf="gameState">
      Game state has changed: {{ gameState }}
    </div>
  `,
})
export class GameStateListenerComponent implements OnInit {
  gameState: string | null = null;

  constructor(private gameService: GameService) {}

  ngOnInit() {
    const gameCode = '1234';  // Replace this with the actual gameCode
    this.gameService.listenForGameStateChanges(gameCode).subscribe((newState) => {
      this.gameState = newState;
      console.log('New gameState:', newState);
    });
  }
}
