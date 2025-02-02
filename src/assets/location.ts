import { Option } from './option';

export class Location {
    locationId: number;
    locationName: String;
    options: Option[];
    label: String;
    iconDirectory: String;

    constructor () {
        this.locationId = 0;
        this.locationName = "";
        this.options = []
        this.label = "";
        this.iconDirectory = "";
    }
}