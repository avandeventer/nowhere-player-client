import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { GameState } from 'src/assets/game-state';
import { Player } from 'src/assets/player';
import { ResponseObject } from 'src/assets/response-object';
import { Stat } from 'src/assets/stat';
import { Story } from 'src/assets/story';

@Component({
  selector: 'write-prompt',
  templateUrl: './write-prompt.component.html',
  standalone: true
})
export class WritePromptComponent implements OnInit {
  @Input() gameState: GameState = GameState.WRITE_PROMPTS;
  @Input() gameCode: string = "";
  @Input() player: Player = new Player();
  playerStories: Story[] = [];
  currentStoryIndex: number = 0;

  prompt: string = "";
  optionOneText: string = "";
  optionTwoText: string = "";

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getPlayerStories(this.player.authorId);
  }

  setPrompt(promptEvent: any) {
    this.prompt = promptEvent.target.value;
    console.log(this.prompt);
  }

  setOptionOne(optionEvent: any) {
    this.optionOneText = optionEvent.target.value;
    console.log(this.optionOneText);
  }

  setOptionTwo(optionEvent: any) {
    this.optionTwoText = optionEvent.target.value;
    console.log(this.optionTwoText);
  }

  randomStat() {
    const values = Object.keys(Stat) as Array<keyof typeof Stat>;  
    const enumKey = values[Math.floor(Math.random() * values.length)];
    return Stat[enumKey];
  }

  getPlayerStories(authorId: string) {
    const params = {
      gameCode: this.gameCode,
      authorId: authorId//"184b844f-c6b8-40ea-b6a1-374c107a53fd",
    };

    console.log(params);

    this.http
    .get<ResponseObject>('https://nowhere-556057816518.us-east5.run.app/story', { params })
      .subscribe({
        next: (response) => {
          console.log('Stories retrieved!', response);
          // this.playerStories = response.responseBody.filter(story => story.prompt !== "");
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
        prompt: this.prompt,
        storyId: this.playerStories[this.currentStoryIndex].storyId,
        options: [
          {
            optionId: this.playerStories[this.currentStoryIndex].options[0].optionId,
            optionText: this.optionOneText
          }, 
          {
            optionId: this.playerStories[this.currentStoryIndex].options[1].optionId,
            optionText: this.optionTwoText
          }
        ]
      };
  
      this.http
        .put('https://nowhere-556057816518.us-east5.run.app/story', requestBody)
        .subscribe({
          next: (response) => {
            console.log('Story updated!', response);
          },
          error: (error) => {
            console.error('Error updating story', error);
          },
        });
      this.prompt = "";
      this.optionOneText = "";
      this.optionTwoText = "";
      this.currentStoryIndex++;
      console.log(this.currentStoryIndex);
  }
}
