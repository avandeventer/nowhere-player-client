import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Story } from '../assets/story';
import { Option } from '../assets/option';
import { CollaborativeTextPhaseInfo } from '../assets/collaborative-text-phase-info';
import { GameService } from '../services/game-session.service';
import { PlayerVote } from '../assets/player-vote';
import { ComponentType } from '../assets/component-type';

@Component({
  selector: 'app-story',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './story.component.html',
  styleUrl: './story.component.scss'
})
export class StoryComponent {
  @Input() phaseInfo: CollaborativeTextPhaseInfo | null = null;
  @Input() gameCode: string = '';
  @Input() player: any = null;
  @Output() playerDone = new EventEmitter<ComponentType>();

  selectedOptionId: string | null = null;
  isLoading = false;
  hasVoted = false;

  constructor(private gameService: GameService) {}

  get story(): Story | undefined {
    return this.phaseInfo?.storyToIterateOn;
  }

  getOptions(): Option[] {
    return this.story?.options || [];
  }

  selectOption(option: Option) {
    if (this.hasVoted || this.isLoading) {
      return;
    }
    this.selectedOptionId = option.optionId;
  }

  submitVote() {
    if (!this.selectedOptionId || !this.player || this.hasVoted || this.isLoading) {
      return;
    }

    this.isLoading = true;

    // Create a single PlayerVote with option.optionId as submissionId
    const playerVote = new PlayerVote(this.player.authorId, this.selectedOptionId, 1);
    
    this.gameService.submitPlayerVotes(this.gameCode, [playerVote]).subscribe({
      next: (phase) => {
        this.hasVoted = true;
        this.isLoading = false;
        this.playerDone.emit(ComponentType.VOTING);
        console.log('Vote submitted successfully');
      },
      error: (error) => {
        console.error('Error submitting vote:', error);
        this.isLoading = false;
      }
    });
  }

  isSelected(option: Option): boolean {
    return this.selectedOptionId === option.optionId;
  }
}

