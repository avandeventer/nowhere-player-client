import { Component, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GameStateManagerComponent } from '../game-state-manager/game-state-manager.component';
import { GameState } from 'src/assets/game-state';

@Component({
  selector: 'game-session',
  styles: `.btn { padding: 5px; }`,
  templateUrl: './game-session.component.html',
  standalone: true,
  imports: [GameStateManagerComponent]
})
export class GameSessionComponent {
  constructor(private http: HttpClient) {
    console.log('GameSessionComponent initialized');
  }

  // player: Player[] = new List();
  gameCode: string = '';
  userName: string = '';
  gameSessionCreated: boolean = false;

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
      .post('https://nowhere-556057816518.us-east5.run.app/player', requestBody)
      .subscribe({
        next: (response) => {
          console.log('Game created!', response);
          this.gameSessionCreated = true;
        },
        error: (error) => {
          console.error('Error creating game', error);
        },
      });
  }

  getPlayers(gameCode: string) {
    console.log('Your game code! ' + gameCode);
  }
}
