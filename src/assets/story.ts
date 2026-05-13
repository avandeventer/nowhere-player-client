import { Option } from './option';
import { Location } from './location';
import { EncounterLabel } from './encounter-label';
import { Repercussion } from './repercussion';

export class Story {
    prompt: string;
    authorId: string;
    outcomeAuthorId: string;
    playerId: string;
    playerIds: string[];
    partnerIds: string[];
    selectedOptionId: string;
    playerSucceeded: boolean;
    location: Location;
    options: Option[];
    storyId: string;
    prequelStorySucceeded: boolean;
    prequelStoryId: string;
    prequelStoryPlayerId: string;
    prequelOutcomeDisplay: string[];
    gameCode: string;
    mainPlotStory: boolean;
    encounterLabel?: EncounterLabel;
    repercussions?: Repercussion[];
    
    constructor() {
        this.prompt = "";
        this.authorId = "";
        this.outcomeAuthorId = "";
        this.location = new Location();
        this.options = [];
        this.storyId = "";
        this.playerId = "";
        this.playerIds = [];
        this.partnerIds = [];
        this.selectedOptionId = "";
        this.playerSucceeded = false;
        this.prequelStoryId = "";
        this.prequelStorySucceeded = false;
        this.prequelStoryPlayerId = "";
        this.prequelOutcomeDisplay = [];
        this.gameCode = "";
        this.mainPlotStory = false;
        this.repercussions = [];
    }
}