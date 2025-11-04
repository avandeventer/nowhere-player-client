import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild, ElementRef, AfterViewChecked, AfterViewInit } from "@angular/core";
import { ActivePlayerSession } from "src/assets/active-player-session";
import { GameState } from "src/assets/game-state";
import { Player } from "src/assets/player";
import { Location } from "src/assets/location";
import { Story } from 'src/assets/story';
import { Option } from 'src/assets/option';
import { environment } from 'src/environments/environment';
import { HttpConstants } from 'src/assets/http-constants';
import { ComponentType } from 'src/assets/component-type';
import { MatButtonModule } from '@angular/material/button';
import { ActivePlayerSessionService } from 'src/services/active-player-session.service';
import { Observable } from 'rxjs';
import {MatCardModule} from '@angular/material/card';
import { PrequelDisplayComponent } from 'src/prequel-story-display/prequel-story-display.component';
import { PlayerStat } from 'src/assets/player-stat';
import { RepercussionOutput } from 'src/assets/repercussion-output';
import { FormControl } from '@angular/forms';
import { RepercussionsComponent } from 'src/repercussions/repercussions.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'adventure',
    templateUrl: './adventure.component.html',
    styleUrls: ['./adventure.component.scss'],
    imports: [
      MatButtonModule, 
      MatCardModule, 
      PrequelDisplayComponent
  ],
  standalone: true
})
export class AdventureComponent implements OnInit {
    @Input() gameState: GameState = GameState.ROUND1;
    @Input() gameCode: string = "";
    @Input() player: Player = new Player();
    @Input() activePlayerSession: ActivePlayerSession = new ActivePlayerSession();
    @Output() playerDone = new EventEmitter<ComponentType>();
    @ViewChild('storyCard', { static: false }) storyCard!: ElementRef;

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
    isDone: boolean = false;
    locationLabel: string = "";
    locationOptionOne: string = "";
    locationOptionTwo: string = "";
    locationOutcomeDisplay: String[] = [];
    repercussionOutput: RepercussionOutput = new RepercussionOutput();
    repercussionsSubmitted: boolean = false;
    endingOptionOne = new FormControl();
    endingOptionTwo = new FormControl();
    loadStory: boolean = false;

    constructor(private activePlayerSessionService: ActivePlayerSessionService, private http: HttpClient, private dialog: MatDialog) {}

    ngOnInit(): void {
      console.log("Adventure Loaded!", this.activePlayerSession, this.player);
      this.tryInitializeTurn();
      setTimeout(() => this.scrollToBottom(), 0);
    }
          
    ngOnChanges(changes: SimpleChanges): void {
      const stateChanged = changes['gameState'];
      const playerSessionChanged = changes['activePlayerSession'];
    
      if (changes['selectedLocationOption'] || changes['selectedOption']) {
        setTimeout(() => this.scrollToBottom(), 0);
      }

      if (playerSessionChanged || stateChanged) {
        this.tryInitializeTurn();
      }
    
      if (stateChanged) {
        const currentState = stateChanged.currentValue ?? this.gameState;
        if (currentState !== GameState.ROUND1 && currentState !== GameState.ROUND2) {
          this.isDone = false;
        }
      }
    }

    private scrollToBottom(): void {
      try {
        if (this.storyCard !== undefined) {
          this.storyCard.nativeElement.scrollTop = this.storyCard.nativeElement.scrollHeight;
        }
      } catch (err) {
        console.error("Failed to scroll", err);
      }
    }

    private tryInitializeTurn(): void {
      if (this.activePlayerSession?.playerId !== this.player.authorId) {
        this.resetTurnState();
        return;
      }
    
      if (this.playerTurn || this.isDone) return;
    
      this.getLocations(this.gameCode).subscribe(locations => {
        this.locations = locations;
        this.setCurrentPlayerTurn();
      });
    }
      
    setLoadStory() {
      this.loadStory = true;

      this.activePlayerSessionService.updateActivePlayerSession(
        this.gameCode,
        this.player.authorId,
        this.location,
        this.playerStory, 
        "",
        [],
        false,
        this.activePlayerSession.selectedLocationOptionId,
        this.locationOutcomeDisplay,
        this.repercussionOutput
      ).subscribe({
        next: (updatedSession) => {
          console.log("Updated session:", updatedSession);
          this.activePlayerSession = updatedSession;
        },
        error: (err) => {
          console.error("Error:", err);
        }
      });
  
    }

    private resetTurnState() {
      this.selectedLocation = new Location();
      this.playerTurn = false;
      this.outcomeDisplay = [];
      this.selectedOption = new Option();
      this.selectedLocationOption = new Option();
      this.storyRetrieved = false;
      this.playerStories = [];
      this.locationOutcomeDisplay = [];
      this.loadStory = false;
      this.repercussionOutput = new RepercussionOutput();
    }

