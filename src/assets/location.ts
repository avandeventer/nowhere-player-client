import { Option } from './option';

export class Location {
    id: string;
    locationName: string;
    options: Option[];
    label: String;
    iconDirectory: String;

    constructor () {
        this.id = "";
        this.locationName = "";
        this.options = []
        this.label = "";
        this.iconDirectory = "";
    }
}