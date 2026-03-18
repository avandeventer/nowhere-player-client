import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RepercussionTypeOption } from '../assets/repercussion-type-option';
import { Repercussion } from '../assets/repercussion';

@Component({
  selector: 'repercussion-toggle',
  templateUrl: './repercussion-toggle.component.html',
  styleUrl: './repercussion-toggle.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ]
})
export class RepercussionToggleComponent implements OnChanges {
  @Input() repercussionTypes: RepercussionTypeOption[] = [];
  @Output() repercussionChange = new EventEmitter<Repercussion | null>();
  @Output() validityChange = new EventEmitter<boolean>();

  toggledType: string | null = null;
  submissionText = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['repercussionTypes']) {
      this.toggledType = null;
      this.submissionText = '';
      this.emitChanges();
    }
  }

  get activeType(): RepercussionTypeOption | null {
    return this.repercussionTypes.find(r => r.name === this.toggledType) ?? null;
  }

  get isValid(): boolean {
    if (!this.toggledType || !this.activeType) return true;
    return !this.activeType.label || this.submissionText.trim().length > 0;
  }

  isToggled(repType: RepercussionTypeOption): boolean {
    return this.toggledType === repType.name;
  }

  toggle(repType: RepercussionTypeOption) {
    this.toggledType = this.toggledType === repType.name ? null : repType.name;
    this.submissionText = '';
    this.emitChanges();
  }

  onTextChange() {
    this.emitChanges();
  }

  private emitChanges() {
    this.validityChange.emit(this.isValid);
    if (!this.toggledType || !this.activeType || !this.isValid) {
      this.repercussionChange.emit(null);
    } else {
      this.repercussionChange.emit({
        repercussionType: this.activeType.name,
        repercussionSubmission: this.activeType.label ? this.submissionText.trim() : null,
      });
    }
  }
}
