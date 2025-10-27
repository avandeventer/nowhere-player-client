import { RepercussionOutput } from "./repercussion-output";
import { Story } from "./story";
import { Location } from "./location";

export class ActivePlayerSession {
    playerId: String;
    playerChoiceOptionId: String;
    story: Story;
    location: Location | null;
    selectedLocationOptionId: String;
    locationOutcomeDisplay: String[];
    setNextPlayerTurn: boolean;
    gameCode: String;
    outcomeDisplay: String[];
    repercussions: RepercussionOutput;
    startTimer: boolean;

    constructor() {
            this.playerId = "";
            this.playerChoiceOptionId = "";
            this.story = new Story();
            this.location = null;
            this.selectedLocationOptionId = "";
            this.setNextPlayerTurn = false;
            this.gameCode = "";
            this.outcomeDisplay = [];
            this.locationOutcomeDisplay = [];
            this.repercussions = new RepercussionOutput();
            this.startTimer = false;
    }
}