import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { GameState } from 'src/assets/game-state';
import { Player } from 'src/assets/player';
import { ResponseObject } from 'src/assets/response-object';
import { Story } from 'src/assets/story';
import { Option } from 'src/assets/option';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PrequelDisplayComponent } from 'src/prequel-story-display/prequel-story-display.component';
import { ComponentType } from 'src/assets/component-type';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { environment } from 'src/environments/environment';
import { HttpConstants } from 'src/assets/http-constants';
import {MatCardModule} from '@angular/material/card';
import { MatChipSet, MatChip } from '@angular/material/chips'
import { StatType } from 'src/assets/stat-type';

@Component({
    selector: 'write-outcomes',
    templateUrl: './write-outcomes.component.html',
    imports: [
      ReactiveFormsModule, 
      PrequelDisplayComponent,
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
export class WriteOutcomesComponent implements OnInit {
  @Input() gameState: GameState = GameState.WRITE_OPTIONS;
  @Input() gameCode: string = "";
  @Input() player: Player = new Player();
  @Output() playerDone = new EventEmitter<ComponentType>();
  playerStories: Story[] = [];
  currentStoryIndex: number = 0;
  playerOption: Option = new Option();
  otherOption: Option = new Option();

  optionSuccess = new FormControl('', [Validators.maxLength(150)]);
  optionFailure = new FormControl('', [Validators.maxLength(150)]);
  submitBothOutcomes: boolean = false;
  outcomeOneSubmitted: boolean = false;

  numberOfOutcomesToWrite: number = 0;
  numberOfOutcomesWritten: number = 0;
  favorStat: StatType = new StatType();
  sideAgainstEntity: boolean = false;
  optionOnePreview: string = "Ex (if you were to gain charisma). You leap over the chasm to the sound of applause! Your heroism makes you very popular!"
  optionTwoPreview: string = "Ex (if you were to lose dexterity). You try to jump the chasm, but you fail and fall a long distance and crack your butt bones. You can't run as fast anymore."
  
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.currentStoryIndex = 0;
    this.getPlayerStoryOptions(this.player.authorId);
    this.setFavorStat(this.player);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gameState'] && !changes['gameState'].isFirstChange()) {
      const currentState = changes['gameState'].currentValue;

      // TODO: Reimplement when timer is readded - Auto submits outcomes
      // if ((currentState === GameState.ROUND1 || currentState === GameState.ROUND2)
      //     && !(this.currentStoryIndex >= this.playerStories.length)
      // ) {
      //   this.submitOutcomes();
      // }

      if (currentState !== GameState.WRITE_OPTIONS && currentState !== GameState.WRITE_OPTIONS_AGAIN) {
        this.currentStoryIndex = 0;
      }

    }
  }

  getPlayerStoryOptions(authorId: string) {
    const params = {
      gameCode: this.gameCode,
      outcomeAuthorId: authorId,
    };

    console.log(params);

    this.http
    .get<ResponseObject>(environment.nowhereBackendUrl + HttpConstants.AUTHOR_STORIES_PATH, { params })
      .subscribe({
        next: (response) => {
          console.log('Stories retrieved!', response);
          this.playerStories = response.responseBody;
          this.numberOfOutcomesToWrite = this.playerStories.length * 2;

          this.setPlayerOption();
          console.log('Player stories', this.playerStories);
        },
        error: (error) => {
          console.error('Error creating game', error);
        },
      });
  }

  private setPlayerOption() {
    if(this.submitBothOutcomes) {
      const alreadySubmittedOutcome = this.playerOption;
      this.playerOption = this.otherOption;
      this.otherOption = alreadySubmittedOutcome;
      this.submitBothOutcomes = false;
      this.setSideAgainstEntity(this.playerOption);
    } else {
      this.playerStories[this.currentStoryIndex].options.forEach(option => {
        if (option.outcomeAuthorId === this.player.authorId) {
          this.setSideAgainstEntity(option);
          if(this.playerOption.optionId === "") {
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
    };
  }

  setSideAgainstEntity(option: Option) {
    if(this.playerStories[this.currentStoryIndex].mainPlotStory) {
      const allResults = [...option.successResults, ...option.failureResults];
      const favorResults = allResults.filter(result => result.playerStat.statType.favorType);
      
      if (favorResults.some(result => result.playerStat.value < 0)) {
        this.sideAgainstEntity = true;
      }
    }      
  }

  submit() {
    if (!this.outcomeOneSubmitted) {
      this.outcomeOneSubmitted = true;
      this.numberOfOutcomesWritten++;
    } else {
      this.submitOutcomes();
      this.outcomeOneSubmitted = false;
    }
  }

  goBack() {
    this.outcomeOneSubmitted = false;
    this.numberOfOutcomesWritten--;
  }

  submitOutcomes() {
      const requestBody = {
        gameCode: this.gameCode,
        storyId: this.playerStories[this.currentStoryIndex].storyId,
        options: [
          {
            optionId: this.playerOption.optionId,
            outcomeAuthorId: this.player.authorId,
            successText: this.optionSuccess.value,
            failureText: this.optionFailure.value
          },
          {
            optionId: this.otherOption.optionId
          }
        ]
      };
  
      this.http
        .put(environment.nowhereBackendUrl + HttpConstants.AUTHOR_STORIES_PATH, requestBody)
        .subscribe({
          next: (response) => {
            console.log('Story updated!', response);
            this.numberOfOutcomesWritten++;
            this.setNextStoryPrompt();
          },
          error: (error) => {
            console.error('Error updating story', error);
          },
        });
  }

  public canSubmit() {
    if (!this.outcomeOneSubmitted) {
      return this.optionSuccess.value && this.optionSuccess.value.trim().length > 0;
    } else {
      return this.optionFailure.value && this.optionFailure.value.trim().length > 0;
    }
  }

  public canGoBack() {
    return this.outcomeOneSubmitted 
    && this.numberOfOutcomesWritten > 0
    && this.currentStoryIndex < this.playerStories.length;
  }

  public setNextStoryPrompt() {
    this.optionSuccess.reset('');
    this.optionFailure.reset('');

    if(!this.submitBothOutcomes) {
      this.currentStoryIndex++;
      this.playerOption = new Option();
      this.otherOption = new Option();
    }
   
    if(this.currentStoryIndex >= this.playerStories.length) {
      this.playerDone.emit(ComponentType.WRITE_OUTCOMES);
    } else {
      this.setPlayerOption();
    }
    
    console.log(this.currentStoryIndex);
  }

  public statDCDifficulty() {
    let statDC: number = this.playerOption.playerStatDCs[0].value;
    if(statDC >= 7) {
      return "HARD";
    }

    else if(statDC < 7 && statDC >= 4) {
      return "NORMAL";
    }

    else {
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
}