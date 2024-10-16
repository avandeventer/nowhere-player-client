import { Component } from '@angular/core';
import { JoinGameComponent } from '../join-game/join-game';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  template: `<join-game></join-game>`,
  standalone: true,
  imports: [ReactiveFormsModule, JoinGameComponent],
})
export class AppComponent {}