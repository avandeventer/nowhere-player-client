import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpConstants } from 'src/assets/http-constants';
import { environment } from 'src/environments/environment';
import { CollaborativeTextPhase, TextSubmission, TextAddition } from 'src/assets/collaborative-text-phase';
import { PlayerVote } from 'src/assets/player-vote';
import { GameSessionDisplay } from 'src/assets/game-session-display';
import { CollaborativeTextPhaseInfo } from 'src/assets/collaborative-text-phase-info';
import { GameBoard } from 'src/assets/game-board';
import { OutcomeType } from 'src/assets/outcome-type';

@Injectable({ providedIn: 'root' })
export class GameService {
  constructor(private firestore: Firestore, private http: HttpClient) {}

  listenForGameStateChanges(gameCode: string): Observable<{ 
    gameState: string | null; 
    activePlayerSession: any | null; 
    storiesToWritePerRound: number | null; 
    storiesToPlayPerRound: number | null;
    adventureMap: any | null;
    collaborativeTextPhases: any | null;
    stories: any[] | null;
  }> {
    const gameDocRef = doc(this.firestore, `gameSessions/${gameCode}`);
  
    return docData(gameDocRef).pipe(
      map((data: any) => ({
        gameState: data?.gameState ?? null,
        activePlayerSession: data?.activePlayerSession ?? null,
        storiesToWritePerRound: data?.storiesToWritePerRound ?? null,
        storiesToPlayPerRound: data?.storiesToPlayPerRound ?? null,
        adventureMap: data?.adventureMap ?? null,
        collaborativeTextPhases: data?.collaborativeTextPhases ?? null,
        stories: data?.stories ?? null
      }))
    );
  }

  submitGenre(gameCode: string, authorId: string, value: string | null) {
    return this.http.put(environment.nowhereBackendUrl + HttpConstants.GENRE_PATH + "?gameCode=" + gameCode + "&authorId=" + authorId, { genre: value });
  }

  // Collaborative Text Methods
  getCollaborativeTextPhase(gameCode: string): Observable<CollaborativeTextPhase> {
    return this.http.get<CollaborativeTextPhase>(`${environment.nowhereBackendUrl}/collaborativeText?gameCode=${gameCode}`);
  }

  submitTextAddition(gameCode: string, textAddition: TextAddition): Observable<CollaborativeTextPhase> {
    return this.http.post<CollaborativeTextPhase>(`${environment.nowhereBackendUrl}/collaborativeText?gameCode=${gameCode}`, textAddition);
  }

  submitPlayerVote(gameCode: string, playerVote: PlayerVote): Observable<CollaborativeTextPhase> {
    return this.http.post<CollaborativeTextPhase>(`${environment.nowhereBackendUrl}/collaborativeText/vote?gameCode=${gameCode}`, playerVote);
  }

  getWinningSubmission(gameCode: string): Observable<string> {
    return this.http.get<string>(`${environment.nowhereBackendUrl}/collaborativeText/winner?gameCode=${gameCode}`);
  }

  getAvailableSubmissionsForPlayer(gameCode: string, playerId: string, requestedCount: number = 2): Observable<TextSubmission[]> {
    return this.http.get<TextSubmission[]>(`${environment.nowhereBackendUrl}/collaborativeText/available?gameCode=${gameCode}&playerId=${playerId}&requestedCount=${requestedCount}`);
  }

  getVotingSubmissions(gameCode: string, playerId: string): Observable<TextSubmission[]> {
    return this.http.get<TextSubmission[]>(`${environment.nowhereBackendUrl}/collaborativeText/voting?gameCode=${gameCode}&playerId=${playerId}`);
  }

  submitPlayerVotes(gameCode: string, playerVotes: PlayerVote[]): Observable<CollaborativeTextPhase> {
    return this.http.post<CollaborativeTextPhase>(`${environment.nowhereBackendUrl}/collaborativeText/votes?gameCode=${gameCode}`, playerVotes);
  }

  getOutcomeTypeForPlayer(gameCode: string, playerId: string): Observable<OutcomeType> {
    return this.http.get<OutcomeType>(`${environment.nowhereBackendUrl}/collaborativeText/outcomeType?gameCode=${gameCode}&playerId=${playerId}`);
  }

  getGameSessionDisplay(gameCode: string): Observable<GameSessionDisplay> {
    const parameter = "?gameCode=" + gameCode;
    return this.http.get<GameSessionDisplay>(environment.nowhereBackendUrl + HttpConstants.DISPLAY_PATH + parameter) as Observable<GameSessionDisplay>;
  }

  getCollaborativeTextPhaseInfo(gameCode: string): Observable<CollaborativeTextPhaseInfo> {
    return this.http.get<CollaborativeTextPhaseInfo>(`${environment.nowhereBackendUrl}/collaborativeText/phaseInfo?gameCode=${gameCode}`);
  }

  getGameBoard(gameCode: string): Observable<GameBoard> {
    return this.http.get<GameBoard>(`${environment.nowhereBackendUrl}/game-board?gameCode=${gameCode}`);
  }

  getFeatureFlag(flagName: string): Observable<boolean> {
    return this.http.get<boolean>(`${environment.nowhereBackendUrl}/featureFlags/value?flagName=${flagName}`);
  }

  getOutcomeTypes(gameCode: string, playerId: string): Observable<OutcomeType[]> {
    return this.http.get<OutcomeType[]>(`${environment.nowhereBackendUrl}/collaborativeText/outcomeTypes?gameCode=${gameCode}&playerId=${playerId}`);
  }

  getStoryByStoryId(gameCode: string, storyId: string): Observable<any> {
    return this.http.get<any>(`${environment.nowhereBackendUrl}/story?gameCode=${gameCode}&storyId=${storyId}`);
  }
}
