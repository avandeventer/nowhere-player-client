import { Component, Input, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { GameService } from '../services/game-session.service';
import { TextSubmission } from '../assets/collaborative-text-phase';
import { PlayerVote } from '../assets/player-vote';
import { GameState } from '../assets/game-state';
import { ComponentType } from 'src/assets/component-type';

@Component({
  selector: 'app-voting',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatSelectModule
  ],
  templateUrl: './voting.component.html',
  styleUrl: './voting.component.scss'
})
export class VotingComponent implements OnInit, OnDestroy {
  @Input() gameCode: string = '';
  @Input() gameState: GameState = GameState.WHERE_ARE_WE_VOTE;
  @Input() player: any = null;
  @Output() playerDone = new EventEmitter<ComponentType>();

  submissions: TextSubmission[] = [];
  selectedSubmissions: string[] = []; // Array of submission IDs in order of selection
  isLoading = false;
  hasVoted = false;
  phaseQuestion = '';

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.setupPhaseProperties();
    this.loadVotingSubmissions();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  private setupPhaseProperties() {
    switch (this.gameState) {
      case GameState.WHERE_ARE_WE_VOTE:
        this.phaseQuestion = 'Where are we?';
        break;
      case GameState.WHO_ARE_WE_VOTE:
        this.phaseQuestion = 'Who are we?';
        break;
      case GameState.WHAT_IS_OUR_GOAL_VOTE:
        this.phaseQuestion = 'What is our goal?';
        break;
      default:
        this.phaseQuestion = 'Vote on submissions';
    }
  }

  private loadVotingSubmissions() {
    this.isLoading = true;
    this.gameService.getVotingSubmissions(this.gameCode, this.player.authorId).subscribe({
      next: (submissions) => {
        this.submissions = submissions;
        this.initializeRankings();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading voting submissions:', error);
        this.isLoading = false;
      }
    });
  }

  private initializeRankings() {
    this.selectedSubmissions = [];
  }

  onSubmissionToggle(submissionId: string) {
    const index = this.selectedSubmissions.indexOf(submissionId);
    
    if (index === -1) {
      // Add to selection (bubble in with next number)
      this.selectedSubmissions.push(submissionId);
    } else {
      // Remove from selection (bubble out and adjust others)
      this.selectedSubmissions.splice(index, 1);
    }
  }

  isSelected(submissionId: string): boolean {
    return this.selectedSubmissions.includes(submissionId);
  }

  getRanking(submissionId: string): number {
    const index = this.selectedSubmissions.indexOf(submissionId);
    return index === -1 ? 0 : index + 1;
  }

  submitVotes() {
    if (!this.validateRankings()) {
      return;
    }

    this.isLoading = true;
    
    // Create PlayerVote objects for selected submissions only
    const playerVotes: PlayerVote[] = this.selectedSubmissions.map((submissionId, index) => {
      const vote = new PlayerVote(this.player.authorId, submissionId, index + 1);
      vote.playerId = this.player.authorId;
      vote.submissionId = submissionId;
      vote.ranking = index + 1;
      return vote;
    });

    this.gameService.submitPlayerVotes(this.gameCode, playerVotes).subscribe({
      next: (phase) => {
        this.hasVoted = true;
        this.isLoading = false;
        this.playerDone.emit(ComponentType.VOTING);
        console.log('Votes submitted successfully');
      },
      error: (error) => {
        console.error('Error submitting votes:', error);
        this.isLoading = false;
      }
    });
  }

  private validateRankings(): boolean {
    // Check if at least one submission is selected
    if (this.selectedSubmissions.length === 0) {
      alert('Please select at least one submission to vote on!');
      return false;
    }
    
    return true;
  }

  getSelectedSubmissions(): TextSubmission[] {
    return this.selectedSubmissions.map(submissionId => 
      this.submissions.find(submission => submission.submissionId === submissionId)!
    );
  }
}
