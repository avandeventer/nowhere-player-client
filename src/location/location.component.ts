import { HttpClient } from "@angular/common/http";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ActivePlayerSession } from "src/assets/active-player-session";
import { GameState } from "src/assets/game-state";
import { HttpConstants } from "src/assets/http-constants";
import { Player } from "src/assets/player";
import { Story } from "src/assets/story";
import { Location } from "src/assets/location";
import { environment } from "src/environments/environment";
import { ComponentType } from "src/assets/component-type";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";


@Component({
    selector: 'location',
    templateUrl: './location.component.html',
    imports: [MatButtonModule, MatIconModule],
    standalone: true
})
export class LocationComponent implements OnInit {
    @Input() gameState: GameState = GameState.ROUND1;
    @Input() gameCode: string = "";
    @Input() player: Player = new Player();
    @Input() activePlayerSession: ActivePlayerSession = new ActivePlayerSession();
    @Output() playerDone = new EventEmitter<ComponentType>();

    locations: Location[] = [];
    selectedStories: Story[] = [];
    locationsSelected: number = 0;
    isLocationsSelected: boolean = false;
    // selectedLocationOption: Option = new Option();
    // selectedLocation: Location = new Location();
    // playerStory: Story = new Story();
    // selectedOption: Option = new Option();
    // outcomeDisplay: String[] = [];
    // playerTurn: boolean = false;

    constructor(private http:HttpClient) {}

    ngOnInit(): void {
      this.getLocations(this.gameCode);
    }

    getLocations(gameCode: string) {
        const params = {
          gameCode: gameCode
        };
    
        console.log(params);
    
        this.http
        .get<Location[]>('https://nowhere-556057816518.us-east5.run.app/location', { params })
          .subscribe({
            next: (response) => {
              this.locations = response;
              console.log('Locations', this.locations);
            },
            error: (error) => {
              console.error('Error creating game', error);
            },
          });
    }

    getStory(selectedLocation: Location) {
        const params = {
          gameCode: this.gameCode,
          playerId: this.player.authorId,
          locationId: selectedLocation.locationId
        };
    
        console.log(params);
    
        this.http
        .get<Story>(environment.nowhereBackendUrl + HttpConstants.PLAYER_STORIES_PATH, { params })
          .subscribe({
            next: (response) => {
              console.log('Story retrieved!', response);
              this.selectedStories.push(response);
              this.locationsSelected++;

              if(this.selectedStories.length >= 2) {
                  this.playerDone.emit(ComponentType.LOCATION_SELECT);
                  this.isLocationsSelected = true;
              }
              console.log('Player Story', response);
            },
            error: (error) => {
              console.error('Error retrieving stories', error);
            },
          });
        
      }


}