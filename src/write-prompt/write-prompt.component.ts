import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { GameState } from 'src/assets/game-state';
import { Player } from 'src/assets/player';
import { ResponseObject } from 'src/assets/response-object';
import { Stat } from 'src/assets/stat';
import { Story } from 'src/assets/story';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

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

  prompt = new FormControl('');
  optionOne = new FormControl('');
  optionTwo = new FormControl('');

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getPlayerStories(this.player.authorId);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gameState'] && !changes['gameState'].isFirstChange()) {
      const currentState = changes['gameState'].currentValue;

      if (currentState === GameState.WRITE_OPTIONS) {
        this.submitPrompt();
      }
    }
  }

  randomStat() {
    const values = Object.keys(Stat) as Array<keyof typeof Stat>;  
    const enumKey = values[Math.floor(Math.random() * values.length)];
    return Stat[enumKey];
  }

  getPlayerStories(authorId: string) {
    const params = {
      gameCode: this.gameCode,
      authorId: authorId,
    };

    console.log(params);

    this.http
    .get<ResponseObject>('https://nowhere-556057816518.us-east5.run.app/story', { params })
      .subscribe({
        next: (response) => {
          console.log('Stories retrieved!', response);
          this.playerStories = response.responseBody;
          console.log('Player stories', this.playerStories);
        },
        error: (error) => {
          console.error('Error creating game', error);
        },
      });
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
}
