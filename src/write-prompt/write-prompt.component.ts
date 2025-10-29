import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { GameState } from 'src/assets/game-state';
import { Player } from 'src/assets/player';
import { Location } from 'src/assets/location';
import { ResponseObject } from 'src/assets/response-object';
import { Story } from 'src/assets/story';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { StatType } from 'src/assets/stat-type';
import { WritePhase } from 'src/assets/phases/write-phase';

@Component({
  selector: 'write-prompt',
  templateUrl: './write-prompt.component.html',
  styleUrl: './write-prompt.component.scss',
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
  writingHasProgressed: boolean = false;
  isPlayerSequel: boolean = false;
  prompt = new FormControl('', { validators: [Validators.maxLength(300)] });
  optionOne = new FormControl('', { validators: [Validators.maxLength(40)] });
  optionTwo = new FormControl('', { validators: [Validators.maxLength(40)] });
  numberOfPromptsWritten: number = 0;
  numberOfPromptsToWrite: number = 0;
  favorStat: StatType = new StatType();
  aboutToSubmit: boolean = false;
  promptExample: string = "";
  optionOneExample: string = "Ex. Give the child some coin";
  optionTwoExample: string = "Ex. Beat the kid up";
  prequelPlayer: Player = new Player();

  phase: WritePhase = WritePhase.PROMPT;
  protected WritePhase = WritePhase;

  constructor(private http: HttpClient) {
  }

  ngOnInit() {
    this.getAuthorStories(this.player.authorId);
    this.setFavorStat(this.player);
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

  getAuthorStories(authorId: string) {
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
          this.promptExample = `Ex. You see a small child begging for scraps at the ${this.playerStories[this.currentStoryIndex].location.label}.`;
          if (this.playerStories[this.currentStoryIndex].mainPlotStory) {
            this.phase = WritePhase.OPTION_ONE;
          }
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

  submitWriting() {
    const isMainPlotStory = this.playerStories[this.currentStoryIndex].mainPlotStory;

    switch (this.phase) {
      case WritePhase.PROMPT:
        if (isMainPlotStory) {
          this.phase = WritePhase.DONE;
          this.submitStory();
        } else {
          this.phase = WritePhase.OPTION_ONE;
          this.writingHasProgressed = true;
        }
        break;
      case WritePhase.OPTION_ONE:
        this.phase = WritePhase.OPTION_TWO;
        if (isMainPlotStory) {
          this.writingHasProgressed = true;
        } else {
          this.aboutToSubmit = true;
        }
        break;
      case WritePhase.OPTION_TWO:
        if (isMainPlotStory) {
          this.phase = WritePhase.PROMPT;
          this.aboutToSubmit = true;
        } else {
          this.phase = WritePhase.DONE;
          this.submitStory();
        }
        break;
      default:
        this.phase = WritePhase.DONE;
        break;
    }
  }

  goBack() {
    const isMainPlotStory = this.playerStories[this.currentStoryIndex].mainPlotStory;
    this.aboutToSubmit = false;

    switch (this.phase) {
      case WritePhase.PROMPT:
        if (isMainPlotStory) {
          this.phase = WritePhase.OPTION_TWO;
        }
        break;
      case WritePhase.OPTION_TWO:
        this.phase = WritePhase.OPTION_ONE;
        if (isMainPlotStory) {
          this.writingHasProgressed = false;
        }
        break;
      case WritePhase.OPTION_ONE:
        if (!isMainPlotStory) {
          this.phase = WritePhase.PROMPT;
          this.writingHasProgressed = false;
        }
        break;
      default:
        this.phase = WritePhase.PROMPT;
        break;
    }
  }

  getInstructionQuestionString(optionIndex: number) {
    if (this.playerStories[this.currentStoryIndex].mainPlotStory) {
      let moralChoice: string = "impress";
      if (optionIndex === 1) {
        moralChoice = "weaken";
      }
      return `What is something your friend could do to try to ${moralChoice} ${this.favorStat.favorEntity} using`;
  } else {
      return `What is something your friend could do to try to resolve the prompt you've written using`;
    }
  }

  getCurrentOptionIndex(): number {
    return this.phase === WritePhase.OPTION_TWO ? 1 : 0;
  }

  submitStory() {
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
    } else {
      if (this.playerStories[this.currentStoryIndex].mainPlotStory) {
        this.phase = WritePhase.OPTION_ONE;
      } else {
        this.phase = WritePhase.PROMPT;
      }
      this.promptExample = `Ex. You see a small child begging for scraps at the ${this.playerStories[this.currentStoryIndex].location.label}.`;
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

  public setFavorStat(player: Player) {
    let favorStat: StatType | undefined = player
          .playerStats.find(stat => stat.statType.favorType)?.statType;

    if (favorStat !== undefined) {
      this.favorStat = favorStat;
    }
  }

  public setPrequelPlayer(prequelPlayer: Player) {
    this.prequelPlayer = prequelPlayer;
  }

  public setIsPlayerSequel(isPlayerSequel: boolean) {
    this.isPlayerSequel = isPlayerSequel;
  }

  canSubmit(): boolean {
    switch (this.phase) {
      case WritePhase.PROMPT:
        return !!(this.prompt.value && this.prompt.value.trim().length > 0);
      case WritePhase.OPTION_ONE:
        return !!(this.optionOne.value && this.optionOne.value.trim().length > 0);
      case WritePhase.OPTION_TWO:
        return !!(this.optionTwo.value && this.optionTwo.value.trim().length > 0);
      default:
        return false;
    }
  }
}
