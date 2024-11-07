import { Option } from './option';

export class Location {
    locationId: number;
    locationName: String;
    options: Option[];

    constructor () {
        this.locationId = 0;
        this.locationName = "";
        this.options = []
    }
}