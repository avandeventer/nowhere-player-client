import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { GameState } from 'src/assets/game-state';
import { Player } from 'src/assets/player';
import { ResponseObject } from 'src/assets/response-object';
import { Stat } from 'src/assets/stat';
import { Story } from 'src/assets/story';
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
  playerStories: Story[] = [];
  currentStoryIndex: number = 0;

  optionOneSuccess = new FormControl('');
  optionOneFailure = new FormControl('');

  optionTwoSuccess = new FormControl('');
  optionTwoFailure = new FormControl('');

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getPlayerStoryOptions(this.player.authorId);
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
          console.log('Player stories', this.playerStories);
        },
        error: (error) => {
          console.error('Error creating game', error);
        },
      });
  }

  submitOutcomes() {
      const requestBody = {
        gameCode: this.gameCode,
        storyId: this.playerStories[this.currentStoryIndex].storyId,
        options: [
          {
            optionId: this.playerStories[this.currentStoryIndex].options[0].optionId,
            successText: this.optionOneSuccess.value,
            failureText: this.optionOneFailure.value
          }, 
          {
            optionId: this.playerStories[this.currentStoryIndex].options[1].optionId,
            successText: this.optionTwoSuccess.value,
            failureText: this.optionTwoFailure.value
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
    this.optionOneSuccess.reset('');
    this.optionOneFailure.reset('');
    this.optionTwoSuccess.reset('');
    this.optionTwoFailure.reset('');
    this.currentStoryIndex++;
    console.log(this.currentStoryIndex);
  }
}