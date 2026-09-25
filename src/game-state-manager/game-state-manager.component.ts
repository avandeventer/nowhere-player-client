import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { GameService } from '../services/game-session.service';
import { HttpClient } from '@angular/common/http';
import { GameState } from 'src/assets/game-state';
import { WritePromptComponent } from 'src/write-prompt/write-prompt.component';
import { Player } from 'src/assets/player';
import { WriteOutcomesComponent } from 'src/write-options/write-outcomes.component';
import { ActivePlayerSession } from 'src/assets/active-player-session';
import { AdventureComponent } from 'src/adventure/adventure.component';
import { HttpConstants } from 'src/assets/http-constants';
import { environment } from 'src/environments/environment';
import { LocationComponent } from 'src/location/location.component';
import { RitualComponent } from 'src/ritual/ritual.component';
import { ComponentType, ComponentTypeGameStateMap } from 'src/assets/component-type';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { WriteEndingsComponent } from 'src/write-endings/write-endings.component';
import { GenreComponent } from 'src/genre/genre.component';
import { EndingComponent } from 'src/ending/ending.component';
import { AdventureMap } from 'src/assets/adventure-map';
import { CollaborativeTextComponent } from 'src/collaborative-text/collaborative-text.component';
import { VotingComponent } from 'src/voting/voting.component';
import { WriteLocationPromptComponent } from 'src/write-location-prompt/write-location-prompt.component';
import { WriteLocationOutcomesComponent } from 'src/write-location-outcomes/write-location-outcomes.component';
import { WorldInformationComponent } from 'src/world-information/world-information.component';
import { CollaborativeTextPhaseInfo, PhaseType } from 'src/assets/collaborative-text-phase-info';
import { PlayerComponent } from 'src/player/player.component';
import { PlayerDrawerComponent } from 'src/player-drawer/player-drawer.component';

@Component({
    selector: 'game-state-manager',
    templateUrl: './game-state-manager.component.html',
    styleUrls: ['./game-state-manager.component.scss'],
    imports: [
      WritePromptComponent,
      WriteOutcomesComponent,
      AdventureComponent,
      LocationComponent,
      RitualComponent,
      WriteEndingsComponent,
      EndingComponent,
      MatButtonModule,
      GenreComponent,
      WorldInformationComponent,
      CollaborativeTextComponent,
      VotingComponent,
      WriteLocationPromptComponent,
      WriteLocationOutcomesComponent,
      MatCardModule,
      MatIconModule,
      PlayerComponent,
      PlayerDrawerComponent,
    ],
    standalone: true,
    animations: [
      trigger('pyreVignette', [
        transition(':leave', [
          style({ animation: 'none' }), // freeze the flicker so the disperse starts from a clean scale
          animate('1000ms ease-in', style({ transform: 'scale(6)', opacity: 0 }))
        ])
      ])
    ]
})
export class GameStateManagerComponent implements OnInit {
  @Input() gameCode: string = "";
  @Input() player: Player = new Player();
  @Input() setDone(donePhase: ComponentType) {
    if(this.isValidGameState(donePhase, this.gameState)) {
      console.log('Player is done', donePhase, this.gameState)
      this.playerIsDone();
    } else {
      console.log('Skipped done event for component type with game phase', donePhase, this.gameState)
    }
  }
  gameState: GameState = null as unknown as GameState;
  @Output() gameStateChanged = new EventEmitter<GameState>();
  @Output() collaborativeTextPhaseChanged = new EventEmitter<any>();
  activePlayerSession: ActivePlayerSession = new ActivePlayerSession();
  storiesToWritePerRound: number = 1;
  storiesToPlayPerRound: number = 1;
  adventureMap: AdventureMap | null = null;
  collaborativeTextPhases: any = null;
  stories: any[] | null = null;
  collaborativeTextPhaseInfo: CollaborativeTextPhaseInfo | null = null;
  isDungeonMode = false;
  // Player whose story/epilogue is being written for, reported by collaborative-text
  assignedPlayer: Player | null = null;
  isContinuing = false;
  isLoadingPhaseInfo = false;

