import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GameStateManagerComponent } from '../game-state-manager/game-state-manager.component';
import { Player } from 'src/assets/player';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { HttpConstants } from 'src/assets/http-constants';

@Component({
  selector: 'join-game',
  styles: `.btn { padding: 5px; }`,
  templateUrl: './join-game.component.html',
  standalone: true,
  imports: [GameStateManagerComponent, ReactiveFormsModule]
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

  ngOnInit() {
    console.log(this.gameSessionCreated);
  }

  setGameCode() {
    console.log(this.gameCode.value);
    this.gameCodeValue = this.gameCode.value === null ? '' : this.gameCode.value.toLocaleUpperCase();
  }

  joinGame() {
    const requestBody = {
      gameCode: this.gameCode.value,
      userName: this.userName.value,
    };

    this.http
      .post<Player>(environment.nowhereBackendUrl + HttpConstants.PLAYER_PATH, requestBody)
      .subscribe({
        next: (response) => {
          console.log('Player joined!', response);
          this.player = response;
          this.gameSessionCreated = true;
        },
        error: (error) => {
          console.error('Error creating game', error);
        },
      });
  }
}
