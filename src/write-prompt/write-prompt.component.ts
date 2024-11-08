import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { GameState } from 'src/assets/game-state';
import { Player } from 'src/assets/player';
import { ResponseObject } from 'src/assets/response-object';
import { Stat } from 'src/assets/stat';
import { Option } from 'src/assets/option';
import { Story } from 'src/assets/story';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpConstants } from 'src/assets/http-constants';
import { environment } from 'src/environments/environment';
import { OutcomeStat } from 'src/assets/outcome-stat';

@Component({
  selector: 'write-prompt',
  templateUrl: './write-prompt.component.html',
  standalone: true,
  imports: [ReactiveFormsModule]
})
export class WritePromptComponent implements OnInit {
  @Input() gameState: GameState = GameState.WRITE_PROMPTS;
  @Input() gameCode: string = "";
  @Input() player: Player = new Player();
  playerStories: Story[] = [];
  currentStoryIndex: number = 0;
  outcomeDisplay: string[] = [];

  prompt = new FormControl();
  optionOne = new FormControl();
  optionTwo = new FormControl();

  constructor(private http: HttpClient) {
  }

  ngOnInit() {
    this.getPlayerStories(this.player.authorId); 
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gameState'] && !changes['gameState'].isFirstChange()) {
      const currentState = changes['gameState'].currentValue;

      if ((currentState === GameState.WRITE_OPTIONS || currentState === GameState.WRITE_OPTIONS_AGAIN)
          && !(this.currentStoryIndex >= this.playerStories.length)) {
        this.submitPrompt();
      }
    }
  }

  getPlayerStories(authorId: string) {
    const params = {
      gameCode: this.gameCode,
      authorId: authorId,
    };

    console.log(params);

    this.http
    .get<ResponseObject>(environment.nowhereBackendUrl + HttpConstants.AUTHOR_STORIES_PATH, { params })
      .subscribe({
        next: (response) => {
          console.log('Stories retrieved!', response);
          this.playerStories = response.responseBody;
          this.playerStories.forEach(authorStory => this.getPrequelStory(authorStory));
          console.log('Player stories', this.playerStories);
        },
        error: (error) => {
          console.error('Error creating game', error);
        },
      });
  }

  getPrequelStory(authorStory: Story) {
      if(authorStory.prequelStoryId !== "") {
        const params = {
          gameCode: this.gameCode,
          storyId: authorStory.prequelStoryId,
        };
    
        console.log(params);
    
        this.http
        .get<ResponseObject>(environment.nowhereBackendUrl + HttpConstants.AUTHOR_STORIES_PATH, { params })
          .subscribe({
            next: (response) => {
              console.log('Prequel story retrieved!', response);
              const prequelStory: Story = response.responseBody[0];
              authorStory.prequelOutcomeDisplay = this.setOutcomeDisplay(prequelStory);
              console.log('Player stories', this.playerStories);
            },
            error: (error) => {
              console.error('Error creating game', error);
            },
          });
      }
  }

  setOutcomeDisplay(prequelStory: Story): string[] {
    this.outcomeDisplay = [];
    let selectedPrequelOption: Option = new Option();
    prequelStory.options.forEach(option => {
      if(prequelStory.selectedOptionId === option.optionId) {
        selectedPrequelOption = option;
      }
    });

    this.outcomeDisplay.push("You travel to " + prequelStory.location.locationName);
    this.outcomeDisplay.push(selectedPrequelOption.optionText);
    if(prequelStory.playerSucceeded) {
      this.outcomeDisplay.push(selectedPrequelOption.successText);
      selectedPrequelOption.successResults.forEach(outcomeStat => {
        const statResult: string = "You gain " + outcomeStat.statChange + " " + outcomeStat.impactedStat.toLowerCase();
        this.outcomeDisplay.push(statResult);
      });
    } else {
      this.outcomeDisplay.push(selectedPrequelOption.failureText);
      selectedPrequelOption.failureResults.forEach(outcomeStat => {
        const statResult: string = "You lose " + outcomeStat.statChange + " " + outcomeStat.impactedStat.toLowerCase();
        this.outcomeDisplay.push(statResult)
      });
    }
    return this.outcomeDisplay;
  }

  submitPrompt() {
      const requestBody = {
        gameCode: this.gameCode,
        prompt: this.prompt.value,
        storyId: this.playerStories[this.currentStoryIndex].storyId,
        options: [
          {
            optionId: this.playerStories[this.currentStoryIndex].options[0].optionId,
            optionText: this.optionOne.value
          }, 
          {
            optionId: this.playerStories[this.currentStoryIndex].options[1].optionId,
            optionText: this.optionTwo.value
          }
        ]
      };

      console.log("Submitting story update", requestBody, this.prompt.value, this.optionOne.value, this.optionTwo.value);
  
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

  private setNextStoryPrompt() {
    console.log("set next story prompt triggered");
    this.prompt.reset('');
    this.optionOne.reset('');
    this.optionTwo.reset('');
    this.currentStoryIndex++;
    console.log(this.currentStoryIndex);
  }

  public statDCDifficulty(promptIndex: number) {
    let statDC: number = this.playerStories[this.currentStoryIndex].options[promptIndex].statDC;
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

  public isAGodFavorStory(currentStory: Story): boolean {
    return currentStory.options.some(option => {
      return option.successResults.some(outcomeStat => outcomeStat.impactedStat === Stat.FAVOR) ||
             option.failureResults.some(outcomeStat => outcomeStat.impactedStat === Stat.FAVOR);
    });
    
  }
}
