import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpConstants } from 'src/assets/http-constants';
import { environment } from 'src/environments/environment';
import { CollaborativeTextPhase, TextSubmission, TextAddition, PlayerVote } from 'src/assets/collaborative-text-phase';

@Injectable({ providedIn: 'root' })
export class GameService {
  constructor(private firestore: Firestore, private http: HttpClient) {}

  listenForGameStateChanges(gameCode: string): Observable<{ 
    gameState: string | null; 
    activePlayerSession: any | null; 
    storiesToWritePerRound: number | null; 
    storiesToPlayPerRound: number | null;
    adventureMap: any | null;
  }> {
    const gameDocRef = doc(this.firestore, `gameSessions/${gameCode}`);
  
    return docData(gameDocRef).pipe(
      map((data: any) => ({
        gameState: data?.gameState ?? null,
        activePlayerSession: data?.activePlayerSession ?? null,
        storiesToWritePerRound: data?.storiesToWritePerRound ?? null,
        storiesToPlayPerRound: data?.storiesToPlayPerRound ?? null,
        adventureMap: data?.adventureMap ?? null
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

  getAvailableSubmissionsForPlayer(gameCode: string, playerId: string): Observable<TextSubmission[]> {
    return this.http.get<TextSubmission[]>(`${environment.nowhereBackendUrl}/collaborativeText/available?gameCode=${gameCode}&playerId=${playerId}`);
  }

  recordSubmissionView(gameCode: string, playerId: string, submissionId: string): Observable<void> {
    return this.http.post<void>(`${environment.nowhereBackendUrl}/collaborativeText/view?gameCode=${gameCode}&playerId=${playerId}&submissionId=${submissionId}`, {});
  }
}
