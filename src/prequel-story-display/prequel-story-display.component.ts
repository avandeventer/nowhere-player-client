import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Story } from 'src/assets/story';
import { Option } from 'src/assets/option';
import { Location } from 'src/assets/location';
import { Player } from 'src/assets/player';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpConstants } from 'src/assets/http-constants';
import { MatCardModule } from '@angular/material/card';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'prequel-story-display',
  templateUrl: './prequel-story-display.component.html',
  standalone: true,
  imports: [MatCardModule, CdkAccordionModule, MatExpansionModule]
})
export class PrequelDisplayComponent implements OnChanges {
  @Input() gameCode: string = '';
  @Input() story: Story = new Story();
  @Input() isAdventureMode: boolean = false;
  sequelTypeClarifier: string = "";

  prequelOutcomeDisplay: string[] = [];

  constructor(private http: HttpClient) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['story']) {
        if(this.story?.prequelStoryId) {
            console.log('Prequel story changed: ', changes)
            this.fetchPrequelStory(this.story);
        } else {
            this.prequelOutcomeDisplay = [];
        }
    }
  }

  async fetchPrequelStory(story: Story): Promise<void> {
    const params = {
      gameCode: this.gameCode,
      storyId: story.prequelStoryId,
    };

    try {
      const response = await firstValueFrom(
        this.http.get<{ responseBody: Story[] }>(
          `${environment.nowhereBackendUrl}${HttpConstants.AUTHOR_STORIES_PATH}`,
          { params }
        )
      );

      const prequelStory = response.responseBody[0];
      if (prequelStory) {
        this.prequelOutcomeDisplay = this.setOutcomeDisplay(prequelStory);

        // Handle special case for player-specific outcomes
        if (story.prequelStoryPlayerId) {
          const prequelPlayer = await this.fetchPrequelStoryPlayer(
            story.prequelStoryPlayerId
          );
          this.sequelTypeClarifier = 
            this.createSequelPlayerDisplay(prequelPlayer);
        } else {
          const gameLocations = await this.fetchLocations(this.gameCode);
          this.sequelTypeClarifier = 
            this.createOutcomeLocationDisplay(
              this.story.location,
              gameLocations
            );
        }
      }
    } catch (error) {
      console.error('Error fetching prequel story:', error);
    }
  }

  private async fetchPrequelStoryPlayer(authorId: string): Promise<Player> {
    const params = { gameCode: this.gameCode, authorId };

    try {
      const response = await firstValueFrom(
        this.http.get<Player>(
          `${environment.nowhereBackendUrl}${HttpConstants.PLAYER_AUTHORID_PATH}`,
          { params }
        )
      );
      return response;
    } catch (error) {
      console.error('Error fetching prequel story player:', error);
      throw error;
    }
  }

  private async fetchLocations(gameCode: string): Promise<Location[]> {
    const params = { gameCode };

    try {
      const response = await firstValueFrom(
        this.http.get<Location[]>(
          `${environment.nowhereBackendUrl}${HttpConstants.LOCATION_PATH}`,
          { params }
        )
      );
      return response;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }

  private setOutcomeDisplay(prequelStory: Story): string[] {
    const outcomeDisplay: string[] = [];
    let selectedPrequelOption: Option | null = null;

    for (const option of prequelStory.options) {
      if (option.optionId === prequelStory.selectedOptionId) {
        selectedPrequelOption = option;
        break;
      }
    }

    if (selectedPrequelOption) {
      outcomeDisplay.push(prequelStory.prompt);
      outcomeDisplay.push(selectedPrequelOption.optionText);
      if (prequelStory.playerSucceeded) {
        outcomeDisplay.push(selectedPrequelOption.successText);
        for (const outcomeStat of selectedPrequelOption.successResults) {
          outcomeDisplay.push(
            `You gain ${outcomeStat.playerStat.value} ${outcomeStat.playerStat.statType.label}`
          );
        }
      } else {
        outcomeDisplay.push(selectedPrequelOption.failureText);
        for (const outcomeStat of selectedPrequelOption.failureResults) {
          outcomeDisplay.push(
            `You lose ${outcomeStat.playerStat.value} ${outcomeStat.playerStat.statType.label}`
          );
        }
      }
    }

    return outcomeDisplay;
  }

  private createOutcomeLocationDisplay(
    location: Location,
    gameLocations: Location[]
  ): string {
    const gameLocation = gameLocations.find(gameLocation => gameLocation.id === location.id);
    return `This sequel story does not follow a specific player. It will trigger when anyone travels to the ${gameLocation?.label}`;
  }

  private createSequelPlayerDisplay(prequelPlayer: Player): string {
    return `This story follows ${prequelPlayer.userName} wherever they go. It isn't connected to a specific location!`;
  }
}
