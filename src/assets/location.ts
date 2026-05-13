import { Option } from './option';

export class Location {
    id: string;
    options: Option[];
    label: String;
    iconDirectory: String;
    locationIndex: number;

    description: string;
    selectedOptionId: string;

    constructor () {
        this.id = "";
        this.options = []
        this.label = "";
        this.iconDirectory = "";
        this.locationIndex = 0;
        this.description = "";
        this.selectedOptionId = "";
    }
}