    private setCurrentPlayerTurn(): void {
      console.log("Setting current player turn");
      this.playerTurn = true;

      this.updatePlayerStats(this.player.authorId);

      if (this.activePlayerSession.outcomeDisplay.length != 0 || this.activePlayerSession.locationOutcomeDisplay.length != 0) {
        this.setCurrentTurnFromActivePlayerSession();
        return;
      }

      this.http.get<Story[]>(environment.nowhereBackendUrl + HttpConstants.PLAYER_STORIES_PLAYED_PATH, {
        params: { gameCode: this.gameCode, playerId: this.player.authorId }
      }).subscribe({
        next: (stories) => {
          console.log('Story retrieved!', stories);

          this.playerStories = stories;
          if (this.playerStories.length > 0) {
            this.playerStory = this.playerStories[0];
            const location = this.locations.find(location => location.id === this.playerStory.location.id);

            if (location) {
              this.location = location;
              this.playerStory.location = this.location;

              this.locationLabel = "You travel to the " + this.playerStory.location.label;
              this.locationOptionOne = this.playerStory.location.options[0].optionText;
              this.locationOptionTwo = this.playerStory.location.options[1].optionText;
              this.storyRetrieved = true;

              this.activePlayerSessionService.updateActivePlayerSession(
                  this.gameCode,
                  this.player.authorId,
                  this.location,
                  new Story(),
                  "",
                  [],
                  false,
                  "",
                  [],
                  this.repercussionOutput
                ).subscribe();
              }
            }
          },
          error: (err) => console.error('Error retrieving stories', err)
        }
      );
    }

  private setCurrentTurnFromActivePlayerSession() {
    this.outcomeDisplay = this.activePlayerSession.outcomeDisplay;

    this.locationOutcomeDisplay = this.activePlayerSession.locationOutcomeDisplay;
    this.playerStory = this.activePlayerSession.story;
    const location = this.locations.find(location => location.id === this.playerStory.location.id);

    if (location) {
      this.loadLocation(location);
    } else {
      this.http.get<Story[]>(environment.nowhereBackendUrl + HttpConstants.PLAYER_STORIES_PLAYED_PATH, {
        params: { gameCode: this.gameCode, playerId: this.player.authorId }
      }).subscribe({
        next: (stories) => {
          console.log('Story retrieved!', stories);

          this.playerStories = stories;
          if (this.playerStories.length > 0) {
            this.playerStory = this.playerStories[0];
          }

          this.loadLocation(this.playerStory.location);
        }
      });
    }
  }

