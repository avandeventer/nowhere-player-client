import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Story } from '../assets/story';
import { GameState } from '../assets/game-state';
import { TextSubmission } from '../assets/collaborative-text-phase';
import { Option } from '../assets/option';
import { CollaborativeTextPhaseInfo, PhaseType } from '../assets/collaborative-text-phase-info';
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
  @Input() gameState: any = null;
  @Input() submissions: TextSubmission[] = [];
  @Input() outcomeDisplay: string[] = [];
  @Output() playerDone = new EventEmitter<ComponentType>();

  selectedOptionId: string | null = null;
  isLoading = false;
  hasVoted = false;
  isPlayerTurn: boolean = false;

  constructor(private gameService: GameService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.isPartnerChoiceVotingPhase() || this.isAcceptPartnerChoiceVotingPhase()) {
      if (changes['submissions'] || changes['gameState']) {
        this.isPlayerTurn = this.submissions.length > 0;
      }
    } else if (this.phaseInfo?.phaseType === PhaseType.VOTING && changes['submissions']) {
      this.isPlayerTurn = this.submissions.length > 0;
    }

    if (this.phaseInfo?.phaseType === PhaseType.WINNING && changes['phaseInfo']) {
      this.isPlayerTurn = this.phaseInfo?.storyToIterateOn?.playerIds?.includes(this.player?.authorId) ?? false;
    }
  }

  nextGamePhase() {
    this.gameService.nextGamePhase(this.gameCode);
  }

  get story(): Story | undefined {
    return this.phaseInfo?.storyToIterateOn;
  }

  isLocationOptionChoicePhase(): boolean {
    return this.gameState === GameState.LOCATION_OPTION_MAKE_CHOICE_VOTING 
    || this.gameState === GameState.LOCATION_OPTION_MAKE_CHOICE_WINNER;
  }

  isPartnerChoiceVotingPhase(): boolean {
    return this.gameState === GameState.MAKE_PARTNER_CHOICE_VOTING;
  }

  isAcceptPartnerChoiceVotingPhase(): boolean {
    return this.gameState === GameState.ACCEPT_PARTNER_CHOICE_VOTING;
  }

  isPartnerChoicePhase(): boolean {
    return this.gameState === GameState.MAKE_PARTNER_CHOICE_VOTING
      || this.gameState === GameState.MAKE_PARTNER_CHOICE_WINNER
      || this.gameState === GameState.ACCEPT_PARTNER_CHOICE_VOTING
      || this.gameState === GameState.ACCEPT_PARTNER_CHOICE_WINNER;
  }

  getOptions(): Option[] {
    return this.story?.options || [];
  }

  getEffectiveOptions(): Option[] {
    if (this.isLocationOptionChoicePhase()) {
      return this.story?.location?.options || [];
    }
    return this.getOptions();
  }

  getEffectiveSelectedOptionId(): string | undefined {
    if (this.isLocationOptionChoicePhase()) {
      return this.story?.location?.selectedOptionId || undefined;
    }
    return this.story?.selectedOptionId || undefined;
  }

  getEffectiveSelectedOption(): Option | undefined {
    const selectedId = this.getEffectiveSelectedOptionId();
    if (!selectedId) return undefined;
    return this.getEffectiveOptions().find(o => o.optionId === selectedId);
  }

  getEffectiveDisplayText(): string | undefined {
    const option = this.getEffectiveSelectedOption();
    if (!option) return undefined;
    const text = this.isLocationOptionChoicePhase() ? option.attemptText : option.successText;
    return text || undefined;
  }

  isEffectiveOptionSelected(option: Option): boolean {
    const selectedId = this.getEffectiveSelectedOptionId();
    return !!selectedId && selectedId === option.optionId;
  }

  selectOption(option: Option) {
    if (this.hasVoted || this.isLoading) return;
    this.selectedOptionId = option.optionId;
  }

  selectOptionById(id: string) {
    if (this.hasVoted || this.isLoading) return;
    this.selectedOptionId = id;
  }

  submitPartnerChoice() {
    if (this.selectedOptionId === '__skip__') {
      this.skipChoice();
    } else {
      this.submitVote();
    }
  }

  submitAcceptChoice() {
    if (this.selectedOptionId === '__skip__') {
      this.skipChoice();
    } else {
      this.submitVote();
    }
  }

  skipChoice() {
    this.playerDone.emit(ComponentType.VOTING);
  }

  getSelectedOption(): Option | undefined {
    return this.getEffectiveSelectedOption();
  }

  isOptionSelected(option: Option): boolean {
    return this.isEffectiveOptionSelected(option);
  }

  submitVote() {
    if (!this.selectedOptionId || !this.player || this.hasVoted || this.isLoading) {
      return;
    }

    this.isLoading = true;

    const playerVote = new PlayerVote(this.player.authorId, this.selectedOptionId, 1);

    this.gameService.submitPlayerVotes(this.gameCode, [playerVote]).subscribe({
      next: () => {
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

