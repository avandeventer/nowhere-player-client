/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Routes } from '@angular/router';
import { environment } from 'src/environments/environment';
import { ReactiveFormsModule } from '@angular/forms';
import { JoinGameComponent } from '../join-game/join-game.component';

const routes: Routes = [
  { path: '', component: JoinGameComponent },
  { path: 'game/:gameCode', component: JoinGameComponent }
];
 
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAnimations(),
    provideRouter(routes),
    provideFirebaseApp(() => {
      return initializeApp(environment.firebaseConfig);
    }),
    provideFirestore(() => getFirestore()),
    importProvidersFrom(ReactiveFormsModule)
  ],
};
