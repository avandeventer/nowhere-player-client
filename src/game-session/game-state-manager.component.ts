import { Component, Input, OnInit } from '@angular/core';
import { GameService } from './game-session.service';

@Component({
  selector: 'game-state-listener',
  template: `
    @if("gameState") {
      <p>Game state has changed: {{ gameState }}</p>
    }
  `,
  standalone: true
})
export class GameStateListenerComponent implements OnInit {
  @Input() gameCode: string = "";
  gameState: string | null = null;

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.gameService.listenForGameStateChanges(this.gameCode).subscribe((newState) => {
      this.gameState = newState;
      console.log('New gameState:', newState);
    });
  }
}
