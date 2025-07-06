import { Component, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GameStateManagerComponent } from '../game-state-manager/game-state-manager.component';
import { Player } from 'src/assets/player';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { HttpConstants } from 'src/assets/http-constants';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { GameState } from 'src/assets/game-state';
import { JoinGameCache } from 'src/assets/join-game-cache';

@Component({
    selector: 'join-game',
    templateUrl: './join-game.component.html',
    imports: [GameStateManagerComponent, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
    standalone: true
})
export class JoinGameComponent {
  constructor(private http: HttpClient) {
    console.log('GoinGameComponent initialized');
  }

  gameCode = new FormControl('');
  gameCodeValue: string = '';
  userName = new FormControl('');
  gameSessionCreated: boolean = false;
  player: Player = new Player();
  readonly CACHE_KEY = 'joinGameCache';
  readonly CACHE_DURATION_MS = 60 * 30 * 1000;

  ngOnInit() {
    console.log(this.gameSessionCreated);
    const cached = localStorage.getItem(this.CACHE_KEY);
    if (cached) {
      const parsed: JoinGameCache = JSON.parse(cached);
      const now = Date.now();
      const notExpired = now - parsed.timestamp < this.CACHE_DURATION_MS;
  
      if (notExpired) {
        this.gameCode.setValue(parsed.gameCode);
        this.userName.setValue(parsed.userName);
        this.gameCodeValue = parsed.gameCode;
        console.log('Loaded cached values:', parsed);
      } else {
        localStorage.removeItem(this.CACHE_KEY);
      }
    }  
  }

  setGameCode() {
    console.log(this.gameCode.value);
    this.gameCodeValue = this.gameCode.value === null ? '' : this.gameCode.value.trim().toLocaleUpperCase();
  }

  getPlayer() {
    const requestBody = {
      gameCode: this.gameCodeValue,
      userName: this.userName.value?.trim() || '',
    };

    this.http
      .post<Player>(environment.nowhereBackendUrl + HttpConstants.PLAYER_PATH, requestBody)
      .subscribe({
        next: (response) => {
          console.log('Player joined!', response);
          this.player = response;
          this.gameSessionCreated = true;
          this.cacheInputs(requestBody.gameCode, requestBody.userName);
        },
        error: (error) => {
          console.error('Error creating game', error);
        },
      });
  }

  private cacheInputs(gameCodeSubmitted: string, userNameSubmitted: string) {
    const cache: JoinGameCache = {
      gameCode: gameCodeSubmitted,
      userName: userNameSubmitted,
      timestamp: Date.now()
    };
    console.info('Values cached, ', cache.gameCode, cache.userName, cache.timestamp);
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
  }  

  @Input() refreshPlayer(gameState: GameState) {
    if (gameState === GameState.FINALE) {
      localStorage.removeItem(this.CACHE_KEY);
      console.log('Cache cleared due to FINALE');
    } else {
      this.getPlayer();
    }
  }
}
