import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { GameService } from '../services/game-session.service';
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
  
  gameSessionDisplay: GameSessionDisplay | null = null;
  showWorldInfo: boolean = false;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {}

  loadWorldInfo() {
    this.gameService.getGameSessionDisplay(this.gameCode)
      .subscribe({
        next: (response: GameSessionDisplay) => {
          console.log('Game session display retrieved!', response);
          this.gameSessionDisplay = response;
          this.showWorldInfo = true;
        },
        error: (error: any) => {
          console.error('Error retrieving game session display', error);
        },
      });
  }

  toggleWorldInfo() {
    if (this.showWorldInfo) {
      this.showWorldInfo = false;
    } else {
      this.loadWorldInfo();
    }
  }
}

