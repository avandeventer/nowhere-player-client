import { HttpClient } from "@angular/common/http";
import { OnInit, Input, Output, EventEmitter, SimpleChanges, Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { ActivePlayerSession } from "src/assets/active-player-session";
import { ComponentType } from "src/assets/component-type";
import { Ending } from "src/assets/ending";
import { GameState } from "src/assets/game-state";
import { HttpConstants } from "src/assets/http-constants";
import { Player } from "src/assets/player";
import { Story } from "src/assets/story";
import { environment } from "src/environments/environment";
import { ActivePlayerSessionService } from "src/services/active-player-session.service";

@Component({
    selector: 'ending',
    templateUrl: './ending.component.html',
    imports: [MatButtonModule],
    standalone: true
})
export class EndingComponent implements OnInit {
    @Input() gameState: GameState = GameState.ENDING;
    @Input() gameCode: string = "";
    @Input() player: Player = new Player();
    @Input() activePlayerSession: ActivePlayerSession = new ActivePlayerSession();
    @Output() playerDone = new EventEmitter<ComponentType>();
    playerEnding: Ending = new Ending();
    playerTurn: boolean = false;
    isDone: boolean = false;

    constructor(private http: HttpClient, private activePlayerSessionService: ActivePlayerSessionService) {}

    ngOnInit(): void {
        console.log("Active ending player session " + this.activePlayerSession);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['activePlayerSession']
        && changes['activePlayerSession']?.currentValue?.playerId === this.player.authorId) {
          if(!this.playerTurn && !this.isDone) {
            this.playerTurn = true;
            this.getPlayerEnding(this.player.authorId);
        }
        } else {
          this.playerTurn = false;
          this.playerEnding = new Ending();
        }
        
        const currentState = changes['gameState'] 
            ? changes['gameState'].currentValue : this.gameState;
  
        if (currentState !== GameState.ENDING) {
          this.isDone = false;
        }
      }  

    getPlayerEnding(playerId: string) {
        const params = {
          gameCode: this.gameCode,
          playerId: playerId,
        };
    
        console.log(params);
    
        this.http
          .get<Ending>(environment.nowhereBackendUrl + HttpConstants.PLAYER_ENDING_PATH, { params })
          .subscribe({
            next: (response) => {
              console.log('Ending retrieved!', response);
              this.playerEnding = response;

              this.activePlayerSessionService.updateActivePlayerSession(
                this.gameCode,
                this.player.authorId,
                new Story(),
                "", 
                [this.player.userName + "'s legacy:", this.playerEnding.endingBody],
                false,
                "",
                []
              ).subscribe({
                next: (updatedSession) => {
                  console.log("Updated session:", updatedSession);
                  this.activePlayerSession = updatedSession;
                },
                error: (err) => {
                  console.error("Error:", err);
                }
              });        
  
            },
            error: (error) => {
              console.error('Error retrieving ending', error);
            },
          });
      }

      nextPlayerTurn() {
        this.activePlayerSessionService.updateActivePlayerSession(
          this.gameCode,
          "",
          new Story(), 
          "", 
          [],
          true,
          "",
          []
        ).subscribe({
          next: (updatedSession) => {
            console.log("Updated session:", updatedSession);
            this.activePlayerSession = updatedSession;
          },
          error: (err) => {
            console.error("Error:", err);
          }
        });

        this.playerTurn = false;
        if(!this.isDone) {
          console.log('Player is done');
          this.isDone = true;
          this.playerDone.emit(ComponentType.ENDING);
        }
      }
}  