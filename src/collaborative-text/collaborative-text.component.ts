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
  
  // Track the last known submissions to detect actual changes
  private lastKnownSubmissions: TextSubmission[] = [];
  maximumSubmissionsReached = false;
  // Phase-specific properties
  phaseQuestion = '';
  phaseInstructions = '';
  
  // Mode detection
  isSimpleMode = false; // For WHAT_DO_WE_FEAR and WHAT_ARE_WE_CAPABLE_OF
  isCollaborativeMode = false; // For WHERE_ARE_WE, WHO_ARE_WE, WHAT_IS_COMING
  
  // WHAT_WILL_BECOME_OF_US phase properties
  playerOutcomeType: string | null = null; // "success", "neutral", or "failure"

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.setupPhaseProperties();
    this.loadPlayerOutcomeType();
    this.loadCollaborativePhase();
  }

  ngOnChanges() {
    // When collaborative text phases change, check if submissions actually changed
    if (this.collaborativeTextPhases 
        && this.isGameInCollaborativeTextPhase() 
        && this.hasSubmitted
        && !this.maximumSubmissionsReached
    ) {
      const phaseId = this.getPhaseIdForGameState();
      if (!phaseId) return;
      
      const phase = this.collaborativeTextPhases[phaseId];
      if (!phase || !phase.submissions) return;
      
      // Check if submissions array has actually changed
      const currentSubmissions = phase.submissions;
      const submissionsChanged = this.hasSubmissionsChanged(currentSubmissions);
      
      if (submissionsChanged) {
        console.log('Submissions changed, updating available submissions');
        this.updateAvailableSubmissions(true); // true = use phases data
      } else {
        console.log('No submission changes detected, skipping update');
      }
    }
  }

  private setupPhaseProperties() {
    // Reset mode flags
    this.isSimpleMode = false;
    this.isCollaborativeMode = false;
    
    switch (this.gameState) {
      case GameState.WHERE_ARE_WE:
        this.isCollaborativeMode = true;
        this.phaseQuestion = 'Where are we?';
        this.phaseInstructions = 'We will begin by describing our world.';
        break;
      case GameState.WHAT_DO_WE_FEAR:
        this.isSimpleMode = true;
        this.phaseQuestion = 'What do we fear?';
        this.phaseInstructions = 'What do we fear? What person, group, or entity holds power in this world?';
        break;
      case GameState.WHAT_IS_COMING:
        this.isCollaborativeMode = true;
        this.phaseQuestion = 'What is coming?';
        this.phaseInstructions = 'An event will occur at the end of the season where we will be judged by the Entity. What must we each do when they arrive to ensure our success or survival?';
        break;
      case GameState.WHO_ARE_WE:
        this.isCollaborativeMode = true;
        this.phaseQuestion = 'Who are we?';
        this.phaseInstructions = 'Define who we are together. What is our goal?';
        break;
      case GameState.WHAT_ARE_WE_CAPABLE_OF:
        this.isSimpleMode = true;
        this.phaseQuestion = 'What are we capable of?';
        this.phaseInstructions = 'We will need certain skills in order to overcome. List anything you think we will need to be good at to survive.';
        break;
      case GameState.WHAT_WILL_BECOME_OF_US:
        this.isCollaborativeMode = true;
        this.phaseQuestion = 'What will become of us?';
        this.phaseInstructions = 'Write the ending text for your assigned outcome type.';
        break;
      case GameState.WRITE_ENDING_TEXT:
        this.isCollaborativeMode = true;
        this.phaseQuestion = 'How will our story end?';
        this.phaseInstructions = 'Based on how well we have done as a group, write the ending text that will be displayed. This will determine how our story concludes.';
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
        this.checkIfPlayerHasSubmitted();
        
        if (this.isSimpleMode) {
          // For simple mode (WHAT_DO_WE_FEAR, WHAT_ARE_WE_CAPABLE_OF), don't show other submissions
          this.availableSubmissions = [];
          this.maximumSubmissionsReached = false;
        } else {
          // For collaborative mode, only load available submissions if player has already submitted
          if (this.hasSubmitted) {
            this.updateAvailableSubmissions(); // false = use existing collaborativePhase data
          }
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading collaborative phase:', error);
        this.isLoading = false;
      }
    });
  }

  private updateAvailableSubmissions(usePhasesData: boolean = false) {
    // If using phases data, extract the phase first
    if (usePhasesData) {
      if (!this.collaborativeTextPhases) return;

      const phaseId = this.getPhaseIdForGameState();
      if (!phaseId) return;

      const phase = this.collaborativeTextPhases[phaseId];
      if (!phase || !phase.submissions) return;

      // Update the collaborative phase data
      this.collaborativePhase = phase;

      // Only load available submissions if player has already submitted
      if (!this.hasSubmitted) {
        return;
      }
    } else {
      // Using existing collaborativePhase data
      if (!this.collaborativePhase) return;
    }

    // Calculate how many submissions we need (2 - current count)
    const currentCount = this.availableSubmissions.length;
    const requestedCount = Math.max(0, 2 - currentCount);
    
    // Get submissions available to this player (with distribution logic)
    this.gameService.getAvailableSubmissionsForPlayer(this.gameCode, this.player.authorId, requestedCount).subscribe({
      next: (submissions) => {
        this.mergeNewSubmissions(submissions);
      },
      error: (error) => {
        console.error('Error getting available submissions:', error);
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


  private mergeNewSubmissions(newSubmissions: TextSubmission[]) {
    // Create a map of existing submissions by ID for quick lookup
    const existingSubmissionsMap = new Map(
      this.availableSubmissions.map(submission => [submission.submissionId, submission])
    );
    
    // Find submissions that are not already in our list
    const newSubmissionsToAdd = newSubmissions.filter(submission => 
      !existingSubmissionsMap.has(submission.submissionId)
    );
    
    // Add new submissions to the existing list
    this.availableSubmissions = [...this.availableSubmissions, ...newSubmissionsToAdd];
    
    // Limit to 2 submissions maximum
    if (this.availableSubmissions.length >= 2) {
      this.availableSubmissions = this.availableSubmissions.slice(0, 2);
      this.maximumSubmissionsReached = true;
      console.log('Maximum submissions reached', this.maximumSubmissionsReached);
    }
    
    console.log(`Added ${newSubmissionsToAdd.length} new submissions. Showing ${this.availableSubmissions.length} total submissions (limited to 2)`);
  }


  private getPhaseIdForGameState(): string | null {
    switch (this.gameState) {
      case GameState.WHERE_ARE_WE:
        return 'WHERE_ARE_WE';
      case GameState.WHO_ARE_WE:
        return 'WHO_ARE_WE';
      case GameState.WHAT_IS_COMING:
        return 'WHAT_IS_COMING';
      case GameState.WHAT_ARE_WE_CAPABLE_OF:
        return 'WHAT_ARE_WE_CAPABLE_OF';
      case GameState.WHAT_WILL_BECOME_OF_US:
        return 'WHAT_WILL_BECOME_OF_US';
      case GameState.WRITE_ENDING_TEXT:
        return 'WRITE_ENDING_TEXT';
      default:
        return null;
    }
  }

  private loadPlayerOutcomeType() {
    // Only load outcome type for WHAT_WILL_BECOME_OF_US phase
    if (this.gameState === GameState.WHAT_WILL_BECOME_OF_US) {
      this.gameService.getOutcomeTypeForPlayer(this.gameCode, this.player.authorId).subscribe({
        next: (outcomeType) => {
          this.playerOutcomeType = outcomeType;
          console.log('Player outcome type:', outcomeType);
        },
        error: (error) => {
          console.error('Error loading player outcome type:', error);
        }
      });
    }
  }

  private   isGameInCollaborativeTextPhase(): boolean {
    return this.gameState === GameState.WHERE_ARE_WE || 
           this.gameState === GameState.WHAT_DO_WE_FEAR ||
           this.gameState === GameState.WHO_ARE_WE || 
           this.gameState === GameState.WHAT_IS_COMING || 
           this.gameState === GameState.WHAT_ARE_WE_CAPABLE_OF ||
           this.gameState === GameState.WHAT_WILL_BECOME_OF_US ||
           this.gameState === GameState.WRITE_ENDING_TEXT;
  }

  // Helper methods for simple mode
  getSimpleModeLabel(): string {
    switch (this.gameState) {
      case GameState.WHAT_DO_WE_FEAR:
        return 'Your fear (short phrase)';
      case GameState.WHAT_ARE_WE_CAPABLE_OF:
        return 'Your capability (short phrase)';
      default:
        return 'Your submission';
    }
  }

  getSimpleModePlaceholder(): string {
    switch (this.gameState) {
      case GameState.WHAT_DO_WE_FEAR:
        return 'e.g., The Shadow King, The Corporate Overlords, The AI...';
      case GameState.WHAT_ARE_WE_CAPABLE_OF:
        return 'e.g., Stealth, Leadership, Magic, Technology...';
      default:
        return 'Enter your submission...';
    }
  }

  getSubmitButtonText(): string {
    switch (this.gameState) {
      case GameState.WHAT_DO_WE_FEAR:
        return 'Submit Fear';
      case GameState.WHAT_ARE_WE_CAPABLE_OF:
        return 'Submit Capability';
      default:
        return 'Submit';
    }
  }

  getSimpleModeSubmittedTitle(): string {
    switch (this.gameState) {
      case GameState.WHAT_DO_WE_FEAR:
        return 'Your fear has been submitted!';
      case GameState.WHAT_ARE_WE_CAPABLE_OF:
        return 'Your capability has been submitted!';
      default:
        return 'Your submission has been submitted!';
    }
  }

  getSimpleModeSubmittedMessage(): string {
    switch (this.gameState) {
      case GameState.WHAT_DO_WE_FEAR:
        return 'Wait for other players to submit their ideas, then we\'ll vote on them.';
      case GameState.WHAT_ARE_WE_CAPABLE_OF:
        return 'Wait for other players to submit their capabilities, then we\'ll vote on them.';
      default:
        return 'Wait for other players to submit their ideas, then we\'ll vote on them.';
    }
  }

  private hasSubmissionsChanged(currentSubmissions: TextSubmission[]): boolean {
    // If we don't have previous submissions, this is a change
    if (this.lastKnownSubmissions.length === 0) {
      this.lastKnownSubmissions = [...currentSubmissions];
      return currentSubmissions.length > 0;
    }
    
    // Check if the number of submissions changed
    if (this.lastKnownSubmissions.length !== currentSubmissions.length) {
      this.lastKnownSubmissions = [...currentSubmissions];
      return true;
    }
    
    // Check if any submission IDs have changed (new submissions added)
    const currentIds = currentSubmissions.map(s => s.submissionId).sort();
    const lastIds = this.lastKnownSubmissions.map(s => s.submissionId).sort();
    
    const hasNewSubmissions = !currentIds.every((id, index) => id === lastIds[index]);
    
    if (hasNewSubmissions) {
      this.lastKnownSubmissions = [...currentSubmissions];
      return true;
    }
    
    // No changes detected
    return false;
  }

  onSubmitNewText() {
    if (this.newTextControl.invalid || !this.newTextControl.value) return;

    const textAddition: TextAddition = {
      additionId: '',
      authorId: this.player.authorId,
      addedText: this.newTextControl.value.trim(),
      submissionId: null, // This indicates a new submission
      outcomeType: this.playerOutcomeType || undefined // Include outcomeType for WHAT_WILL_BECOME_OF_US
    };

    this.isLoading = true;
    this.gameService.submitTextAddition(this.gameCode, textAddition).subscribe({
      next: (phase) => {
        this.collaborativePhase = phase;
        this.hasSubmitted = true;
        this.showNewSubmission = false;
        this.newTextControl.reset();
        this.availableSubmissions = [];
        this.maximumSubmissionsReached = false;
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
        this.maximumSubmissionsReached = false;
        this.collaborativePhase = phase;
        this.additionTextControl.reset();
        this.selectedSubmission = null;
        this.availableSubmissions = [];

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
    return submission.currentText;
  }

  getSubmissionAuthor(submission: TextSubmission): string {
    // In a real app, you might want to look up the actual player name
    return `Player ${submission.authorId}`;
  }

  // Helper methods for WHAT_WILL_BECOME_OF_US phase
  isWhatWillBecomeOfUsPhase(): boolean {
    return this.gameState === GameState.WHAT_WILL_BECOME_OF_US;
  }

  isPlayerSubmission(submission: TextSubmission): boolean {
    return submission.authorId === this.player.authorId;
  }

  getOutcomeTypeLabel(outcomeType: string | undefined): string {
    if (!outcomeType) return '';
    return outcomeType.charAt(0).toUpperCase() + outcomeType.slice(1);
  }

  getOutcomeTypeMessage(outcomeType: string | undefined): string {
    if (!outcomeType) return '';
    switch (outcomeType) {
      case 'success':
        return 'You are writing a SUCCESS ending';
      case 'neutral':
        return 'You are writing a NEUTRAL ending';
      case 'failure':
        return 'You are writing a FAILURE ending';
      default:
        return '';
    }
  }

  getOutcomeTypeClass(outcomeType: string | undefined): string {
    if (!outcomeType) return '';
    return `outcome-${outcomeType}`;
  }
}
