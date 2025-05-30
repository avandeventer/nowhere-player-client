import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChange, SimpleChanges } from "@angular/core";
import { ActivePlayerSession } from "src/assets/active-player-session";
import { GameState } from "src/assets/game-state";
import { Player } from "src/assets/player";
import { Location } from "src/assets/location";
import { Story } from 'src/assets/story';
import { Option } from 'src/assets/option';
import { environment } from 'src/environments/environment';
import { HttpConstants } from 'src/assets/http-constants';
import { Stat } from 'src/assets/stat';
import { ComponentType } from 'src/assets/component-type';
import { MatButtonModule } from '@angular/material/button';
import { ActivePlayerSessionService } from 'src/services/active-player-session.service';
import { Observable } from 'rxjs';
import {MatCardModule} from '@angular/material/card';
import { PrequelDisplayComponent } from 'src/prequel-story-display/prequel-story-display.component';

@Component({
    selector: 'adventure',
    templateUrl: './adventure.component.html',
    imports: [MatButtonModule, MatCardModule, PrequelDisplayComponent],
    standalone: true
})
export class AdventureComponent implements OnInit {
    @Input() gameState: GameState = GameState.ROUND1;
    @Input() gameCode: string = "";
    @Input() player: Player = new Player();
    @Input() activePlayerSession: ActivePlayerSession = new ActivePlayerSession();
    @Output() playerDone = new EventEmitter<ComponentType>();

    locations: Location[] = [];
    location: Location = new Location();
    selectedLocationOption: Option = new Option();
    selectedLocation: Location = new Location();
    playerStories: Story[] = [];
    playerStory: Story = new Story();
    selectedOption: Option = new Option();
    outcomeDisplay: String[] = [];
    playerTurn: boolean = false;
    storyRetrieved: boolean = true;
    currentStoryIndex: number = 0;
    isDone: boolean = false;
    locationLabel: string = "";
    locationOptionOne: string = "";
    locationOptionTwo: string = "";
    locationOutcomeDisplay: String[] = [];

    constructor(private activePlayerSessionService: ActivePlayerSessionService, private http: HttpClient) {}

    ngOnInit(): void {
      console.log("Adventure Loaded!" + this.activePlayerSession);
      this.getLocations(this.gameCode);
    }

    ngOnChanges(changes: SimpleChanges): void {
      if (changes['activePlayerSession']
      && changes['activePlayerSession']?.currentValue?.playerId === this.player.authorId) {
        if(!this.playerTurn && !this.isDone) {
          this.playerTurn = true;
          this.getStory();
          this.updatePlayerStats(this.player.authorId);
        }
      } else {
        this.selectedLocation = new Location();
        this.playerTurn = false;
        this.outcomeDisplay = [];
        this.selectedOption = new Option();
        this.selectedLocationOption = new Option();
        this.storyRetrieved = false;
        this.playerStories = [];
        this.locationOutcomeDisplay = [];
      }
      
      const currentState = changes['gameState'] 
          ? changes['gameState'].currentValue : this.gameState;

      if (currentState !== GameState.ROUND1 && currentState !== GameState.ROUND2) {
        this.isDone = false;
      }
    }

    updatePlayerStats(authorId: string) {
      this.http
        .get<Player>(environment.nowhereBackendUrl + HttpConstants.PLAYER_AUTHORID_PATH + '?gameCode=' + this.gameCode + '&authorId=' + authorId)
        .subscribe({
          next: (response) => {
            console.log('Player joined!', response);
            this.player = response;
          },
          error: (error) => {
            console.error('Error creating game', error);
          },
        });      
    }

    getLocations(gameCode: string) {
        const params = {
          gameCode: gameCode
        };
    
        console.log(params);
    
        this.http
        .get<Location[]>(environment.nowhereBackendUrl + HttpConstants.LOCATION_PATH, { params })
          .subscribe({
            next: (response) => {
              console.log('Stories retrieved!', response);
              this.locations = response;
              console.log('Locations', this.locations);
            },
            error: (error) => {
              console.error('Error creating game', error);
            },
          });
      }
      
    getLocationTasks(selectedLocation: Location) {
      this.selectedLocation = selectedLocation;
    }

    getStory() {
      const params = {
        gameCode: this.gameCode,
        playerId: this.player.authorId
      };
  
      console.log(params);
  
      this.http
      .get<Story[]>(environment.nowhereBackendUrl + HttpConstants.PLAYER_STORIES_PLAYED_PATH, { params })
        .subscribe({
          next: (response) => {
            console.log('Story retrieved!', response);
            this.playerStories = response;
            if(this.playerStories.length != 0) {
              this.playerStory = this.playerStories[this.currentStoryIndex];
              this.location = this.locations[this.playerStory.location.locationId];
              this.playerStory.location = this.location;
            }      
            console.log('Player Story', this.playerStory);
            this.storyRetrieved = true;
            if(this.playerStories.length > 0) {
              this.locationLabel = "You travel to the " + this.playerStory.location.label;
              this.locationOptionOne = this.playerStory.location.options[0].optionText;
              this.locationOptionTwo = this.playerStory.location.options[1].optionText;
              this.activePlayerSessionService.updateActivePlayerSession(this.gameCode, this.player.authorId, this.playerStory, "", [], false, "", [])
                .subscribe({
                  next: (updatedSession) => {
                    console.log("Updated session:", updatedSession);
                    this.activePlayerSession = updatedSession;
                  },
                  error: (err) => {
                    console.error("Error:", err);
                  }
                });
            }
            console.log('Player Stories', this.playerStories);
          },
          error: (error) => {
            console.error('Error retrieving stories', error);
          },
        });
  }

