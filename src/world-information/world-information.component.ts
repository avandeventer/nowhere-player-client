import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { GameSessionDisplay } from 'src/assets/game-session-display';
import { CollaborativeTextPhaseInfo } from 'src/assets/collaborative-text-phase-info';
import { GameBoardComponent } from '../game-board/game-board.component';

@Component({
  selector: 'app-world-information',
  templateUrl: './world-information.component.html',
  styleUrls: ['./world-information.component.scss'],
  imports: [MatButtonModule, MatCardModule, MatIconModule, GameBoardComponent],
  standalone: true
})
export class WorldInformationComponent implements OnInit {
  @Input() gameCode: string = "";
  @Input() phaseInfo: CollaborativeTextPhaseInfo | null = null;
  // Loaded once at startup by game-state-manager; the map's display text doesn't change in DUNGEON_MODE
  @Input() gameSessionDisplay: GameSessionDisplay | null = null;
  showWorldInfo: boolean = false;

  ngOnInit(): void {}

  toggleWorldInfo() {
    this.showWorldInfo = !this.showWorldInfo;
  }
}

