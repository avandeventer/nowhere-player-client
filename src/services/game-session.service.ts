import { Injectable } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class GameService {
  constructor(private firestore: Firestore) {}

  listenForGameStateChanges(gameCode: string): Observable<{ gameState: string | null; activePlayerSession: any | null }> {
    const gameDocRef = doc(this.firestore, `gameSessions/${gameCode}`);
  
    return docData(gameDocRef).pipe(
      map((data: any) => ({
        gameState: data?.gameState ?? null,
        activePlayerSession: data?.activePlayerSession ?? null
      }))
    );
  }
}
