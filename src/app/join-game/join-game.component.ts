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

  player: Player = {} as Player;
  gameCode: string;
  gameSession: GameSession;
  gameSessions;

  ngOnInit() {
    this.getGameSessions();
  }

  setGameCode(gameCode: string) {
    this.gameCode = gameCode;
  }

  setPlayerName(playerName: string) {
    this.player.name = playerName;
  }

  getGameSessions = () =>
    this.gameSessionService
    .getGameSession()
    .subscribe(res =>{
      console.log(res[0].payload)
      this.gameSessions = res;
    });

  joinGame(playerName: string, inputCode: string) {
    this.gameSessions.filter(session => {
      if( session.payload.doc.data().gameSession.code === this.gameCode ) {
        // const sessionObject = session.payload.doc.data().gameSession;
        // const gameSession = new GameSession(sessionObject.id, sessionObject.code, sessionObject.players);  
        console.log("A match!");
        console.log(this.player);
        console.log("Players " + session.payload.doc.data().gameSession.players);
        // session.payload.doc.data().gameSession.players = [];
        // const players: Player[] = session.payload.doc.data().gameSession.players;
        const gameSession: GameSession = session.payload.doc.data().gameSession;
        gameSession.id = session.payload.doc.data().gameSession.id;
        // session.payload.doc.data().gameSession.players.push(playerName);
        gameSession.players.push(new Player(playerName));
        console.log("Game session after push " + JSON.stringify(gameSession));
        // session.payload.doc.data().gameSession.players = players;
        // console.log("Players after assignment " + JSON.stringify(gameSession.players));
        this.gameSessionService.updateGameSession(gameSession, session.payload.doc.id);
      }
    })   
  }

}