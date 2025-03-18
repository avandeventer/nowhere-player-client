import { HttpClient } from "@angular/common/http";
import { Component, ComponentRef, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ComponentType } from "src/assets/component-type";
import { Ending } from "src/assets/ending";
import { GameState } from "src/assets/game-state";
import { HttpConstants } from "src/assets/http-constants";
import { Player } from "src/assets/player";
import { RitualOption } from "src/assets/ritual-option";
import { Story } from "src/assets/story";
import { environment } from "src/environments/environment";
import { PrequelDisplayComponent } from "src/prequel-story-display/prequel-story-display.component";

@Component({
    selector: 'write-endings',
    templateUrl: './write-endings.component.html',
    imports: [
      ReactiveFormsModule, 
      PrequelDisplayComponent,
      FormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatButtonModule,
      MatDividerModule
    ],
    standalone: true
})
export class WriteEndingsComponent implements OnInit {
  @Input() gameState: GameState = GameState.WRITE_ENDINGS;
  @Input() gameCode: string = "";
  @Input() player: Player = new Player();
  @Output() playerDone = new EventEmitter<ComponentType>();
  authorEnding: Ending = new Ending();
  playerEnding: Ending = new Ending();
  legacySelected: boolean = false;
  ending = new FormControl();
  endingSubmitted: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.getAuthorEnding(this.player.authorId);
  }

  selectStory(associatedStory: Story) {
    this.playerEnding.playerId = this.authorEnding.playerId;
    this.playerEnding.authorId = this.authorEnding.authorId;
    this.playerEnding.didWeSucceed = this.authorEnding.didWeSucceed;
    this.playerEnding.playerUsername = this.authorEnding.playerUsername;
    this.playerEnding.associatedStories = [associatedStory];
    this.legacySelected = true;
    this.authorEnding = this.playerEnding;
  } 

  selectRitual(ritualOption: RitualOption) {
    this.playerEnding.playerId = this.authorEnding.playerId;
    this.playerEnding.authorId = this.authorEnding.authorId;
    this.playerEnding.didWeSucceed = this.authorEnding.didWeSucceed;
    this.playerEnding.playerUsername = this.authorEnding.playerUsername;
    this.playerEnding.associatedRitualOption = ritualOption;
    this.legacySelected = true;
    this.authorEnding = this.playerEnding;
  } 

  getAuthorEnding(authorId: string) {
    const params = {
      gameCode: this.gameCode,
      authorId: authorId,
    };

    console.log(params);

    this.http
      .get<Ending>(environment.nowhereBackendUrl + HttpConstants.ENDING_PATH, { params })
      .subscribe({
        next: (response) => {
          console.log('Ending retrieved!', response);
          this.authorEnding = response;
        },
        error: (error) => {
          console.error('Error retrieving ending', error);
        },
      });
  }

  submitEnding() {
    this.playerEnding.endingBody = this.ending.value;

    console.log("Submitting ending", this.playerEnding);

    this.http
      .put(environment.nowhereBackendUrl + HttpConstants.ENDING_PATH + "?gameCode=" + this.gameCode, this.playerEnding)
      .subscribe({
        next: (response) => {
          console.log('Ending updated!', response);
          this.endingSubmitted = true;
          this.playerDone.emit(ComponentType.WRITE_ENDINGS);
        },
        error: (error) => {
          console.error('Error updating story', error);
        },
      });
  }
}