  pickOption(optionPicked: number) {
    console.log(optionPicked);
    this.selectedOption = this.playerStory.options[optionPicked];
    console.log("Player story at option select", this.playerStory);
    console.log("Selected Option", this.selectedOption);
    const statRequirement: Stat = this.selectedOption.statRequirement;
    const playerDCStatKey = statRequirement.toLowerCase() as keyof Player;
    const playerDCStatValue: number = +this.player[playerDCStatKey];
    const playerSucceeded: boolean = this.rollForSuccess(playerDCStatValue, this.selectedOption.statDC);

    this.outcomeDisplay.push(this.selectedOption.attemptText);

    if(playerSucceeded) {
      this.outcomeDisplay.push(this.selectedOption.successText);
      this.selectedOption.successResults.forEach(outcomeStat => {
        const statResult: String = "You gain " + outcomeStat.statChange + " " + outcomeStat.impactedStat.toLowerCase();
        this.outcomeDisplay.push(statResult);

        const playerOutcomeStatKey = outcomeStat.impactedStat.toLowerCase() as keyof Player;
        (this.player[playerOutcomeStatKey] as number) += outcomeStat.statChange;
      });
    } else {
      this.outcomeDisplay.push(this.selectedOption.failureText);
      this.selectedOption.failureResults.forEach(outcomeStat => {
        const statResult: String = "You lose " + outcomeStat.statChange + " " + outcomeStat.impactedStat.toLowerCase();
        this.outcomeDisplay.push(statResult)

        const playerOutcomeStatKey = outcomeStat.impactedStat.toLowerCase() as keyof Player;
        (this.player[playerOutcomeStatKey] as number) -= outcomeStat.statChange;
        if ((this.player[playerOutcomeStatKey] as number) <= 0) {
          (this.player[playerOutcomeStatKey] as number) = 0;
        }
      });
    }

    this.updatePlayer();
    this.updateStory(playerSucceeded, this.player.authorId, this.selectedOption.optionId);

    this.activePlayerSessionService.updateActivePlayerSession(
      this.gameCode,
      this.player.authorId,
      this.playerStory, 
      this.selectedOption.optionId, 
      this.outcomeDisplay,
      false,
      this.activePlayerSession.selectedLocationOptionId,
      this.locationOutcomeDisplay
    ).subscribe({
      next: (updatedSession) => {
        console.log("Updated session:", updatedSession);
        this.activePlayerSession = updatedSession;
      },
      error: (err) => {
        console.error("Error:", err);
      }
    });

    console.log(this.selectedOption);
  }

  rollForSuccess(playerStat: number, dcToBeat: number): boolean {
    const diceRoll: number = Math.floor((Math.random() * 4) + 1);
    const playerTotal = diceRoll + playerStat;
    console.log("Dice roll: ", playerTotal, diceRoll);
    return playerTotal >= dcToBeat;
  }

  updatePlayer() {
    this.http
      .put<Player>(environment.nowhereBackendUrl + HttpConstants.PLAYER_PATH, this.player)
      .subscribe({
        next: (response) => {
          console.log('Player updated!', response);
          this.player = response;
        },
        error: (error) => {
          console.error('Error creating game', error);
        },
      });
  }

  updateStory(playerSucceeded: boolean, playerId: string, selectedOptionId: string) {
    this.playerStory.playerSucceeded = playerSucceeded;
    this.playerStory.playerId = playerId;
    this.playerStory.selectedOptionId = selectedOptionId;

    console.log('Updating story', this.playerStory);
    this.http
      .put<Story>(environment.nowhereBackendUrl + HttpConstants.AUTHOR_STORIES_PATH, this.playerStory)
      .subscribe({
        next: (response) => {
          console.log('Player story updated!', response);
        },
        error: (error) => {
          console.error('Error creating game', error);
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
    this.storyRetrieved = false;
    if(this.playerStories.length <= 1 && !this.isDone) {
      console.log('Player is done');
      this.isDone = true;
      this.playerDone.emit(ComponentType.ADVENTURE);
    }
  }

  selectLocationOption(locationOptionIndex: number) {
    this.selectedLocationOption = this.location.options[locationOptionIndex];
    console.log("Selected location", this.selectedLocationOption, locationOptionIndex);

    this.selectedLocationOption.successResults.forEach(outcome => {
      const playerOutcomeStatKey = outcome.impactedStat.toLowerCase() as keyof Player;
      (this.player[playerOutcomeStatKey] as number) += outcome.statChange;
      this.locationOutcomeDisplay.push("You gain " + outcome.statChange + " " + outcome.impactedStat);
    });

    this.activePlayerSessionService.updateActivePlayerSession(
      this.gameCode,
      this.player.authorId,
      this.playerStory, 
      "",
      [],
      false,
      locationOptionIndex.toString(),
      this.locationOutcomeDisplay
    ).subscribe({
      next: (updatedSession) => {
        console.log("Updated session:", updatedSession);
        this.activePlayerSession = updatedSession;
      },
      error: (err) => {
        console.error("Error:", err);
      }
    });

    this.updatePlayer();
  }
}