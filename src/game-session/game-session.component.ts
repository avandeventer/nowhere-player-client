import { Component, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GameSession } from 'src/assets/game-session';
import { Player } from 'src/assets/player';
import { GameStateListenerComponent } from './game-state-manager.component';

@Component({
  selector: 'game-session',
  styles: `.btn { padding: 5px; }`,
  templateUrl: './game-session.component.html',
  standalone: true,
  imports: [GameStateListenerComponent]
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
    console.log("Your gamecode input " + gameCode);
    console.log("Your gamecode " + this.gameCode);
  }

  setUserName(userName: any) {
    this.userName = userName.target.value;
    console.log("Your username input " + userName);
    console.log("Your username " + this.userName);
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
          // this.gameCode = response['gameCode'] || null;  // assuming 'gameCode' is in the response
          this.gameSessionCreated = true;
        },
        error: (error) => {
          console.error('Error creating game', error);
        },
      });
  }

  getPlayers(gameCode: string) {
    // this.player.name = playerName;
    console.log('Your game code! ' + gameCode);
  }
}
