import { Component, Input, OnInit, OnDestroy, OnChanges, EventEmitter, Output, SimpleChanges } from '@angular/core';
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
import { Repercussion } from '../assets/repercussion';
import { PlayerVote } from '../assets/player-vote';
import { GameState } from '../assets/game-state';
import { ComponentType } from 'src/assets/component-type';
import { GameSessionDisplay } from '../assets/game-session-display';
import { CollaborativeTextPhaseInfo } from '../assets/collaborative-text-phase-info';
import { OutcomeType } from 'src/assets/outcome-type';
import { StoryComponent } from '../story/story.component';
import { CompassVotingComponent } from '../compass-voting/compass-voting.component';

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
    MatSelectModule,
    StoryComponent,
    CompassVotingComponent
  ],
  templateUrl: './voting.component.html',
  styleUrl: './voting.component.scss'
})
export class VotingComponent implements OnInit, OnChanges {
  @Input() gameCode: string = '';
  @Input() gameState: GameState = GameState.WHERE_ARE_WE_VOTE;
  @Input() player: any = null;
  @Input() gameSessionDisplay: GameSessionDisplay | null = null;
  @Input() phaseInfo: CollaborativeTextPhaseInfo | null = null;
  @Input() activePlayerSession: any = null;
  @Output() playerDone = new EventEmitter<ComponentType>();

  submissions: TextSubmission[] = [];
  selectedSubmissions: string[] = []; // Array of submission IDs in order of selection
  isLoading = false;
  hasVoted = false;
  phaseQuestion = '';
  playerOutcomeType: OutcomeType | null = null;

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.setupPhaseProperties();
    this.loadPlayerOutcomeType();
    if (this.gameState !== GameState.NAVIGATE_VOTING) {
      this.loadVotingSubmissions();
    }
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['gameState']) {
      this.setupPhaseProperties();
      this.hasVoted = false;
      this.loadVotingSubmissions();
    }
  }

  private setupPhaseProperties() {
      this.phaseQuestion = this.phaseInfo?.phaseQuestion || 'Vote on submissions';
  }

  private loadVotingSubmissions() {
    this.isLoading = true;
        
    this.gameService.getVotingSubmissions(this.gameCode, this.player.authorId).subscribe({
      next: (submissions) => {
        
        this.submissions = submissions;
        if (this.submissions.length === 0) {
          this.hasVoted = true; // No submissions to vote on, mark as voted
        }
        this.initializeRankings();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading voting submissions:', error);
        this.isLoading = false;
      }
    });
  }

  loadPlayerOutcomeType() {
    this.gameService.getOutcomeTypeForPlayer(this.gameCode, this.player.authorId).subscribe({
      next: (outcomeType) => {
        this.playerOutcomeType = outcomeType;
      },
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

  // Helper methods for WHAT_WILL_BECOME_OF_US phase
  isPlayerSubmission(submission: TextSubmission): boolean {
    return submission.authorId === this.player.authorId;
  }

  getSubmissionRepercussions(submission: TextSubmission): Repercussion[] {
    return submission.additions
      .filter(a => a.repercussion != null)
      .map(a => a.repercussion!);
  }

  getOutcomeTypeClass(outcomeType: string | undefined): string {
    if (!outcomeType) return '';

    if (outcomeType != 'success' && outcomeType != 'neutral' && outcomeType != 'failure') {
      return 'outcome-success';
    }
    
    return `outcome-${outcomeType}`;
  }

  isMakeChoicePhase(): boolean {
    return this.gameState === GameState.MAKE_CHOICE_VOTING
    || this.gameState === GameState.MAKE_CHOICE_WINNER
    || this.gameState === GameState.MAKE_OUTCOME_CHOICE_WINNER
    || this.gameState === GameState.LOCATION_OPTION_MAKE_CHOICE_VOTING
    || this.gameState === GameState.LOCATION_OPTION_MAKE_CHOICE_WINNER
    || this.gameState === GameState.MAKE_PARTNER_CHOICE_VOTING
    || this.gameState === GameState.ACCEPT_PARTNER_CHOICE_VOTING;
  }

  isMakeOutcomeChoiceVotingPhase(): boolean {
    return this.gameState === GameState.MAKE_OUTCOME_CHOICE_VOTING;
  }

  isLocationVotingPhase(): boolean {
    return this.gameState === GameState.LOCATION_VOTING;
  }

  selectedLocationId: string = '';

  selectLocation(submissionId: string) {
    this.selectedLocationId = submissionId;
  }

  getSelectedLocationSubmission(): TextSubmission | null {
    return this.submissions.find(s => s.submissionId === this.selectedLocationId) ?? null;
  }

  submitLocationVote() {
    if (!this.selectedLocationId) return;

    this.isLoading = true;
    const vote = new PlayerVote(this.player.authorId, this.selectedLocationId, 1);

    this.gameService.submitPlayerVotes(this.gameCode, [vote]).subscribe({
      next: () => {
        this.hasVoted = true;
        this.isLoading = false;
        this.playerDone.emit(ComponentType.VOTING);
      },
      error: (error) => {
        console.error('Error submitting location vote:', error);
        this.isLoading = false;
      }
    });
  }

  hasStoryWithOptions(): boolean {
    return !!(this.phaseInfo?.storyToIterateOn?.options && this.phaseInfo.storyToIterateOn.options.length > 0);
  }

  isNavigateVotingPhase(): boolean {
    return this.gameState === GameState.NAVIGATE_VOTING;
  }
}
