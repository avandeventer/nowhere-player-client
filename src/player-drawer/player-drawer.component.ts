import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
import { Player } from '../assets/player';
import { Trait } from '../assets/trait';
import { TraitBadgesComponent } from '../trait-badges/trait-badges.component';

const TAB_HEIGHT_CSS_VAR = '--player-drawer-tab-height';

@Component({
  selector: 'player-drawer',
  standalone: true,
  imports: [CommonModule, MatRippleModule, TraitBadgesComponent],
  templateUrl: './player-drawer.component.html',
  styleUrl: './player-drawer.component.scss'
})
export class PlayerDrawerComponent implements AfterViewInit, OnDestroy {
  @Input() player: Player = new Player();
  // True when the drawer shows someone other than the current player
  @Input() assigned = false;

  @ViewChild('sheet', { static: true }) sheetRef!: ElementRef<HTMLElement>;
  @ViewChild('tab', { static: true }) tabRef!: ElementRef<HTMLElement>;

  expanded = false;
  dragging = false;
  translateY = 0;
  entering = true;

  private collapsedTranslate = 0;
  private dragStartY = 0;
  private dragStartTranslate = 0;
  private pointerMoved = false;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit() {
    this.measure();
    this.resizeObserver = new ResizeObserver(() => this.measure());
    this.resizeObserver.observe(this.sheetRef.nativeElement);
    this.resizeObserver.observe(this.tabRef.nativeElement);

    // Double rAF ensures the offscreen "entering" state has actually painted
    // before we drop it, so the slide-up transition has a real starting frame.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.entering = false;
      });
    });
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    document.documentElement.style.removeProperty(TAB_HEIGHT_CSS_VAR);
  }

  private measure() {
    const sheetHeight = this.sheetRef.nativeElement.offsetHeight;
    const tabHeight = this.tabRef.nativeElement.offsetHeight;
    this.collapsedTranslate = Math.max(sheetHeight - tabHeight, 0);
    if (!this.dragging) {
      this.translateY = this.expanded ? 0 : this.collapsedTranslate;
    }
    // Published globally so any page content that can end up underneath this
    // fixed, always-on-top drawer can reserve exactly enough scroll clearance
    // to clear its collapsed tab, without guessing a fixed pixel value.
    document.documentElement.style.setProperty(TAB_HEIGHT_CSS_VAR, `${tabHeight}px`);
  }

  onPointerDown(event: PointerEvent) {
    this.dragging = true;
    this.pointerMoved = false;
    this.dragStartY = event.clientY;
    this.dragStartTranslate = this.translateY;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent) {
    if (!this.dragging) return;
    const deltaY = event.clientY - this.dragStartY;
    if (Math.abs(deltaY) > 4) this.pointerMoved = true;
    this.translateY = Math.min(Math.max(this.dragStartTranslate + deltaY, 0), this.collapsedTranslate);
  }

  onPointerUp() {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.pointerMoved) {
      const midpoint = this.collapsedTranslate / 2;
      this.setExpanded(this.translateY < midpoint);
    }
    // A plain tap (no movement) is left to the button's own click event so
    // keyboard activation (Enter/Space) and pointer taps share one code path.
  }

  onTabClick() {
    if (this.pointerMoved) return; // click following a real drag; already resolved above
    this.setExpanded(!this.expanded);
  }

  private setExpanded(expanded: boolean) {
    this.expanded = expanded;
    this.translateY = expanded ? 0 : this.collapsedTranslate;
  }

  destinyTraits(): Trait[] {
    return this.player.traits?.filter(t => t.traitType?.name === 'Destiny') ?? [];
  }

  nonDestinyTraits(): Trait[] {
    return this.player.traits?.filter(t => t.traitType?.name !== 'Destiny') ?? [];
  }
}
