import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Trait, TraitType } from '../assets/trait';

@Component({
  selector: 'trait-badges',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trait-badges.component.html',
  styleUrl: './trait-badges.component.scss'
})
export class TraitBadgesComponent {
  @Input() traits: Trait[] = [];

  getBadgeColor(traitType: TraitType | undefined): string {
    return traitType?.color || '#0288d1';
  }

  getBadgePrefix(traitType: TraitType | undefined): string {
    return (traitType?.name || 'Trait').toLowerCase();
  }
}