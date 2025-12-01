import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { GameService } from '../services/game-session.service';
import { GameBoard } from '../assets/game-board';
import { Encounter } from '../assets/encounter';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss'
})
export class GameBoardComponent implements OnInit, OnChanges {
  @Input() gameCode: string = '';
  
  gameBoard: GameBoard | null = null;
  isLoading = false;
  currentEncounter: Encounter | null = null;
  northEncounter: Encounter | null = null;
  southEncounter: Encounter | null = null;
  eastEncounter: Encounter | null = null;
  westEncounter: Encounter | null = null;
  northwestEncounter: Encounter | null = null;
  northeastEncounter: Encounter | null = null;
  southeastEncounter: Encounter | null = null;
  southwestEncounter: Encounter | null = null;

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.loadGameBoard();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gameCode'] && this.gameCode) {
      this.loadGameBoard();
    }
  }

  private loadGameBoard() {
    if (!this.gameCode) return;
    
    this.isLoading = true;
    this.gameService.getGameBoard(this.gameCode).subscribe({
      next: (gameBoard: GameBoard) => {
        this.gameBoard = gameBoard;
        this.updateDisplayedEncounters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading game board:', error);
        this.isLoading = false;
      }
    });
  }

  private updateDisplayedEncounters() {
    if (!this.gameBoard || !this.gameBoard.playerCoordinates) {
      return;
    }

    const playerCoords = this.gameBoard.playerCoordinates;
    const x = playerCoords.xCoordinate;
    const y = playerCoords.yCoordinate;

    // Get current location encounter
    this.currentEncounter = this.getEncounterAt(x, y);
    
    // Get adjacent encounters (north, south, east, west)
    this.northEncounter = this.getEncounterAt(x, y + 1);
    this.southEncounter = this.getEncounterAt(x, y - 1);
    this.eastEncounter = this.getEncounterAt(x + 1, y);
    this.westEncounter = this.getEncounterAt(x - 1, y);
    
    // Get diagonal encounters
    this.northwestEncounter = this.getEncounterAt(x - 1, y + 1);
    this.northeastEncounter = this.getEncounterAt(x + 1, y + 1);
    this.southeastEncounter = this.getEncounterAt(x + 1, y - 1);
    this.southwestEncounter = this.getEncounterAt(x - 1, y - 1);
  }

  private getEncounterAt(x: number, y: number): Encounter | null {
    if (!this.gameBoard || !this.gameBoard.dungeonGrid) {
      return null;
    }
    const key = `${x},${y}`;
    return this.gameBoard.dungeonGrid[key] || null;
  }

  getEncounterIcon(encounter: Encounter | null): string {
    if (!encounter) {
      return 'help_outline';
    }
    if (encounter.visited) {
      return 'check_circle';
    }
    return 'explore';
  }
}

