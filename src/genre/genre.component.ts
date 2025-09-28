import { Component, Input } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { GameState } from 'src/assets/game-state';
import { Player } from 'src/assets/player';
import { GameService } from 'src/services/game-session.service';

@Component({
  selector: 'app-genre',
  standalone: true,
  imports: [],
  templateUrl: './genre.component.html',
  styles: ``
})
export class GenreComponent {
  @Input() gameCode: string = "";
  @Input() gameState: GameState = GameState.INIT;
  @Input() player: Player = new Player();

  constructor(
    private gameService: GameService
  ) {}

  genre = new FormControl('', { validators: [Validators.maxLength(40)] });

  submitGenre() {
    console.log('Submitting genre', this.genre.value);
    this.gameService.submitGenre(this.gameCode, this.player.authorId, this.genre.value);
  }
}
