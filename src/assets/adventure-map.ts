import { StatType } from "./stat-type";
import { Location } from "./location";
import { Story } from "./story";
import { GameSessionDisplay } from "./game-session-display";

export class AdventureMap {
    name: string = "";
    adventureId: string = "";
    locations: Location[] = [];
    statTypes: StatType[] = [];
    ritual: Story = new Story();
    gameSessionDisplay: GameSessionDisplay | null = null;

    constructor() {
        this.name = "";
        this.adventureId = "";
        this.locations = [];
        this.ritual = new Story();
        this.gameSessionDisplay = null;
    }
}