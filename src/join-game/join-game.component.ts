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
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'join-game',
    templateUrl: './join-game.component.html',
    imports: [GameStateManagerComponent, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
    standalone: true
})
export class JoinGameComponent {
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
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
    
    this.loadGameCode();
  }

  private loadGameCode() {
    this.route.paramMap.subscribe(params => {
      const gameCodeParam = params.get('gameCode');
      if (gameCodeParam) {
        const pathGameCode = gameCodeParam.trim().toUpperCase();
        this.gameCode.setValue(pathGameCode);
        this.gameCodeValue = pathGameCode;
        console.log('Loaded gameCode from path parameter:', pathGameCode);
        
        this.handleGameCodeWithCache(pathGameCode);
      } else {
        this.handleGameCodeWithCache();
      }
    });
  }

  private handleGameCodeWithCache(pathGameCode?: string) {
    const cached = localStorage.getItem(this.CACHE_KEY);
    if (cached) {
      const parsed: JoinGameCache = JSON.parse(cached);
      const now = Date.now();
      const notExpired = now - parsed.timestamp < this.CACHE_DURATION_MS;
      
      if (notExpired && (pathGameCode === undefined || parsed.gameCode === pathGameCode)) {
        this.userName.setValue(parsed.userName);
        if (pathGameCode === undefined) {
          this.gameCode.setValue(parsed.gameCode);
          this.gameCodeValue = parsed.gameCode;
          console.log('Loaded gameCode from cache:', parsed.gameCode);
        }
        console.log('Using cached userName for same game code:', parsed.userName);
      } else {
        localStorage.removeItem(this.CACHE_KEY);
        console.log('Cleared cache due to different game code or expiration');
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