  constructor(
    private gameService: GameService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.gameService.listenForGameStateChanges(this.gameCode).subscribe((newState) => {
      if (this.gameState !== newState.gameState as unknown as GameState) {
        this.gameState = newState.gameState as unknown as GameState;
        this.gameStateChanged.emit(this.gameState);
        this.isContinuing = false;
        this.assignedPlayer = null;
        // Load phase info when game state changes
        this.loadCollaborativeTextPhaseInfo();
      }

      this.activePlayerSession = newState.activePlayerSession as unknown as ActivePlayerSession;
      this.storiesToWritePerRound = newState.storiesToWritePerRound as unknown as number;
      this.storiesToPlayPerRound = newState.storiesToPlayPerRound as unknown as number;
      this.adventureMap = newState.adventureMap as unknown as AdventureMap;
      this.isDungeonMode = newState.gameMode === 'DUNGEON_MODE';

      // Check for stories changes
      if (newState.stories && JSON.stringify(this.stories) !== JSON.stringify(newState.stories)) {
        this.stories = newState.stories;
      }

      // Check for collaborative text phase changes
      if (newState.collaborativeTextPhases && JSON.stringify(this.collaborativeTextPhases) !== JSON.stringify(newState.collaborativeTextPhases)) {
        this.collaborativeTextPhases = newState.collaborativeTextPhases;
        this.collaborativeTextPhaseChanged.emit(this.collaborativeTextPhases);
      }

      console.log('New gameState:', this.gameState);
    });

    // Load initial phase info
    this.loadCollaborativeTextPhaseInfo();
  }

  private loadCollaborativeTextPhaseInfo() {
    if (!this.gameCode) return;

    this.isLoadingPhaseInfo = true;
    this.gameService.getCollaborativeTextPhaseInfo(this.gameCode).subscribe({
      next: (phaseInfo: CollaborativeTextPhaseInfo) => {
        this.collaborativeTextPhaseInfo = phaseInfo;
        this.isLoadingPhaseInfo = false;
      },
      error: (error) => {
        console.error('Error loading collaborative text phase info:', error);
        this.collaborativeTextPhaseInfo = null;
        this.isLoadingPhaseInfo = false;
      }
    });
  }

  // True only while collaborativeTextPhaseInfo is being (re)fetched for a gameState that isn't
  // one of the other explicitly-named phases below — i.e. a SUBMISSION/VOTING/WINNING phase
  // (showPhaseHeader/isGameInCollaborativeTextPhase/isGameInVotingPhase) whose data hasn't
  // arrived yet. WHO_ARE_YOU is excluded to match isGameInCollaborativeTextPhase's own exclusion.
  isLoadingCollaborativePhase(): boolean {
    return (this.isLoadingPhaseInfo || this.activePlayerSession?.nextGameStateLoading)
      && this.gameState !== GameState.WHO_ARE_YOU
      && !this.isGameInitialized()
      && !this.isGameInLocationCreationPhase()
      && !this.isGameInLocationOutcomesCreationPhase()
      && !this.isGameInAdventurePhase()
      && !this.isGameInRitualPhase()
  }

  nextGamePhase() {
    this.isContinuing = true;
    this.gameService.nextGamePhase(this.gameCode).subscribe({
      // isContinuing resets once Firestore delivers the real gameState change (see ngOnInit)
      error: () => {
        this.isContinuing = false;
      }
    });
  }

  startTimer() {
    const activePlayerSession = new ActivePlayerSession();
    activePlayerSession.gameCode = this.gameCode;
    activePlayerSession.playerId = this.player.authorId;
    activePlayerSession.startTimer = true;

    this.http
      .put(environment.nowhereBackendUrl + HttpConstants.ACTIVE_PLAYER_SESSION_PATH, activePlayerSession)
      .subscribe({
        next: (response) => {
          console.log('Timer start request sent', response);
        },
        error: (error) => {
          console.error('Error starting timer', error);
        },
      });
  }

  playerIsDone() {
    const url = `${environment.nowhereBackendUrl}${HttpConstants.ACTIVE_GAME_STATE_SESSION_PATH}?gameCode=${this.gameCode}&gamePhase=${this.gameState.toString()}&authorId=${this.player.authorId}&isDone=${true}`;

    console.log("Player is done for phase:", this.gameState.toString());

    this.http
      .put(url, {})
      .subscribe({
        next: (response) => {
          console.log('Player done status updated successfully:', response);
        },
        error: (error) => {
          console.error('Error updating player done status:', error);
        },
      });
  }

  isValidGameState (component: ComponentType, state: GameState): boolean {
    return ComponentTypeGameStateMap[component].includes(state);
  };

  onCollaborativeTextPhaseChanged(phases: any) {
    // This method will be called by the collaborative-text component
    // when it needs to notify about phase changes
    this.collaborativeTextPhaseChanged.emit(phases);
  }

  isGameInitialized() {
    return this.gameState === GameState.INIT;
  }

  isGameInWritePromptsPhase() {
    return this.gameState === GameState.WRITE_PROMPTS || this.gameState === GameState.WRITE_PROMPTS_AGAIN;
  }

