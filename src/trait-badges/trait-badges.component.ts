import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Trait } from '../assets/trait';

@Component({
  selector: 'trait-badges',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trait-badges.component.html',
  styleUrl: './trait-badges.component.scss'
})
export class TraitBadgesComponent {
  @Input() traits: Trait[] = [];

  getBadgeColor(traitType: string): string {
    switch (traitType?.toUpperCase()) {
      case 'TITLE': return '#7b1fa2';
      case 'COMPANION': return '#E60000';
      case 'RELATIONSHIP': return '#E981AE';
      default: return '#0288d1';
    }
  }

  getBadgePrefix(traitType: string): string {
    if (!traitType || traitType.toUpperCase() === 'STANDARD') return 'trait';
    return traitType.toLowerCase();
  }
}