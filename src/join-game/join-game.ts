import { Component, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GameStateManagerComponent } from '../game-state-manager/game-state-manager.component';
import { Player } from 'src/assets/player';

@Component({
  selector: 'join-game',
  styles: `.btn { padding: 5px; }`,
  templateUrl: './join-game.component.html',
  standalone: true,
  imports: [GameStateManagerComponent]
})
export class JoinGameComponent {
  constructor(private http: HttpClient) {
    console.log('GoinGameComponent initialized');
  }

  gameCode: string = '';
  userName: string = '';
  gameSessionCreated: boolean = false;
  player: Player = new Player();

  ngOnInit() {
    console.log(this.gameSessionCreated);
  }

  setGameCode(gameCode: any) {
    this.gameCode = gameCode.target.value;
  }

  setUserName(userName: any) {
    this.userName = userName.target.value;
  }

  joinGame() {
    const requestBody = {
      gameCode: this.gameCode,
      userName: this.userName,
    };

    this.http
      .post<Player>('https://nowhere-556057816518.us-east5.run.app/player', requestBody)
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
