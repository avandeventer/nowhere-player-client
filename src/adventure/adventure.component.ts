import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, SimpleChange, SimpleChanges } from "@angular/core";
import { ActivePlayerSession } from "src/assets/active-player-session";
import { GameState } from "src/assets/game-state";
import { Player } from "src/assets/player";
import { Location } from "src/assets/location";
import { Story } from 'src/assets/story';
import { Option } from 'src/assets/option';
import { environment } from 'src/environments/environment';
import { HttpConstants } from 'src/assets/http-constants';
import { Stat } from 'src/assets/stat';

@Component({
    selector: 'adventure',
    templateUrl: './adventure.component.html',
    standalone: true,
    imports: []
})
export class AdventureComponent implements OnInit {
    @Input() gameState: GameState = GameState.ROUND1;
    @Input() gameCode: string = "";
    @Input() player: Player = new Player();
    @Input() activePlayerSession: ActivePlayerSession = new ActivePlayerSession();

    locations: Location[] = [];
    selectedLocationOption: Option = new Option();
    selectedLocation: Location = new Location();
    playerStory: Story = new Story();
    selectedOption: Option = new Option();
    outcomeDisplay: String[] = [];
    playerTurn: boolean = false;

    constructor(private http:HttpClient) {}

    ngOnInit(): void {
      console.log("Adventure Loaded!" + this.activePlayerSession);
      this.getLocations(this.gameCode);
    }

    ngOnChanges(changes: SimpleChanges): void {
      if (changes['activePlayerSession'] 
      && changes['activePlayerSession'].currentValue?.playerId === this.player.authorId) {
        this.playerTurn = true;
      } else {
        this.selectedLocation = new Location();
        this.playerTurn = false;
        this.outcomeDisplay = [];
        this.selectedOption = new Option();
        this.selectedLocationOption = new Option();
      }
    }

    getLocations(gameCode: string) {
        const params = {
          gameCode: this.gameCode
        };
    
        console.log(params);
    
        this.http
        .get<Location[]>('https://nowhere-556057816518.us-east5.run.app/location', { params })
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
              this.playerStory = response;
              this.updateActivePlayerSession(this.player.authorId, this.playerStory, "", [], false);
              console.log('Player Story', this.playerStory);
            },
            error: (error) => {
              console.error('Error creating game', error);
            },
          });
        
      }

  private updateActivePlayerSession(
    playerId: String,
    playerStory: Story,
    selectedOptionId: String,
    outcomeDisplay: String[],
    nextPlayerTurn: boolean
  ) {
    console.log("Your player session", this.activePlayerSession);
    const newActivePlayerSession: ActivePlayerSession = new ActivePlayerSession();
    newActivePlayerSession.gameCode = this.gameCode;
    newActivePlayerSession.story = playerStory;
    newActivePlayerSession.playerId = playerId;
    newActivePlayerSession.playerChoiceOptionId = selectedOptionId;
    newActivePlayerSession.outcomeDisplay = outcomeDisplay;
    newActivePlayerSession.setNextPlayerTurn = nextPlayerTurn;

    this.http
      .put<ActivePlayerSession>(environment.nowhereBackendUrl + HttpConstants.ACTIVE_PLAYER_SESSION_PATH, newActivePlayerSession)
      .subscribe({
        next: (response) => {
          console.log('Active player session updated!', response);
        },
        error: (error) => {
          console.error('Error updating session', error);
        },
      });
  }

  pickOption(optionPicked: number) {
    console.log(optionPicked);
    this.selectedOption = this.playerStory.options[optionPicked];
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

    this.updateActivePlayerSession(
      this.player.authorId,
      this.playerStory, 
      this.selectedOption.optionId, 
      this.outcomeDisplay,
      false
    );

    console.log(this.selectedOption);
  }

  rollForSuccess(playerStat: number, dcToBeat: number): boolean {
    const diceRoll: number = Math.floor((Math.random() * 10) + 1);
    const playerTotal = diceRoll + playerStat;
    console.log("Dice roll: ", playerTotal, diceRoll);
    return playerTotal >= dcToBeat;
  }

  updatePlayer() {
    this.http
      .put<Player>(environment.nowhereBackendUrl + HttpConstants.PLAYER_PATH, this.player)
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
    this.updateActivePlayerSession(
      "",
      new Story(), 
      "", 
      [],
      true
    );
    this.playerTurn = false;
  }

  selectLocationOption(locationOptionIndex: number) {
    this.selectedLocationOption = this.selectedLocation.options[locationOptionIndex];

    this.selectedLocationOption.successResults.forEach(outcomeStat => {
      const playerOutcomeStatKey = outcomeStat.impactedStat.toLowerCase() as keyof Player;
      (this.player[playerOutcomeStatKey] as number) += outcomeStat.statChange;
    });

    this.updatePlayer();
    this.getStory(this.selectedLocation);
  }
}