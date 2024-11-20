import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { GameState } from 'src/assets/game-state';
import { Player } from 'src/assets/player';
import { ResponseObject } from 'src/assets/response-object';
import { Story } from 'src/assets/story';
import { Option } from 'src/assets/option';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'write-outcomes',
  templateUrl: './write-outcomes.component.html',
  standalone: true,
  imports: [ReactiveFormsModule]
})
export class WriteOutcomesComponent implements OnInit {
  @Input() gameState: GameState = GameState.WRITE_OPTIONS;
  @Input() gameCode: string = "";
  @Input() player: Player = new Player();
  @Output() playerDone = new EventEmitter<boolean>();
  playerStories: Story[] = [];
  currentStoryIndex: number = 0;
  playerOption: Option = new Option();
  otherOption: Option = new Option();

  optionSuccess = new FormControl('');
  optionFailure = new FormControl('');
  submitBothOutcomes: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.currentStoryIndex = 0;
    this.getPlayerStoryOptions(this.player.authorId);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gameState'] && !changes['gameState'].isFirstChange()) {
      const currentState = changes['gameState'].currentValue;

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
    .get<ResponseObject>('https://nowhere-556057816518.us-east5.run.app/story', { params })
      .subscribe({
        next: (response) => {
          console.log('Stories retrieved!', response);
          this.playerStories = response.responseBody;
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
    } else {
      this.playerStories[this.currentStoryIndex].options.forEach(option => {
        if (option.outcomeAuthorId === this.player.authorId) {
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
        .put('https://nowhere-556057816518.us-east5.run.app/story', requestBody)
        .subscribe({
          next: (response) => {
            console.log('Story updated!', response);
            this.setNextStoryPrompt();
          },
          error: (error) => {
            console.error('Error updating story', error);
          },
        });
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
      this.playerDone.emit(true);
    } else {
      this.setPlayerOption();
    }
    
    console.log(this.currentStoryIndex);
  }

  public statDCDifficulty() {
    let statDC: number = this.playerOption.statDC;
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
}