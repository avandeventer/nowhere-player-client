import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { GameState } from 'src/assets/game-state';
import { Player } from 'src/assets/player';
import { Location } from 'src/assets/location';
import { ResponseObject } from 'src/assets/response-object';
import { Stat } from 'src/assets/stat';
import { Story } from 'src/assets/story';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpConstants } from 'src/assets/http-constants';
import { environment } from 'src/environments/environment';
import { firstValueFrom } from 'rxjs';
import { PrequelDisplayComponent } from 'src/prequel-story-display/prequel-story-display.component';
import { ComponentType } from 'src/assets/component-type';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'write-prompt',
  templateUrl: './write-prompt.component.html',
  imports: [
    ReactiveFormsModule,
    PrequelDisplayComponent,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatChipSet,
    MatChip,
    MatCardModule
  ],
  standalone: true
})
export class WritePromptComponent implements OnInit {
  @Input() gameState: GameState = GameState.WRITE_PROMPTS;
  @Input() gameCode: string = "";
  @Input() player: Player = new Player();
  @Output() playerDone = new EventEmitter<ComponentType>();
  playerStories: Story[] = [];
  currentStoryIndex: number = 0;
  outcomeDisplay: string[] = [];
  promptSubmitted: boolean = false;

  prompt = new FormControl();
  optionOne = new FormControl();
  optionTwo = new FormControl();
  numberOfPromptsWritten: number = 0;
  numberOfPromptsToWrite: number = 0;

  constructor(private http: HttpClient) {
  }

  ngOnInit() {
    this.getPlayerStories(this.player.authorId);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gameState'] && !changes['gameState'].isFirstChange()) {
      const currentState = changes['gameState'].currentValue;

      // TODO: Reimplement when timer is readded - Auto submits prompts
      // if ((currentState === GameState.WRITE_OPTIONS || currentState === GameState.WRITE_OPTIONS_AGAIN)
      //     && !(this.currentStoryIndex >= this.playerStories.length)) {
      //   this.submitPrompt();
      // } 

      if (currentState !== GameState.WRITE_PROMPTS && currentState !== GameState.WRITE_PROMPTS_AGAIN) {
        this.currentStoryIndex = 0;
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
          this.numberOfPromptsToWrite = this.playerStories.length;
          console.log('Player stories', this.playerStories);
        },
        error: (error) => {
          console.error('Error creating game', error);
        },
      });
  }

  async getLocations(gameCode: string): Promise<Location[]> {
    const params = {
      gameCode: gameCode
    };

    console.log(params);

    try {
      const response = await firstValueFrom(
        this.http.get<Location[]>(environment.nowhereBackendUrl + HttpConstants.LOCATION_PATH, { params })
      );
      console.log('Locations retrieved!', response);
      return response;
    } catch (error) {
      console.error('Error getting locations', error);
      throw error;
    }
  }


  submitPrompt() {
    this.promptSubmitted = true;
  }

  submitOptions() {
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
      .put(environment.nowhereBackendUrl + HttpConstants.AUTHOR_STORIES_PATH, requestBody)
      .subscribe({
        next: (response) => {
          console.log('Story updated!', response);
          this.numberOfPromptsWritten++;
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
    this.promptSubmitted = false;
    if (this.currentStoryIndex >= this.playerStories.length) {
      this.playerDone.emit(ComponentType.WRITE_PROMPTS);
    }
    console.log(this.currentStoryIndex);
  }

  public statDCDifficulty(promptIndex: number) {
    let statDC: number = this.playerStories[this.currentStoryIndex].options[promptIndex].playerStatDCs[0].value;
    if (statDC >= 7) {
      return "HARD";
    }

    else if (statDC < 7 && statDC >= 4) {
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
