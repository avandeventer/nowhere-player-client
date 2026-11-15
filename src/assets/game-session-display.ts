export class GameSessionDisplay {
    mapDescription: string;
    goalDescription: string;
    playerTitle: string;
    playerDescription: string;
    endingDescription: string;
    successText: string;
    neutralText: string;
    failureText: string;
    entity: string;
    // Filled in by GET /display from the game's adventure map; not part of the stored display
    adventureMapName: string;

    constructor() {
        this.mapDescription = "";
        this.goalDescription = "";
        this.playerTitle = "";
        this.playerDescription = "";
        this.endingDescription = "";
        this.successText = "";
        this.neutralText = "";
        this.failureText = "";
        this.entity = "";
        this.adventureMapName = "";
    }
}

