import { Option } from './option';
import { Location } from './location';

export class Story {
    prompt: string;
    authorId: string;
    outcomeAuthorId: string;
    location: Location;
    options: Option[];
    storyId: string;
    
    constructor() {
        this.prompt = "";
        this.authorId = "";
        this.outcomeAuthorId = "";
        this.location = new Location();
        this.options = [];
        this.storyId = "";
    }
}