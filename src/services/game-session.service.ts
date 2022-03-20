import { Injectable } from '@angular/core';
import { AngularFirestore } from "angularfire2/firestore";
import { FormControl, FormGroup } from '@angular/forms';
import { GameSession } from 'src/assets/GameSession';
import { Observable } from 'rxjs';
import { resolve } from 'url';
import { FieldValue } from 'firebase-admin/firestore';

@Injectable({
  providedIn: 'root'
})
export class GameSessionService {

  constructor(private firestore: AngularFirestore) { }
  form = new FormGroup({        
    gameSession: new FormControl('')
  })

  // getGameSession(code: string): any { 
  //   console.log(code);
  //   return 
  //    this.firestore
  //    .collection("gameSessions", ref => ref.where('gameSession.code', '==', code)).snapshotChanges();
  // }

  getGameSession(): Observable<any> {
    return this.firestore.collection("gameSessions").snapshotChanges();
  }
  
  async updateGameSession(gameSession, documentId) {
    console.log("Updating...");
    console.log(documentId);
    // ...
    const gameSessionRef = this.firestore.collection('gameSessions').doc(documentId);

    // Atomically add a new region to the "regions" array field.
    const object = Object.assign({},gameSession.players);
    console.log(JSON.stringify(object));
    // return await gameSessionRef.update({
    //   players: FieldValue.arrayUnion(object)
    // });
    return new Promise<any> ((resolve, reject) => {
      this.firestore
      .collection("gameSessions")
      .doc(documentId)
      .set(object);
    })
  }

  createGameSession(data) {
    console.log("CREATING GAME SESSION: ", data);
    return new Promise<any>((resolve, reject) =>{
        this.firestore
            .collection("gameSessions")
            .add(data)
            .then(res => {}, err => reject(err));
    });
  }
 
}