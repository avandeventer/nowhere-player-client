import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { GameState } from 'src/assets/game-state';
import { Player } from 'src/assets/player';
import { Location } from 'src/assets/location';
import { Option } from 'src/assets/option';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComponentType } from 'src/assets/component-type';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { environment } from 'src/environments/environment';
import { HttpConstants } from 'src/assets/http-constants';
import { MatCardModule } from '@angular/material/card';
import { MatChipSet, MatChip } from '@angular/material/chips';
import { StatType } from 'src/assets/stat-type';

@Component({
  selector: 'write-location-outcomes',
  templateUrl: './write-location-outcomes.component.html',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatCardModule,
    MatChipSet,
    MatChip
  ],
  standalone: true
})
export class WriteLocationOutcomesComponent implements OnInit {
  @Input() gameState: GameState = GameState.WHAT_OCCUPATIONS_ARE_THERE;
  @Input() gameCode: string = "";
  @Input() player: Player = new Player();
  @Output() playerDone = new EventEmitter<ComponentType>();
  
  playerLocations: Location[] = [];
  currentLocationIndex: number = 0;
  playerOption: Option = new Option();
  otherOption: Option = new Option();

  attemptText = new FormControl('', [Validators.maxLength(150)]);
  submitBothOutcomes: boolean = false;

  numberOfOutcomesToWrite: number = 0;
  numberOfOutcomesWritten: number = 0;
  favorStat: StatType = new StatType();
  sideAgainstEntity: boolean = false;
  attemptPreview: string = "Ex. You spend some time helping the locals learn to scavenge better. You become better at foraging and become a better leader!";

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.currentLocationIndex = 0;
    this.getPlayerLocationOptions(this.player.authorId);
    this.setFavorStat(this.player);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gameState'] && !changes['gameState'].isFirstChange()) {
      const currentState = changes['gameState'].currentValue;

      if (currentState !== GameState.WHAT_OCCUPATIONS_ARE_THERE) {
        this.currentLocationIndex = 0;
      }
    }
  }

  getPlayerLocationOptions(authorId: string) {
    const params = {
      gameCode: this.gameCode,
      outcomeAuthorId: authorId,
    };

    console.log(params);

    this.http
      .get<Location[]>(environment.nowhereBackendUrl + HttpConstants.LOCATION_PATH, { params })
      .subscribe({
        next: (response) => {
          console.log('Locations retrieved!', response);
          this.playerLocations = response;
          this.numberOfOutcomesToWrite = this.playerLocations.length;

          this.setPlayerOption();
          console.log('Player locations', this.playerLocations);
        },
        error: (error) => {
          console.error('Error getting locations', error);
        },
      });
  }

  private setPlayerOption() {
    if (this.submitBothOutcomes) {
      const alreadySubmittedOutcome = this.playerOption;
      this.playerOption = this.otherOption;
      this.otherOption = alreadySubmittedOutcome;
      this.submitBothOutcomes = false;
      this.setSideAgainstEntity(this.playerOption);
    } else {
      this.playerLocations[this.currentLocationIndex].options.forEach(option => {
        if (option.outcomeAuthorId === this.player.authorId) {
          this.setSideAgainstEntity(option);
          if (this.playerOption.optionId === "") {
            this.playerOption = option;
            console.log("Player option: ", this.playerOption);
          } else {
            this.otherOption = option;
            this.submitBothOutcomes = true;
            console.log("Player option 2: ", this.otherOption);
          }
        } else {
          this.otherOption = option;
          console.log("Other option: ", this.otherOption);
        }
      })
    }
  }

  setSideAgainstEntity(option: Option) {
    const allResults = [...option.successResults, ...option.failureResults];
    const favorResults = allResults.filter(result => result.playerStat.statType.favorType);
    
    if (favorResults.some(result => result.playerStat.value < 0)) {
      this.sideAgainstEntity = true;
    }
  }

  submitWriting() {
    // This method is not used in this component - we use submit() instead
    this.submit();
  }

  submit() {
    this.submitOutcomes();
  }

  goBack() {
    this.numberOfOutcomesWritten--;
  }

  submitOutcomes() {
    const requestBody = {
      ...this.playerLocations[this.currentLocationIndex],
        options: [
          {
            optionId: this.playerOption.optionId,
            outcomeAuthorId: this.player.authorId,
            attemptText: this.attemptText.value
          },
          {
            optionId: this.otherOption.optionId
          }
        ]
    };

    this.http
      .put(environment.nowhereBackendUrl + HttpConstants.LOCATION_PATH + "?gameCode=" + this.gameCode, requestBody)
      .subscribe({
        next: (response) => {
          console.log('Location updated!', response);
          this.numberOfOutcomesWritten++;
          this.setNextLocationPrompt();
        },
        error: (error) => {
          console.error('Error updating location', error);
        },
      });
  }

  public canSubmit() {
    return this.attemptText.value && this.attemptText.value.trim().length > 0;
  }

  public canGoBack() {
    return this.numberOfOutcomesWritten > 0
      && this.currentLocationIndex < this.playerLocations.length;
  }

  public setNextLocationPrompt() {
    this.attemptText.reset('');

    if (!this.submitBothOutcomes) {
      this.currentLocationIndex++;
      this.playerOption = new Option();
      this.otherOption = new Option();
    }
   
    if (this.currentLocationIndex >= this.playerLocations.length) {
      this.playerDone.emit(ComponentType.WRITE_LOCATION_OUTCOMES);
    } else {
      this.setPlayerOption();
    }
    
    console.log(this.currentLocationIndex);
  }

  public statDCDifficulty() {
    let statDC: number = this.playerOption.playerStatDCs[0].value;
    if (statDC >= 7) {
      return "HARD";
    } else if (statDC < 7 && statDC >= 4) {
      return "NORMAL";
    } else {
      return "EASY";
    }
  }

  public setFavorStat(player: Player) {
    let favorStat: StatType | undefined = player
      .playerStats.find(stat => stat.statType.favorType)?.statType;

    if (favorStat !== undefined) {
      this.favorStat = favorStat;
    }
  }

  getCurrentOptionIndex(): number {
    return 0;
  }

  getOptionStats(optionIndex: number) {
    if (this.playerOption.successResults) {
      return this.playerOption.successResults.map(result => result.playerStat.statType);
    }
    return [];
  }

  getInstructionQuestionString() {
    return `How would your friend improve these skills if they decided to ${this.playerOption.optionText}?`;
  }
}
