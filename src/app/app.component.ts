import { Component } from '@angular/core';
import { JoinGameComponent } from '../join-game/join-game';

@Component({
  selector: 'app-root',
  template: `<join-game></join-game>`,
  standalone: true,
  imports: [JoinGameComponent],
})
export class AppComponent {}