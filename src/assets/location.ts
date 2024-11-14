import { Option } from './option';

export class Location {
    locationId: number;
    locationName: String;
    options: Option[];
    label: String;

    constructor () {
        this.locationId = 0;
        this.locationName = "";
        this.options = []
        this.label = "";
    }
}