  loadLocation (location: Location) {
    this.location = location;
    this.playerStory.location = this.location;
    this.selectedLocationOption = this.location.options[parseInt(this.activePlayerSession.selectedLocationOptionId.toString())];
    this.locationLabel = "You travel to the " + this.playerStory.location.label;
    this.locationOptionOne = this.playerStory.location.options[0].optionText;
    this.locationOptionTwo = this.playerStory.location.options[1].optionText;
    this.storyRetrieved = true;

    if (this.outcomeDisplay.length > 0) {
      this.loadStory = true;

      if (!this.activePlayerSession.repercussions.ending) {
        this.resolveStoryOutcomes(this.playerStory.playerSucceeded, this.player.authorId, this.selectedOption.optionId);
      }
    }

    this.repercussionOutput = this.activePlayerSession.repercussions;
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

  getLocations(gameCode: string): Observable<Location[]> {
    const params = { gameCode };
  
    return this.http.get<Location[]>(environment.nowhereBackendUrl + HttpConstants.LOCATION_PATH, { params });
  }
  
    
  getLocationTasks(selectedLocation: Location) {
    this.selectedLocation = selectedLocation;
  }

  pickOption(optionPicked: number) {
    console.log(optionPicked);
    this.selectedOption = this.playerStory.options[optionPicked];
    console.log("Player story at option select", this.playerStory);
    console.log("Selected Option", this.selectedOption);
    const dcStat: PlayerStat = this.selectedOption.playerStatDCs[0];
    const playerStat = this.player.playerStats.find(stat => stat.statType.id === dcStat.statType.id);

    if (playerStat) {
      const playerSucceeded: boolean = this.rollForSuccess(playerStat.value, dcStat.value);

      this.outcomeDisplay.push(this.selectedOption.attemptText);

      if(playerSucceeded) {
        this.outcomeDisplay.push(this.selectedOption.successText);
        this.selectedOption.successResults.forEach(outcome => {
            const statResult: String = `You ${outcome.playerStat.value  > 0 ? "gain +" : "lose "}${outcome.playerStat.value} ${outcome.playerStat.statType.label}`;
            this.outcomeDisplay.push(statResult);

            const impactedStatId = outcome.playerStat.statType.id;
            const playerStat = this.player.playerStats.find(stat => stat.statType.id === impactedStatId);
          
            if (playerStat) {
              playerStat.value += outcome.playerStat.value;
            } else {
              console.warn(`Stat not found on player for ID: ${impactedStatId}`);
            }

          });
      } else {
        this.outcomeDisplay.push(this.selectedOption.failureText);
        this.selectedOption.failureResults.forEach(outcome => {
          const statResult: String = `You ${outcome.playerStat.value  < 0 ? "gain +" + outcome.playerStat.value*-1 : "lose -" + outcome.playerStat.value} ${outcome.playerStat.statType.label}`;
          this.outcomeDisplay.push(statResult);

          const impactedStatId = outcome.playerStat.statType.id;
          const playerStat = this.player.playerStats.find(stat => stat.statType.id === impactedStatId);
        
          if (playerStat) {
            playerStat.value -= outcome.playerStat.value;
            if (playerStat.value < 0) {
              playerStat.value = 0;
            }
          } else {
            console.warn(`Stat not found on player for ID: ${impactedStatId}`);
          }
        });
      }

      this.updatePlayer();
      this.resolveStoryOutcomes(playerSucceeded, this.player.authorId, this.selectedOption.optionId);

      console.log(this.selectedOption);
    }
  }

  private updatePlayerTurnDisplay() {
    this.activePlayerSessionService.updateActivePlayerSession(
      this.gameCode,
      this.player.authorId,
      this.location,
      this.playerStory,
      this.selectedOption.optionId,
      this.outcomeDisplay,
      false,
      this.activePlayerSession.selectedLocationOptionId,
      this.locationOutcomeDisplay,
      this.repercussionOutput
    ).subscribe({
      next: (updatedSession) => {
        console.log("Updated session:", updatedSession);
        this.activePlayerSession = updatedSession;
      },
      error: (err) => {
        console.error("Error:", err);
      }
    });
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
          console.error('Error creating g2ame', error);
        },
      });
  }

  resolveStoryOutcomes(playerSucceeded: boolean, playerId: string, selectedOptionId: string) {
    this.playerStory.playerSucceeded = playerSucceeded;
    this.playerStory.playerId = playerId;
    this.playerStory.selectedOptionId = selectedOptionId;

    console.log('Updating story', this.playerStory);
    this.http
      .put<RepercussionOutput>(environment.nowhereBackendUrl + HttpConstants.ADVENTURE_REPERCUSSIONS_PATH, this.playerStory)
      .subscribe({
        next: (response) => {
          console.log('Player story updated!', response);
          this.repercussionOutput = response;
          this.activePlayerSessionService.updateActivePlayerSession(this.gameCode, this.player.authorId, this.location, this.playerStory, this.selectedOption.optionId,
            this.outcomeDisplay, false, this.activePlayerSession.selectedLocationOptionId, this.locationOutcomeDisplay, new RepercussionOutput()
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
          console.error('Error resolving outcomes', error);
        },
      });
  }

  openRepercussionsModal() {
    const favorStat: PlayerStat | undefined = this.player.playerStats.find(stat => stat.statType.favorType);

    if (favorStat === undefined) {
      throw new Error("There is no stat that currently influences the ending.");
    }

    if (this.activePlayerSession.repercussions.ending == null) {
      this.updatePlayerTurnDisplay();
    }

    const dialogRef = this.dialog.open(RepercussionsComponent, {
      width: '500px',
      data: {
        gameCode: this.gameCode,
        repercussionOutput: this.repercussionOutput,
        favorStatType: favorStat.statType
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Repercussions submitted:', result);
        this.repercussionOutput.ending = result.ending;
        this.updatePlayerTurnDisplay();
        this.repercussionsSubmitted = true;
      }
    });
  }

  nextPlayerTurn() {
    this.resetTurnState();
    this.activePlayerSessionService.updateActivePlayerSession(
      this.gameCode,
      this.player.authorId,
      new Location(),
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

    this.locationOutcomeDisplay.push(this.selectedLocationOption.attemptText);
    this.selectedLocationOption.successResults.forEach(outcome => {
      const impactedStatId = outcome.playerStat.statType.id;
      const playerStat = this.player.playerStats.find(stat => stat.statType.id === impactedStatId);
    
      if (playerStat) {
        playerStat.value += outcome.playerStat.value;
        this.locationOutcomeDisplay.push(`You gain ${outcome.playerStat.value} ${playerStat.statType.label} ${playerStat.statType.favorType ? "with " + playerStat.statType.favorEntity : ""}`);
      } else {
        console.warn(`Stat not found on player for ID: ${impactedStatId}`);
      }
    });

    this.activePlayerSessionService.updateActivePlayerSession(
      this.gameCode,
      this.player.authorId,
      this.location,
      new Story(), 
      "",
      [],
      false,
      locationOptionIndex.toString(),
      this.locationOutcomeDisplay,
      this.repercussionOutput
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