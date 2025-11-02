import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GameState } from 'src/assets/game-state';
import { Player } from 'src/assets/player';
import { Location } from 'src/assets/location';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpConstants } from 'src/assets/http-constants';
import { environment } from 'src/environments/environment';
import { firstValueFrom } from 'rxjs';
import { ComponentType } from 'src/assets/component-type';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { StatType } from 'src/assets/stat-type';
import { WritePhase } from 'src/assets/phases/write-phase';

@Component({
  selector: 'write-location-prompt',
  templateUrl: './write-location-prompt.component.html',
  styleUrls: ['./write-location-prompt.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatChipSet,
    MatChip,
    MatCardModule
  ],
  standalone: true
})
export class WriteLocationPromptComponent implements OnInit {
  @Input() gameState: GameState = GameState.WHERE_CAN_WE_GO;
  @Input() gameCode: string = "";
  @Input() player: Player = new Player();
  @Output() playerDone = new EventEmitter<ComponentType>();

  location: Location = new Location();
  primaryStat: StatType = new StatType();
  hasProgressed: boolean = false;
  aboutToSubmit: boolean = false;
  
  phase: WritePhase = WritePhase.PROMPT;
  protected WritePhase = WritePhase;
  
  availableImages: string[] = [];
  selectedImage: string = '';

  locationLabel = new FormControl('', { validators: [Validators.required, Validators.maxLength(50)] });
  optionOneText = new FormControl('', { validators: [Validators.required, Validators.maxLength(100)] });
  optionTwoText = new FormControl('', { validators: [Validators.required, Validators.maxLength(100)] });

  constructor(private http: HttpClient) {
  }

  ngOnInit() {
    this.getLocationByAuthor(this.player.authorId);
    this.loadAvailableImages();
  }

  async getLocationByAuthor(authorId: string) {
    const params = {
      gameCode: this.gameCode,
      authorId: authorId
    };

    console.log('Retrieving location for author:', params);

    try {
      const response = await firstValueFrom(
        this.http.get<Location[]>(environment.nowhereBackendUrl + HttpConstants.LOCATION_PATH, { params })
      );
      console.log('Location retrieved!', response);
      
      if (response && response.length > 0) {
        this.location = response[0];
        this.setPrimaryStat();
        this.locationLabel.setValue(this.location.label?.toString() || '');
        this.optionOneText.setValue(this.location.options[0]?.optionText || '');
        this.optionTwoText.setValue(this.location.options[1]?.optionText || '');
      }
    } catch (error) {
      console.error('Error getting location', error);
    }
  }

  setPrimaryStat() {
    if (this.location.options.length >= 2) {
      const option1Stats = this.location.options[0]?.successResults || [];
      const option2Stats = this.location.options[1]?.successResults || [];
      
      for (const stat1 of option1Stats) {
        for (const stat2 of option2Stats) {
          if (stat1.playerStat.statType.id === stat2.playerStat.statType.id) {
            this.primaryStat = stat1.playerStat.statType;
            return;
          }
        }
      }
      
      // Fallback to first stat if no match found
      if (option1Stats.length > 0) {
        this.primaryStat = option1Stats[0].playerStat.statType;
      }
    }
  }

  submitLocation() {
    const requestBody = {
      ...this.location,
      label: this.locationLabel.value,
      iconDirectory: this.selectedImage,
      options: [
        {
          ...this.location.options[0],
          optionText: this.optionOneText.value
        },
        {
          ...this.location.options[1],
          optionText: this.optionTwoText.value
        }
      ]
    };

    console.log("Submitting location update", requestBody);

    this.http
      .put(environment.nowhereBackendUrl + HttpConstants.LOCATION_PATH + "?gameCode=" + this.gameCode, requestBody)
      .subscribe({
        next: (response) => {
          console.log('Location updated!', response);
          this.playerDone.emit(ComponentType.WRITE_LOCATION_PROMPT);
        },
        error: (error) => {
          console.error('Error updating location', error);
        },
      });
  }

