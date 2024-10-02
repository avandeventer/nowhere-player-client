import { Injectable } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class GameService {
  constructor(private firestore: Firestore) {}

  // Listen to the gameState of a specific game by its gameCode
  listenForGameStateChanges(gameCode: string): Observable<string | null> {
    const gameDocRef = doc(this.firestore, `gameSessions/${gameCode}`);

    // docData listens for real-time updates to the document
    return docData(gameDocRef).pipe(
      map((data: any) => data?.gameState ?? null) // Safe access for gameState, or return null
    );
  }
}
