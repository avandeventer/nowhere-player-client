import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentChangeAction } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class GameService {
  constructor(private firestore: AngularFirestore) {}

  // Listen to the gameState of a specific game by its gameCode
  listenForGameStateChanges(gameCode: string): Observable<string | null> {
    return this.firestore
      .doc(`games/${gameCode}`)  // Path to the specific game document
      .snapshotChanges()         // Listen for real-time changes to the document
      .pipe(
        map((action) => {
          const data = action.payload.data() as any;
          return data ? data.gameState : null;  // Return the gameState or null if not found
        })
      );
  }
}