  goBack() {
    this.aboutToSubmit = false;
    
    switch (this.phase) {
      case WritePhase.ADD_IMAGE:
        this.phase = WritePhase.OPTION_TWO;
        this.aboutToSubmit = false;
        break;
      case WritePhase.OPTION_TWO:
        this.phase = WritePhase.OPTION_ONE;
        break;
      case WritePhase.OPTION_ONE:
        this.phase = WritePhase.PROMPT;
        this.hasProgressed = false;
        break;
      default:
        this.phase = WritePhase.PROMPT;
        this.hasProgressed = false;
        break;
    }
    this.scrollToActiveSection();
  }

  submitWriting() {
    switch (this.phase) {
      case WritePhase.PROMPT:
        this.phase = WritePhase.OPTION_ONE;
        this.hasProgressed = true;
        this.scrollToActiveSection();
        break;
      case WritePhase.OPTION_ONE:
        this.phase = WritePhase.OPTION_TWO;
        this.scrollToActiveSection();
        break;
      case WritePhase.OPTION_TWO:
        this.phase = WritePhase.ADD_IMAGE;
        this.aboutToSubmit = true;
        this.scrollToActiveSection();
        break;
      case WritePhase.ADD_IMAGE:
        this.phase = WritePhase.DONE;
        this.submitLocation();
        break;
      default:
        this.phase = WritePhase.DONE;
        break;
    }
  }

  next() {
    this.submitWriting();
  }

  private scrollToActiveSection() {
    setTimeout(() => {
      const activeSection = document.querySelector('.writing-section .instructions-box.active')?.closest('.writing-section');
      if (activeSection) {
        activeSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100); // Small delay to ensure DOM updates
  }

  getInstructionQuestionString() {
    if (this.phase === WritePhase.PROMPT) {
      return `What is this place called? This location will allow your friends to improve their`;
    }
    if (this.phase === WritePhase.ADD_IMAGE) {
      return `What icon represents your location on the map?`;
    }
    return `What is something your friends could do here to improve their`;
  }

  getCurrentOptionIndex(): number {
    return this.phase === WritePhase.OPTION_TWO ? 1 : 0;
  }

  getOptionStats(optionIndex: number) {
    if (this.location.options && this.location.options[optionIndex] && this.location.options[optionIndex].successResults) {
      return this.location.options[optionIndex].successResults.map(result => result.playerStat.statType);
    }
    return [];
  }

  statDCDifficulty(optionIndex: number) {
    if (this.location.options && this.location.options[optionIndex] && this.location.options[optionIndex].playerStatDCs && this.location.options[optionIndex].playerStatDCs.length > 0) {
      let statDC: number = this.location.options[optionIndex].playerStatDCs[0].value;
      if (statDC >= 7) {
        return "HARD";
      } else if (statDC < 7 && statDC >= 4) {
        return "NORMAL";
      } else {
        return "EASY";
      }
    }
    return "NORMAL";
  }

  loadAvailableImages() {
    this.http
      .get<string[]>(environment.nowhereBackendUrl + HttpConstants.LOCATION_IMAGES_PATH)
      .subscribe({
        next: (images) => {
          console.log('Available images loaded:', images);
          this.availableImages = images;
          if (images.length > 0) {
            this.selectedImage = images[0];
          }
        },
        error: (error) => {
          console.error('Error loading images', error);
        },
      });
  }

  selectImage(imageUrl: string) {
    this.selectedImage = imageUrl;
  }

  getImageName(imageUrl: string): string {
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    return fileName.replace('.png', '').replace(/_/g, ' ');
  }

  canSubmit(): boolean {
    switch (this.phase) {
      case WritePhase.PROMPT:
        return !!(this.locationLabel.value && this.locationLabel.value.trim().length > 0);
      case WritePhase.OPTION_ONE:
        return !!(this.optionOneText.value && this.optionOneText.value.trim().length > 0);
      case WritePhase.OPTION_TWO:
        return !!(this.optionTwoText.value && this.optionTwoText.value.trim().length > 0);
      case WritePhase.ADD_IMAGE:
        return !!(this.selectedImage && this.selectedImage.trim().length > 0);
      default:
        return false;
    }
  }
}
