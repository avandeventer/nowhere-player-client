import { Component } from '@angular/core';
import { GameSessionComponent } from '../game-session/game-session.component';

@Component({
  selector: 'app-root',
  template: `<game-session></game-session>`,
  standalone: true,
  imports: [GameSessionComponent],
})
export class AppComponent {}
