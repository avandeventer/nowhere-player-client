import { Component, EventEmitter, Input, OnInit, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GameService } from '../services/game-session.service';
import { Player } from '../assets/player';
import { GameState } from '../assets/game-state';
import { CollaborativeTextPhase, TextSubmission, TextAddition } from '../assets/collaborative-text-phase';

@Component({
  selector: 'collaborative-text',
  templateUrl: './collaborative-text.component.html',
  styleUrls: ['./collaborative-text.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  standalone: true
})
export class CollaborativeTextComponent implements OnInit, OnChanges {
  @Input() gameCode: string = '';
  @Input() gameState: GameState = GameState.INIT;
  @Input() player: Player = new Player();
  @Input() collaborativeTextPhases: any = null;
  @Output() playerDone = new EventEmitter<void>();
  @Output() collaborativeTextPhaseChanged = new EventEmitter<any>();

  // Form controls
  newTextControl = new FormControl('', [Validators.required, Validators.minLength(1)]);
  additionTextControl = new FormControl('', [Validators.required, Validators.minLength(1)]);

  // Component state
  collaborativePhase: CollaborativeTextPhase | null = null;
  availableSubmissions: TextSubmission[] = [];
  selectedSubmission: TextSubmission | null = null;
  isLoading = false;
  hasSubmitted = false;
  showNewSubmission = true;

  // Phase-specific properties
  phaseQuestion = '';
  phaseInstructions = '';

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.setupPhaseProperties();
    this.loadCollaborativePhase();
  }

  ngOnChanges() {
    // When collaborative text phases change, update the available submissions
    if (this.collaborativeTextPhases && this.isGameInCollaborativeTextPhase()) {
      this.updateAvailableSubmissionsFromPhases();
    }
  }

  private setupPhaseProperties() {
    switch (this.gameState) {
      case GameState.WHERE_ARE_WE:
        this.phaseQuestion = 'Where are we?';
        this.phaseInstructions = 'Describe the setting where your story takes place. Be creative and specific!';
        break;
      case GameState.WHO_ARE_WE:
        this.phaseQuestion = 'Who are we?';
        this.phaseInstructions = 'Describe the characters in your story. Who are the protagonists?';
        break;
      case GameState.WHAT_IS_OUR_GOAL:
        this.phaseQuestion = 'What is our goal?';
        this.phaseInstructions = 'What are the characters trying to achieve? What is their mission or objective?';
        break;
      case GameState.WHAT_ARE_WE_CAPABLE_OF:
        this.phaseQuestion = 'What are we capable of?';
        this.phaseInstructions = 'What special abilities, skills, or resources do the characters have?';
        break;
      default:
        this.phaseQuestion = 'Collaborative Writing';
        this.phaseInstructions = 'Work together to build your story!';
    }
  }

  private loadCollaborativePhase() {
    this.isLoading = true;
    this.gameService.getCollaborativeTextPhase(this.gameCode).subscribe({
      next: (phase) => {
        this.collaborativePhase = phase;
        this.updateAvailableSubmissions();
        this.checkIfPlayerHasSubmitted();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading collaborative phase:', error);
        this.isLoading = false;
      }
    });
  }

  private updateAvailableSubmissions() {
    if (!this.collaborativePhase) return;

    // Get submissions available to this player (with distribution logic)
    this.gameService.getAvailableSubmissionsForPlayer(this.gameCode, this.player.authorId).subscribe({
      next: (submissions) => {
        // Backend now handles filtering out player's own submissions
        this.availableSubmissions = submissions;
        
        // Record views for all retrieved submissions
        this.recordViewsForSubmissions(submissions);
      },
      error: (error) => {
        console.error('Error getting available submissions:', error);
        // Fallback to showing all submissions except player's own
        this.availableSubmissions = this.collaborativePhase!.submissions.filter(submission => 
          submission.authorId !== this.player.authorId
        );
      }
    });
  }

  private checkIfPlayerHasSubmitted() {
    if (!this.collaborativePhase) return;

    // Check if player has already submitted in this phase
    this.hasSubmitted = this.collaborativePhase.submissions.some(
      submission => submission.authorId === this.player.authorId
    );

    // If player has submitted, show the addition interface
    this.showNewSubmission = !this.hasSubmitted;
  }

  private recordViewsForSubmissions(submissions: TextSubmission[]) {
    // Record views for all submissions that are not the player's own
    submissions
      .filter(submission => submission.authorId !== this.player.authorId)
      .forEach(submission => {
        this.gameService.recordSubmissionView(this.gameCode, this.player.authorId, submission.submissionId).subscribe({
          next: () => {
            console.log(`View recorded for submission: ${submission.submissionId}`);
          },
          error: (error) => {
            console.error(`Error recording view for submission ${submission.submissionId}:`, error);
          }
        });
      });
  }

  private updateAvailableSubmissionsFromPhases() {
    if (!this.collaborativeTextPhases) return;

    // Get the current phase ID
    const phaseId = this.getPhaseIdForGameState();
    if (!phaseId) return;

    const phase = this.collaborativeTextPhases[phaseId];
    if (!phase || !phase.submissions) return;

    // Update the collaborative phase data
    this.collaborativePhase = phase;

    // Get available submissions using the distribution logic
    this.gameService.getAvailableSubmissionsForPlayer(this.gameCode, this.player.authorId).subscribe({
      next: (submissions) => {
        // Backend now handles filtering out player's own submissions
        this.availableSubmissions = submissions;
        
        // Record views for all retrieved submissions
        this.recordViewsForSubmissions(submissions);
        
        // Check if player has submitted
        this.checkIfPlayerHasSubmitted();
      },
      error: (error) => {
        console.error('Error getting available submissions from phases:', error);
        // Fallback to showing all submissions except player's own
        this.availableSubmissions = phase.submissions.filter((submission: any) => 
          submission.authorId !== this.player.authorId
        );
        this.checkIfPlayerHasSubmitted();
      }
    });
  }

  private getPhaseIdForGameState(): string | null {
    switch (this.gameState) {
      case GameState.WHERE_ARE_WE:
        return 'WHERE_ARE_WE';
      case GameState.WHO_ARE_WE:
        return 'WHO_ARE_WE';
      case GameState.WHAT_IS_OUR_GOAL:
        return 'WHAT_IS_OUR_GOAL';
      case GameState.WHAT_ARE_WE_CAPABLE_OF:
        return 'WHAT_ARE_WE_CAPABLE_OF';
      default:
        return null;
    }
  }

  private isGameInCollaborativeTextPhase(): boolean {
    return this.gameState === GameState.WHERE_ARE_WE || 
           this.gameState === GameState.WHO_ARE_WE || 
           this.gameState === GameState.WHAT_IS_OUR_GOAL || 
           this.gameState === GameState.WHAT_ARE_WE_CAPABLE_OF;
  }

  onSubmitNewText() {
    if (this.newTextControl.invalid || !this.newTextControl.value) return;

    const textAddition: TextAddition = {
      additionId: '',
      authorId: this.player.authorId,
      addedText: this.newTextControl.value.trim(),
      submissionId: null // This indicates a new submission
    };

    this.isLoading = true;
    this.gameService.submitTextAddition(this.gameCode, textAddition).subscribe({
      next: (phase) => {
        this.collaborativePhase = phase;
        this.hasSubmitted = true;
        this.showNewSubmission = false;
        this.newTextControl.reset();
        this.updateAvailableSubmissions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error submitting new text:', error);
        this.isLoading = false;
      }
    });
  }

  onSelectSubmission(submission: TextSubmission) {
    this.selectedSubmission = submission;
  }

  onAddToSubmission() {
    if (this.additionTextControl.invalid || !this.additionTextControl.value || !this.selectedSubmission) return;

    const textAddition: TextAddition = {
      additionId: '',
      authorId: this.player.authorId,
      addedText: this.additionTextControl.value.trim(),
      submissionId: this.selectedSubmission.submissionId
    };

    this.isLoading = true;
    this.gameService.submitTextAddition(this.gameCode, textAddition).subscribe({
      next: (phase) => {
        this.collaborativePhase = phase;
        this.additionTextControl.reset();
        this.selectedSubmission = null;
        this.updateAvailableSubmissions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error adding to submission:', error);
        this.isLoading = false;
      }
    });
  }


  getSubmissionPreview(submission: TextSubmission): string {
    return submission.currentText.length > 100 
      ? submission.currentText.substring(0, 100) + '...'
      : submission.currentText;
  }

  getSubmissionAuthor(submission: TextSubmission): string {
    // In a real app, you might want to look up the actual player name
    return `Player ${submission.authorId}`;
  }
}
