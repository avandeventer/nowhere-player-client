import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Repercussion } from '../assets/repercussion';

@Component({
  selector: 'repercussion-badges',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './repercussion-badges.component.html',
  styleUrl: './repercussion-badges.component.scss'
})
export class RepercussionBadgesComponent {
  @Input() repercussions: Repercussion[] = [];
}