import { Story } from "./story"
import { Location } from "./location"

export class RepercussionOutput {
    ending: Story|null;
    locationDestroyed: Location|null

    constructor() {
        this.ending = null;
        this.locationDestroyed = null;
    }
}