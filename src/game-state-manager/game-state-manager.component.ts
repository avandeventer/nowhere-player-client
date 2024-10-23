import { Component, Input, OnInit } from '@angular/core';
import { GameService } from '../services/game-session.service';
import { HttpClient } from '@angular/common/http';
import { GameState } from 'src/assets/game-state';
import { WritePromptComponent } from 'src/write-prompt/write-prompt.component';
import { Player } from 'src/assets/player';
import { WriteOutcomesComponent } from 'src/write-options/write-outcomes.component';

@Component({
  selector: 'game-state-manager',
  templateUrl: './game-state-manager.component.html',
  standalone: true,
  imports: [WritePromptComponent, WriteOutcomesComponent]
})
export class GameStateManagerComponent implements OnInit {
  @Input() gameCode: string = "";
  @Input() player: Player = new Player();
  gameState: GameState = GameState.INIT;

  constructor(
    private gameService: GameService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.gameService.listenForGameStateChanges(this.gameCode).subscribe((newState) => {
      this.gameState = newState as unknown as GameState;
      
      console.log('New gameState:', this.gameState);
    });
  }

  startGame() {
    const requestBody = {
      gameCode: this.gameCode,
      gameState: GameState.START,
    };

    console.log(requestBody);

    this.http
      .put('https://nowhere-556057816518.us-east5.run.app/game', requestBody)
      .subscribe({
        next: (response) => {
          console.log('Game started!', response);
        },
        error: (error) => {
          console.error('Error started game', error);
        },
      });
  }

  isGameInitialized() {
    return this.gameState === GameState.INIT;
  }

  isGameStarted() {
    return this.gameState === GameState.WRITE_PROMPTS;
  }

  isGameInWriteOutcomesPhase() {
    return this.gameState === GameState.WRITE_OPTIONS;
  }
}
