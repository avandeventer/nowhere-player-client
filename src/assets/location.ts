import { Option } from './option';

export class Location {
    id: string;
    options: Option[];
    label: String;
    iconDirectory: String;
    locationIndex: number;

    constructor () {
        this.id = "";
        this.options = []
        this.label = "";
        this.iconDirectory = "";
        this.locationIndex = 0;
    }
}