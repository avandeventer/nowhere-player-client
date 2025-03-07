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
import { Ritual } from 'src/assets/ritual';
import { RitualOption } from 'src/assets/ritual-option';

@Component({
    selector: 'ritual',
    templateUrl: './ritual.component.html',
    imports: [MatButtonModule],
    standalone: true
})
export class RitualComponent implements OnInit {
    @Input() gameState: GameState = GameState.ROUND1;
    @Input() gameCode: string = "";
    @Input() player: Player = new Player();
    @Input() activePlayerSession: ActivePlayerSession = new ActivePlayerSession();
    @Output() playerDone = new EventEmitter<ComponentType>();
    ritual: Ritual = new Ritual();
    selectedRitualResponse: RitualOption = new RitualOption();

    constructor(private http:HttpClient) {}

    ngOnInit(): void {
        console.log("Rituals Loaded!" + this.activePlayerSession);
        this.getRitualJobs(this.gameCode);
    }

    getRitualJobs(gameCode: string) {
      const params = {
        gameCode: gameCode
      };
  
      console.log(params);
  
      this.http
      .get<Ritual>(environment.nowhereBackendUrl + HttpConstants.RITUAL_PATH + '?gameCode=' + this.gameCode)
        .subscribe({
          next: (response) => {
            this.ritual = response;
            console.log('Final ritual retrieved', this.ritual);
          },
          error: (error) => {
            console.error('Error retrieving ritual jobs', error);
          },
        });
    }

    selectRitualJob(ritualJobId: string) {
      const params = {
        gameCode: this.gameCode,
        ritualOptions:  [
          {
            optionId: ritualJobId,
            selectedByPlayerId: this.player.authorId
          }
        ]
      };
  
      console.log(params);
  
      this.http
      .put<RitualOption>(environment.nowhereBackendUrl + HttpConstants.RITUAL_PATH, params)
        .subscribe({
          next: (response) => {
            this.selectedRitualResponse = response;
            console.log('Final ritual retrieved', this.ritual);
          },
          error: (error) => {
            console.error('Error retrieving ritual jobs', error);
          },
        });
    }

    setNextPlayerTurn() {
      this.playerDone.emit(ComponentType.RITUAL);
    }
}