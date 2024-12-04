import { Component, Input, OnInit } from '@angular/core';
import { GameService } from '../services/game-session.service';
import { HttpClient } from '@angular/common/http';
import { GameState } from 'src/assets/game-state';
import { WritePromptComponent } from 'src/write-prompt/write-prompt.component';
import { Player } from 'src/assets/player';
import { WriteOutcomesComponent } from 'src/write-options/write-outcomes.component';
import { ActivePlayerSession } from 'src/assets/active-player-session';
import { AdventureComponent } from 'src/adventure/adventure.component';
import { HttpConstants } from 'src/assets/http-constants';
import { environment } from 'src/environments/environment';
import { LocationComponent } from 'src/location/location.component';
import { ComponentType, ComponentTypeGameStateMap } from 'src/assets/component-type';

@Component({
  selector: 'game-state-manager',
  templateUrl: './game-state-manager.component.html',
  standalone: true,
  imports: [WritePromptComponent, WriteOutcomesComponent, AdventureComponent, LocationComponent]
})
export class GameStateManagerComponent implements OnInit {
  @Input() gameCode: string = "";
  @Input() player: Player = new Player();
  @Input() setDone(donePhase: ComponentType) {
    if(this.isValidGameState(donePhase, this.gameState)) {
      console.log('Player is done', donePhase, this.gameState)
      this.playerIsDone();
    } else {
      console.log('Skipped done event for component type with game phase', donePhase, this.gameState)
    }
  }
  gameState: GameState = GameState.INIT;
  activePlayerSession: ActivePlayerSession = new ActivePlayerSession();

  constructor(
    private gameService: GameService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.gameService.listenForGameStateChanges(this.gameCode).subscribe((newState) => {
      this.gameState = newState.gameState as unknown as GameState;
      this.activePlayerSession = newState.activePlayerSession as unknown as ActivePlayerSession;
      
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

  playerIsDone() {
    const url = `${environment.nowhereBackendUrl}${HttpConstants.ACTIVE_GAME_STATE_SESSION_PATH}?gameCode=${this.gameCode}&authorId=${this.player.authorId}&isDone=${true}`;

    console.log("Player is done ", this.gameState);

    this.http
      .put(url, {})
      .subscribe({
        next: (response) => {
          console.log('Player done triggered!', response);
        },
        error: (error) => {
          console.error('Error updating player done status', error);
        },
      });
  }

  isValidGameState (component: ComponentType, state: GameState): boolean {
    return ComponentTypeGameStateMap[component].includes(state);
  };

  isGameInitialized() {
    return this.gameState === GameState.INIT;
  }

  isGameStarted() {
    return this.gameState === GameState.WRITE_PROMPTS || this.gameState === GameState.WRITE_PROMPTS_AGAIN;
  }

  isLocationSelect() {
    return this.gameState === GameState.LOCATION_SELECT || this.gameState === GameState.LOCATION_SELECT_AGAIN;
  }

  isGameInWriteOutcomesPhase() {
    return this.gameState === GameState.WRITE_OPTIONS || this.gameState === GameState.WRITE_OPTIONS_AGAIN;
  }

  isGameInAdventurePhase() {
    return this.gameState === GameState.ROUND1 || this.gameState === GameState.ROUND2;
  }
}
