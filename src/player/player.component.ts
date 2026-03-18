import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { GameService } from '../services/game-session.service';
import { Player } from '../assets/player';
import { Trait } from '../assets/trait';
import { PlayerClassOption } from '../assets/player-class-option';
import { ComponentType } from '../assets/component-type';
import { GameState } from '../assets/game-state';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatExpansionModule,
    MatIconModule,
  ]
})
export class PlayerComponent implements OnInit, OnChanges {
  @Input() gameCode: string = '';
  @Input() player: Player = new Player();
  @Input() gameState: GameState = GameState.INIT;
  @Output() playerDone = new EventEmitter<ComponentType>();

  // Class selection (INIT mode)
  availableClasses: PlayerClassOption[] = [];
  selectedClass: PlayerClassOption | null = null;
  hasSubmittedClass = false;
  classAccordionExpanded = true;

  // Trait selection (INIT and WHO_ARE_YOU modes)
  availableTraits: Trait[] = [];
  selectedTraits: Trait[] = [];
  hasSubmittedTraits = false;

  isLoading = false;
  readonly MAX_TRAITS = 3;

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.loadPlayerData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gameState']) {
      this.loadPlayerData();
    }
  }

  private loadPlayerData() {
    if (this.isInitMode() || this.isWhoAreYouMode()) {
      this.loadClasses();
      this.loadTraits();
    }
  }

  isInitMode(): boolean {
    return this.gameState === GameState.INIT;
  }

  isWhoAreYouMode(): boolean {
    return this.gameState === GameState.WHO_ARE_YOU;
  }

  // Class methods
  private loadClasses() {
    this.isLoading = true;
    this.gameService.getPlayerClasses().subscribe({
      next: (classes) => {
        this.availableClasses = classes;
        if (this.player.playerClass) {
          this.selectedClass = classes.find(c => c.name === this.player.playerClass?.name) ?? null;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading player classes:', error);
        this.isLoading = false;
      }
    });
  }

  selectClass(playerClass: PlayerClassOption) {
    this.selectedClass = playerClass;
    this.submitClass();
  }

  isClassSelected(playerClass: PlayerClassOption): boolean {
    return this.selectedClass?.name === playerClass.name;
  }

  submitClass() {
    if (!this.selectedClass) return;
    this.isLoading = true;
    const updatedPlayer: Player = { ...this.player, playerClass: this.selectedClass };
    this.gameService.updatePlayer(updatedPlayer).subscribe({
      next: () => {
        this.hasSubmittedClass = true;
        this.classAccordionExpanded = false;
        this.player = updatedPlayer;
        this.isLoading = false;
        this.checkAndEmitDone();
      },
      error: (error) => {
        console.error('Error updating player class:', error);
        this.isLoading = false;
      }
    });
  }

  // Trait methods
  private loadTraits() {
    this.isLoading = true;
    this.gameService.getTraits(this.gameCode).subscribe({
      next: (traits) => {
        this.availableTraits = traits;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading traits:', error);
        this.isLoading = false;
      }
    });
  }

  toggleTrait(trait: Trait) {
    const index = this.selectedTraits.findIndex(t => t.traitId === trait.traitId);
    if (index !== -1) {
      this.selectedTraits.splice(index, 1);
    } else if (this.selectedTraits.length < this.MAX_TRAITS) {
      this.selectedTraits.push(trait);
    }
  }

  isTraitSelected(trait: Trait): boolean {
    return this.selectedTraits.some(t => t.traitId === trait.traitId);
  }

  canSelectTrait(trait: Trait): boolean {
    return this.isTraitSelected(trait) || this.selectedTraits.length < this.MAX_TRAITS;
  }

  submitTraits() {
    if (this.selectedTraits.length === 0) return;
    this.isLoading = true;
    const updatedPlayer: Player = { ...this.player, traits: this.selectedTraits };
    this.gameService.updatePlayer(updatedPlayer).subscribe({
      next: () => {
        this.hasSubmittedTraits = true;
        this.player = updatedPlayer;
        this.isLoading = false;
        this.checkAndEmitDone();
      },
      error: (error) => {
        console.error('Error updating player traits:', error);
        this.isLoading = false;
      }
    });
  }

  private checkAndEmitDone() {
    if (this.isWhoAreYouMode() && this.hasSubmittedTraits) {
      this.playerDone.emit(ComponentType.WHO_ARE_YOU);
    } else if (this.isInitMode() && this.hasSubmittedClass && this.hasSubmittedTraits) {
      this.playerDone.emit(ComponentType.INIT);
    }
  }
}
