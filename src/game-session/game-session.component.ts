import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatInputModule } from '@angular/material/input';
import { GameStateManagerComponent } from '../game-state-manager/game-state-manager.component';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'game-session',
  styles: `.btn { padding: 5px; }`,
  templateUrl: './game-session.component.html',
  standalone: true,
  imports: [GameStateManagerComponent, FormsModule, MatFormFieldModule, MatInputModule]
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
