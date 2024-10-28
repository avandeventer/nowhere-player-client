import { Story } from "./story";

export class ActivePlayerSession {
    playerId: String;
    playerChoiceOptionId: String;
    story: Story;
    setNextPlayerTurn: boolean;
    gameCode: String;
    outcomeDisplay: String[];

    constructor() {
            this.playerId = "";
            this.playerChoiceOptionId = "";
            this.story = new Story();
            this.setNextPlayerTurn = false;
            this.gameCode = "";
            this.outcomeDisplay = [];
    }
}