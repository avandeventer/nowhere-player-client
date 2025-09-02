import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { HttpConstants } from 'src/assets/http-constants';
import { environment } from 'src/environments/environment';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { StatType } from 'src/assets/stat-type';
import { MatCardModule } from '@angular/material/card';
import { RepercussionOutput } from 'src/assets/repercussion-output';
import { PlayerStat } from 'src/assets/player-stat';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'repercussions',
  templateUrl: './repercussions.component.html',
  imports: [
    MatDialogModule, 
    MatFormFieldModule,
    MatFormField, 
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatChipSet,
    MatChip,
    MatButtonModule
],
  styleUrls: ['./repercussions.component.scss'],
  standalone: true
})
export class RepercussionsComponent {
  repercussions: RepercussionOutput = new RepercussionOutput();
  optionOneRepercussion = '';
  optionTwoRepercussion = '';
  favorStatType: StatType = new StatType();
  uniqueArtifactStatTypes: Record<number, Array<StatType>> = {};

  ngOnInit() {
    this.favorStatType = this.data.favorStatType;
  }

  constructor(
    public dialogRef: MatDialogRef<RepercussionsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      gameCode: string;
      repercussionOutput: any;
      favorStatType: StatType;
    },
    private http: HttpClient
  ) {
    this.repercussions = this.data.repercussionOutput;
    this.uniqueArtifactStatTypes[0] = this.uniqueStatTypes(0);
    this.uniqueArtifactStatTypes[1] = this.uniqueStatTypes(1);
  }

  get endingOptions() {
    return this.repercussions?.ending?.options ?? [];
  }

  public uniqueStatTypes(endingArtifactIndex: number): Array<StatType> {
    const firstOption = this.endingOptions[endingArtifactIndex] ?? [];
  
    return Array.from(
      new Map(
        firstOption.playerStatDCs.map(ps => [ps.statType.id, ps.statType])
      ).values()
    );
  }

  submitOptions() {
    this.postNewEndingRituals();
  }

  public statDCDifficulty(playerStat: PlayerStat) {
    let statDC: number = playerStat.value;
    if (statDC >= 7) {
      return "HARD";
    }

    else if (statDC < 7 && statDC >= 4) {
      return "NORMAL";
    }

    else {
      return "EASY";
    }
  }

  postNewEndingRituals() {
    const { gameCode, repercussionOutput } = this.data;

    repercussionOutput.ending.gameCode = gameCode;

    console.log("Submitting ending update", repercussionOutput.ending);

    this.http
      .post(environment.nowhereBackendUrl + HttpConstants.RITUAL_PATH, repercussionOutput.ending)
      .subscribe({
        next: (response) => {
          console.log('Ending updated!', response);
          this.dialogRef.close({
            ending: response
          });      
        },
        error: (error) => {
          console.error('Error updating ending', error);
          throw new Error(error);
        },
      });
  }

  close() {
    this.dialogRef.close();
  }
}
