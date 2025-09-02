import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ActivePlayerSession } from "src/assets/active-player-session";
import { HttpConstants } from "src/assets/http-constants";
import { RepercussionOutput } from "src/assets/repercussion-output";
import { Story } from "src/assets/story";
import { Location } from "src/assets/location";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class ActivePlayerSessionService {

    constructor(private http:HttpClient) {}

    public updateActivePlayerSession(
        gameCode: String,
        playerId: String,
        location: Location,
        playerStory: Story,
        selectedOptionId: String,
        outcomeDisplay: String[],
        nextPlayerTurn: boolean,
        selectedLocationOptionId: String,
        locationOutcomeDisplay: String[],
        repercussions: RepercussionOutput
      ): Observable<ActivePlayerSession> {
        const newActivePlayerSession: ActivePlayerSession = new ActivePlayerSession();
        newActivePlayerSession.gameCode = gameCode;
        newActivePlayerSession.location = location;
        newActivePlayerSession.story = playerStory;
        newActivePlayerSession.playerId = playerId;
        newActivePlayerSession.playerChoiceOptionId = selectedOptionId;
        newActivePlayerSession.outcomeDisplay = outcomeDisplay;
        newActivePlayerSession.setNextPlayerTurn = nextPlayerTurn;
        newActivePlayerSession.selectedLocationOptionId = selectedLocationOptionId;
        newActivePlayerSession.locationOutcomeDisplay = locationOutcomeDisplay;
        newActivePlayerSession.repercussions = repercussions;
    
        return this.http.put<ActivePlayerSession>(
            environment.nowhereBackendUrl + HttpConstants.ACTIVE_PLAYER_SESSION_PATH, 
            newActivePlayerSession
        );
    }
}