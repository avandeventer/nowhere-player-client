import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GameService } from '../services/game-session.service';
import { TextSubmission } from '../assets/collaborative-text-phase';
import { PlayerVote } from '../assets/player-vote';
import { ComponentType } from '../assets/component-type';

@Component({
  selector: 'app-compass-voting',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './compass-voting.component.html',
  styleUrl: './compass-voting.component.scss'
})
export class CompassVotingComponent implements OnInit, OnChanges {
  @Input() gameCode: string = '';
  @Input() player: any = null;
  @Input() submissions: TextSubmission[] = [];
  @Output() playerDone = new EventEmitter<ComponentType>();

  selectedDirection: string | null = null;
  isLoading = false;
  hasVoted = false;

  directions = [
    { id: 'NORTH', label: 'North', icon: 'arrow_upward', position: 'top' },
    { id: 'EAST', label: 'East', icon: 'arrow_forward', position: 'right' },
    { id: 'SOUTH', label: 'South', icon: 'arrow_downward', position: 'bottom' },
    { id: 'WEST', label: 'West', icon: 'arrow_back', position: 'left' }
  ];

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.updateSelectedFromSubmissions();
  }

  ngOnChanges() {
    this.updateSelectedFromSubmissions();
  }

  private updateSelectedFromSubmissions() {
    // Check if player has already voted by looking at submissions
    // This would need to be implemented based on your voting logic
  }

  selectDirection(directionId: string) {
    if (this.isLoading || this.hasVoted) return;
    this.selectedDirection = directionId;
  }

  isSelected(directionId: string): boolean {
    return this.selectedDirection === directionId;
  }

  submitVote() {
    if (!this.selectedDirection || this.isLoading || this.hasVoted) return;

    this.isLoading = true;

    // Create a PlayerVote with the selected direction as submissionId
    const playerVote = new PlayerVote(this.player.authorId, this.selectedDirection, 1);

    this.gameService.submitPlayerVotes(this.gameCode, [playerVote]).subscribe({
      next: () => {
        this.hasVoted = true;
        this.isLoading = false;
        setTimeout(() => {
          this.playerDone.emit(ComponentType.VOTING);
        }, 1500);
      },
      error: (error) => {
        console.error('Error submitting vote:', error);
        this.isLoading = false;
      }
    });
  }

  getDirectionSubmission(directionId: string): TextSubmission | undefined {
    return this.submissions.find(sub => sub.submissionId === directionId);
  }
}

