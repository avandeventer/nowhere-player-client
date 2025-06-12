import { Option } from "./option";
import { Story } from "./story";

export class Ending {
    playerId: string;
    playerUsername: string;
    associatedStories: Story[];
    associatedLocationId: string;
    associatedRitualOption: Option;
    authorId: string;
    endingBody: string;
    didWeSucceed: boolean;

    constructor() {
        this.playerId = "";
        this.playerUsername = "";
        this.associatedStories = [];
        this.associatedLocationId = "";
        this.associatedRitualOption = new Option();
        this.authorId = "";
        this.endingBody = "";
        this.didWeSucceed = false;
    }
}