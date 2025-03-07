import { RitualOption } from "./ritual-option";

export class Ritual {
    gameCode: string;
    ritualOptions: RitualOption[];

    constructor () {
        this.gameCode = '';
        this.ritualOptions = [];
    }
}