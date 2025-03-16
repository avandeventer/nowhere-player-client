import { RitualOption } from "./ritual-option";
import { Story } from "./story";

export class RitualStory extends Story {
    ritualOptions: RitualOption[];

    constructor () {
        super();
        this.gameCode = '';
        this.ritualOptions = [];
    }
}