  isLocationSelect() {
    return this.gameState === GameState.LOCATION_SELECT || this.gameState === GameState.LOCATION_SELECT_AGAIN;
  }

  isGameInWritingPhase() {
    return this.isGameInWritePromptsPhase()
    || this.isGameInWriteOutcomesPhase()
    || this.isGameInWriteEndingsPhase()
    || this.isGameInCollaborativeTextPhase()
    || this.isGameInLocationCreationPhase()
    || this.isGameInLocationOutcomesCreationPhase()
    || this.isGameInWhatWillBecomeOfUsPhase()
  }

  isGameInPreamblePhase() {
    return this.gameState === GameState.PREAMBLE
    || this.gameState === GameState.PREAMBLE_AGAIN
    || this.gameState === GameState.ENDING_PREAMBLE
    || this.gameState === GameState.EPILOGUE_PREAMBLE;
  }

  isGameInWriteOutcomesPhase() {
    return this.gameState === GameState.WRITE_OPTIONS || this.gameState === GameState.WRITE_OPTIONS_AGAIN;
  }

  isGameInAdventurePhase() {
    return this.gameState === GameState.ROUND1 || this.gameState === GameState.ROUND2;
  }

  isGameInRitualPhase() {
    return this.gameState === GameState.RITUAL;
  }

  isGameInWhatWillBecomeOfUsPhase() {
    return this.gameState === GameState.WHAT_WILL_BECOME_OF_US;
  }

  isGameInWriteEndingsPhase() {
    return this.gameState === GameState.WRITE_ENDINGS;
  }

  isGameInEndingPhase() {
    return this.gameState === GameState.ENDING;
  }

  isGameInCollaborativeTextPhase() {
    return this.collaborativeTextPhaseInfo?.phaseType === PhaseType.SUBMISSION
      && this.gameState !== GameState.INIT
      && this.gameState !== GameState.WHO_ARE_YOU
      && !this.isGameInPreamblePhase();
  }

  isGameInVotingPhase() {
    return this.collaborativeTextPhaseInfo?.phaseType === PhaseType.VOTING
     || this.gameState === GameState.MAKE_OUTCOME_CHOICE_WINNER
     || this.gameState === GameState.LOCATION_OPTION_MAKE_CHOICE_WINNER
     || this.gameState === GameState.MAKE_PARTNER_CHOICE_WINNER
     || this.gameState === GameState.ACCEPT_PARTNER_CHOICE_WINNER;
  }

  isGameInCollaborativeTextWinningPhase() {
    return this.collaborativeTextPhaseInfo?.phaseType === PhaseType.WINNING && this.gameState !== GameState.MAKE_OUTCOME_CHOICE_WINNER;
  }

  showPhaseHeader(): boolean {
    return this.isGameInCollaborativeTextPhase()
      || this.isGameInVotingPhase()
      || this.isGameInCollaborativeTextWinningPhase()
      || this.isGameInPreamblePhase();
  }

  getPhaseHeaderQuestion(): string {
    return this.collaborativeTextPhaseInfo?.phaseQuestion
      || (this.isGameInVotingPhase() ? 'Vote on submissions' : 'Collaborative Writing');
  }

  getPhaseHeaderInstructions(): string {
    if (this.collaborativeTextPhaseInfo?.phaseInstructions) {
      return this.collaborativeTextPhaseInfo.phaseInstructions;
    }
    return this.isGameInVotingPhase()
      ? 'Click on submissions to rank them from best to worst. The first one you select will be ranked #1, the second will be #2, and so on.'
      : 'Work together to build your story!';
  }

  isGameInLocationCreationPhase() {
    return this.gameState === GameState.WHERE_CAN_WE_GO;
  }

  isGameInLocationOutcomesCreationPhase() {
    return this.gameState === GameState.WHAT_OCCUPATIONS_ARE_THERE;
  }

  showPlayerTraitsComponent() {
    return this.isDungeonMode
  }

  // Submission phases write for another player, so the drawer only appears (for that player)
  // in the states that have an assigned player, once that player has loaded.
  showPlayerDrawer() {
    if (!this.isDungeonMode) return false;
    if (!this.isGameInCollaborativeTextPhase()) return true;
    return this.isGameInAssignedPlayerPhase() && this.assignedPlayer !== null;
  }

  private isGameInAssignedPlayerPhase() {
    return this.gameState === GameState.HOW_DOES_THIS_RESOLVE
      || this.gameState === GameState.HOW_DOES_THIS_RESOLVE_AGAIN
      || this.gameState === GameState.WRITE_EPILOGUES;
  }
}
