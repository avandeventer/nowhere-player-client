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
import { GameSessionDisplay } from '../assets/game-session-display';

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
  @Input() gameSessionDisplay: GameSessionDisplay | null = null;
  @Output() playerDone = new EventEmitter<ComponentType>();

  submissions: TextSubmission[] = [];
  allSubmissions: TextSubmission[] = []; // All submissions including player's own
  selectedSubmissions: string[] = []; // Array of submission IDs in order of selection
  isLoading = false;
  hasVoted = false;
  phaseQuestion = '';
  playerOutcomeType: string | null = null; // "success", "neutral", or "failure"

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.setupPhaseProperties();
    if (this.isWhatWillBecomeOfUsVotePhase()) {
      this.loadPlayerOutcomeType();
    }
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
      case GameState.WHAT_DO_WE_FEAR_VOTE:
        this.phaseQuestion = 'What do we fear?';
        break;
      case GameState.WHO_ARE_WE_VOTE:
        this.phaseQuestion = 'Who are we?';
        break;
      case GameState.WHAT_IS_COMING_VOTE:
        this.phaseQuestion = 'What is coming?';
        break;
      case GameState.WHAT_ARE_WE_CAPABLE_OF_VOTE:
        this.phaseQuestion = 'What are we capable of?';
        break;
      case GameState.WHAT_WILL_BECOME_OF_US_VOTE:
        this.phaseQuestion = 'What will become of us?';
        break;
      default:
        this.phaseQuestion = 'Vote on submissions';
    }
  }

  private loadPlayerOutcomeType() {
    if (this.isWhatWillBecomeOfUsVotePhase()) {
      this.gameService.getOutcomeTypeForPlayer(this.gameCode, this.player.authorId).subscribe({
        next: (outcomeType) => {
          this.playerOutcomeType = outcomeType;
          console.log('Player outcome type for voting:', outcomeType);
          // Reload submissions after getting outcome type to filter correctly
          this.loadVotingSubmissions();
        },
        error: (error) => {
          console.error('Error loading player outcome type:', error);
        }
      });
    }
  }

  private loadVotingSubmissions() {
    this.isLoading = true;
    
    if (this.isWhatWillBecomeOfUsVotePhase() && !this.playerOutcomeType) {
      // Wait for outcome type to be loaded
      return;
    }
    
    this.gameService.getVotingSubmissions(this.gameCode, this.player.authorId).subscribe({
      next: (submissions) => {
        this.allSubmissions = submissions;
        
        // For WHAT_WILL_BECOME_OF_US, also load player's own submissions
        if (this.isWhatWillBecomeOfUsVotePhase()) {
          this.loadPlayerOwnSubmissions().then(() => {
            this.filterSubmissionsByOutcomeType();
          });
        } else {
          this.submissions = submissions;
          this.initializeRankings();
          if (this.submissions.length === 0) {
            this.playerDone.emit(ComponentType.VOTING);
          }
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading voting submissions:', error);
        this.isLoading = false;
      }
    });
  }

  private async loadPlayerOwnSubmissions(): Promise<void> {
    // Get the collaborative text phase to find player's own submissions
    return new Promise((resolve, reject) => {
      this.gameService.getCollaborativeTextPhase(this.gameCode).subscribe({
        next: (phase) => {
          if (phase && phase.submissions) {
            // Add player's own submissions to allSubmissions
            const playerSubmissions = phase.submissions.filter(
              submission => submission.authorId === this.player.authorId
            );
            
            // Merge with existing submissions, avoiding duplicates
            const existingIds = new Set(this.allSubmissions.map(s => s.submissionId));
            const newPlayerSubmissions = playerSubmissions.filter(
              s => !existingIds.has(s.submissionId)
            );
            
            this.allSubmissions = [...this.allSubmissions, ...newPlayerSubmissions];
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading collaborative phase for player submissions:', error);
          resolve(); // Continue even if this fails
        }
      });
    });
  }

  private filterSubmissionsByOutcomeType() {
    if (this.isWhatWillBecomeOfUsVotePhase() && this.playerOutcomeType) {
      // Filter to only show submissions matching player's outcome type
      this.submissions = this.allSubmissions.filter(
        submission => submission.outcomeType === this.playerOutcomeType
      );
    } else {
      this.submissions = this.allSubmissions;
    }
    
    this.initializeRankings();
    if (this.submissions.length === 0) {
      this.playerDone.emit(ComponentType.VOTING);
    }
    this.isLoading = false;
  }

  isWhatWillBecomeOfUsVotePhase(): boolean {
    return this.gameState === GameState.WHAT_WILL_BECOME_OF_US_VOTE;
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

  // Helper methods for WHAT_WILL_BECOME_OF_US phase
  isPlayerSubmission(submission: TextSubmission): boolean {
    return submission.authorId === this.player.authorId;
  }

  getOutcomeTypeLabel(outcomeType: string | undefined): string {
    const entityName = this.gameSessionDisplay?.entity || 'the Entity';
    if (!outcomeType) return '';
    switch (outcomeType) {
      case 'success':
        return `IMPRESSED ${entityName}`;
      case 'neutral':
        return `FAILED ${entityName}`;
      case 'failure':
        return `DESTROYED ${entityName}`;
      default:
        return '';
    }
  }

  getOutcomeTypeClass(outcomeType: string | undefined): string {
    if (!outcomeType) return '';
    return `outcome-${outcomeType}`;
  }

  canSelectSubmission(submission: TextSubmission): boolean {
    // For WHAT_WILL_BECOME_OF_US, only allow selecting submissions matching player's outcome type
    if (this.isWhatWillBecomeOfUsVotePhase()) {
      return submission.outcomeType === this.playerOutcomeType;
    }
    return true;
  }
}
