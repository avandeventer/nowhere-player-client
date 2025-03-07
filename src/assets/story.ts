import { Option } from './option';
import { Location } from './location';

export class Story {
    prompt: string;
    authorId: string;
    outcomeAuthorId: string;
    playerId: string;
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
    
    constructor() {
        this.prompt = "";
        this.authorId = "";
        this.outcomeAuthorId = "";
        this.location = new Location();
        this.options = [];
        this.storyId = "";
        this.playerId = "";
        this.selectedOptionId = "";
        this.playerSucceeded = false;
        this.prequelStoryId = "";
        this.prequelStorySucceeded = false;
        this.prequelStoryPlayerId = "";
        this.prequelOutcomeDisplay = [];
        this.gameCode = "";
    }
}