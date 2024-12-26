import { Component } from '@angular/core';
import { JoinGameComponent } from '../join-game/join-game';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-root',
    template: `<join-game></join-game>`,
    imports: [ReactiveFormsModule, JoinGameComponent],
    standalone: true
})
export class AppComponent {}