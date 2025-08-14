import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChange, SimpleChanges } from "@angular/core";
import { ActivePlayerSession } from "src/assets/active-player-session";
import { GameState } from "src/assets/game-state";
import { Player } from "src/assets/player";
import { Story } from 'src/assets/story';
import { environment } from 'src/environments/environment';
import { HttpConstants } from 'src/assets/http-constants';
import { ComponentType } from 'src/assets/component-type';
import { MatButtonModule } from '@angular/material/button';
import { Option } from 'src/assets/option';
import { ActivePlayerSessionService } from 'src/services/active-player-session.service';
import { MatCardModule } from '@angular/material/card';
import { RepercussionOutput } from 'src/assets/repercussion-output';

@Component({
    selector: 'ritual',
    templateUrl: './ritual.component.html',
    imports: [MatButtonModule, MatCardModule],
    standalone: true
})
export class RitualComponent implements OnInit {
    @Input() gameState: GameState = GameState.ROUND1;
    @Input() gameCode: string = "";
    @Input() player: Player = new Player();
    @Input() activePlayerSession: ActivePlayerSession = new ActivePlayerSession();
    @Output() playerDone = new EventEmitter<ComponentType>();
    rituals: Story[] = [];
    selectedRitualResponse: Option = new Option();
    isDone: boolean = false;
    playerTurn: boolean = false;
    outcomeDisplay: string[] = [];

    constructor(private http: HttpClient, private activePlayerSessionService: ActivePlayerSessionService) {}

    ngOnInit(): void {
        console.log("Rituals Loaded!", this.activePlayerSession);
    }

    ngOnChanges(changes: SimpleChanges): void {
      if (changes['activePlayerSession']) {
        if(this.activePlayerSession.playerId === this.player.authorId) {
          if(!this.playerTurn && !this.isDone) {
              this.playerTurn = true;
              this.getRitualJobs(this.gameCode);
          } 
        }
        else {
          this.playerTurn = false;
          this.rituals = []
          this.selectedRitualResponse = new Option();    
        }
      }
      
      const currentState = changes['gameState'] 
          ? changes['gameState'].currentValue : this.gameState;

      if (currentState !== GameState.RITUAL) {
        this.isDone = false;
      }
    }

    getRitualJobs(gameCode: string) {
      const params = {
        gameCode: gameCode
      };
  
      console.log(params);
  
      this.http
      .get<Story[]>(environment.nowhereBackendUrl + HttpConstants.RITUAL_PATH + '?gameCode=' + this.gameCode)
        .subscribe({
          next: (response) => {
            this.rituals = response;
            console.log('Final ritual retrieved', this.rituals);
          },
          error: (error) => {
            console.error('Error retrieving ritual jobs', error);
          },
        });
    }

    selectRitualJob(ritualJobId: string) {
      const ritualWithSelectedJob = {
        gameCode: this.gameCode,
        options:  [
          {
            optionId: ritualJobId,
            selectedByPlayerId: this.player.authorId
          }
        ]
      };
  
      console.log(ritualWithSelectedJob);
  
      this.http
      .put<Option>(environment.nowhereBackendUrl + HttpConstants.RITUAL_PATH, ritualWithSelectedJob)
        .subscribe({
          next: (response) => {
            this.selectedRitualResponse = response;
            const outcomeText = 
              this.selectedRitualResponse.playerSucceeded ?
              this.selectedRitualResponse.successText :
              this.selectedRitualResponse.failureText;

            this.outcomeDisplay = [
              this.selectedRitualResponse.attemptText,
              this.selectedRitualResponse.optionText,
              outcomeText, 
              this.selectedRitualResponse.successMarginText
            ];

            this.activePlayerSessionService.updateActivePlayerSession(
              this.gameCode,
              this.player.authorId,
              new Story(),
              this.selectedRitualResponse.optionId, 
              this.outcomeDisplay,
              false,
              "",
              [],
              new RepercussionOutput()
            ).subscribe({
              next: (updatedSession) => {
                console.log("Updated session:", updatedSession);
                this.activePlayerSession = updatedSession;
              },
              error: (err) => {
                console.error("Error:", err);
              }
            });        
            console.log('Final ritual retrieved', this.rituals);
          },
          error: (error) => {
            console.error('Error retrieving ritual jobs', error);
          },
        });
    }

    nextPlayerTurn() {
      this.activePlayerSessionService.updateActivePlayerSession(
        this.gameCode,
        this.player.authorId,
        new Story(), 
        "", 
        [],
        true,
        "",
        [],
        new RepercussionOutput()
      ).subscribe({
        next: (updatedSession) => {
          console.log("Updated session:", updatedSession);
          this.activePlayerSession = updatedSession;
        },
        error: (err) => {
          console.error("Error:", err);
        }
      });
;
      this.playerTurn = false;
      if(!this.isDone) {
        console.log('Player is done');
        this.isDone = true;
        this.playerDone.emit(ComponentType.RITUAL);
      }
    }
  }