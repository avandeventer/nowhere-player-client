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
import { OutcomeStat } from 'src/assets/outcome-stat';

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
      
      getStory(selectedLocation: Location) {
        this.selectedLocation = selectedLocation;

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
              this.updateActivePlayerSession(this.playerStory, "", [], false);
              console.log('Player Story', this.playerStory);
            },
            error: (error) => {
              console.error('Error creating game', error);
            },
          });
        
      }

  private updateActivePlayerSession(
    playerStory: Story,
    selectedOptionId: String,
    outcomeDisplay: String[],
    nextPlayerTurn: boolean
  ) {
    console.log("Your player session", this.activePlayerSession);
    const newActivePlayerSession: ActivePlayerSession = new ActivePlayerSession();
    newActivePlayerSession.gameCode = this.gameCode;
    newActivePlayerSession.story = playerStory;
    newActivePlayerSession.playerId = this.player.authorId;
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
      this.outcomeDisplay.push(this.selectedOption.successText);
      this.selectedOption.failureResults.forEach(outcomeStat => {
        const statResult: String = "You lose " + outcomeStat.statChange + " " + outcomeStat.impactedStat.toLowerCase();
        this.outcomeDisplay.push(statResult)

        const playerOutcomeStatKey = outcomeStat.impactedStat.toLowerCase() as keyof Player;
        (this.player[playerOutcomeStatKey] as number) -= outcomeStat.statChange;
      });
    }

    this.updatePlayer();

    this.updateActivePlayerSession(
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

  nextPlayerTurn() {
    this.updateActivePlayerSession(
      new Story(), 
      "", 
      [],
      true
    );
    this.playerTurn = false;
  }
}