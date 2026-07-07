import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { GameService } from '../services/game-session.service';
import { Player } from '../assets/player';
import { PlayerClassOption } from '../assets/player-class-option';
import { ComponentType } from '../assets/component-type';
import { GameState } from '../assets/game-state';
import { TraitBadgesComponent } from '../trait-badges/trait-badges.component';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    TraitBadgesComponent,
  ]
})
export class PlayerComponent implements OnInit, OnChanges {
  @Input() gameCode: string = '';
  @Input() player: Player = new Player();
  @Input() gameState: GameState = GameState.INIT;
  @Output() playerDone = new EventEmitter<ComponentType>();

  availableClasses: PlayerClassOption[] = [];
  selectedClass: PlayerClassOption | null = null;
  hasSubmittedClass = false;
  classAccordionExpanded = true;

  isLoading = false;

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
    if (this.isInitMode()) {
      this.loadClasses();
    } else if (this.isWhoAreYouMode()) {
      this.playerDone.emit(ComponentType.WHO_ARE_YOU);
    }
  }

  isInitMode(): boolean {
    return this.gameState === GameState.INIT;
  }

  isWhoAreYouMode(): boolean {
    return this.gameState === GameState.WHO_ARE_YOU;
  }

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
        this.playerDone.emit(ComponentType.INIT);
      },
      error: (error) => {
        console.error('Error updating player class:', error);
        this.isLoading = false;
      }
    });
  }
}
