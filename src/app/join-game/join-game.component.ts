import { Component, OnInit } from '@angular/core';
import { Player } from 'src/assets/player';
import { GameSessionService } from 'src/services/game-session.service';
import { GameSession } from 'src/assets/GameSession';

@Component({
  selector: 'join-game',
  templateUrl: './join-game.component.html',
  styleUrls: ['./join-game.component.scss']
})
export class JoinGameComponent implements OnInit {

  constructor(private gameSessionService: GameSessionService) { }

  player: Player = new Player();
  gameCode: string;
  gameSession: GameSession;
  gameSessions;//: GameSession[];

  ngOnInit() {
    this.getGameSessions();
    // console.log(this.gameSessions);
    // console.log(this.gameSessions[0]);
    // console.log(this.gameSessions[1]);
    // console.log(this.gameSessions[2]);
  }

  setGameCode(gameCode: string) {
    this.gameCode = gameCode;
    console.log("Here it is! " + this.gameCode);
  }

  setPlayerName(playerName: string) {
    this.player.name = playerName;
    console.log("Your name! " + this.player.name);
  }

  getGameSessions = () =>
    this.gameSessionService
    .getGameSession()
    .subscribe(res =>{
      console.log("Data arriving!")
      console.log(res[0].payload)
      this.gameSessions = res;
    });

  joinGame(playerName: string, inputCode: string) {
    this.gameSessions.filter(session => {
      // console.log(session.payload.doc.data().gameSession.code);
      console.log("Foreach: "); 
      console.log(this.gameSessions);
      console.log(session.payload.doc.data().gameSession);
      if( session.payload.doc.data().gameSession.code === this.gameCode ) {
        console.log("A match!");
        session.payload.doc.data().gameSession.players.push(this.player);
        this.gameSessionService.updateGameSession(session);
      }
    })   
  }

}