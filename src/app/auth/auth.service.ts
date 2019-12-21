import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';

import { Router } from '@angular/router';

import * as firebase from 'firebase';
import { map } from 'rxjs/operators';

import { Store } from '@ngrx/store';
import { ActivarLoadingAction, DesactivarLoadingAction } from '../share/ui.accions';

import Swal from 'sweetalert2';
import { User } from './user.model';
import { AppState } from '../app.reducer';

import { SetUserAction } from './auth.actions';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  userSubscription: Subscription = new Subscription() ;

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router,
    private afDB: AngularFirestore,
    private store: Store<AppState>
  ) { }

  crearUsuario( nombre: string, email: string, password: string ) {

    // carga el isLoading
    this.store.dispatch( new ActivarLoadingAction() );

    // Crear usuario
    this.afAuth.auth.createUserWithEmailAndPassword( email, password )
        .then( resp => {

          console.log( resp );
          const user: User = {
            uid: resp.user.uid,
            nombre,
            email: resp.user.email
          };

          this.afDB.doc(`${user.uid}/usuario`)
              .set( user )
              .then( () => {
                this.router.navigate(['/']);
                this.store.dispatch( new DesactivarLoadingAction() );
              });
        })
        .catch( error => {
          console.log( error );
          this.store.dispatch( new DesactivarLoadingAction() );
          Swal.fire('Error en el login', error.message, 'error' );
        });
  }


  initAuthListener() {
    this.afAuth.authState.subscribe( (fbUser: firebase.User) => {

      if ( fbUser ) {
        this.userSubscription = this.afDB.doc(`${fbUser.uid}/usuario`).valueChanges()
          .subscribe( ( usuarioObj: any ) => {
            const newUser = new User( usuarioObj );
            this.store.dispatch( new SetUserAction( usuarioObj ) );
            console.log( newUser );
          });
      } else {
        this.userSubscription.unsubscribe();
      }
    });
  }


  login( email: string, password: string ) {

    // carga el isLoading
    this.store.dispatch( new ActivarLoadingAction() );

    // Login
    this.afAuth.auth.signInWithEmailAndPassword( email, password )
        .then( resp => {
          // console.log( resp );
          this.router.navigate(['/']);
          this.store.dispatch( new DesactivarLoadingAction() );
        })
        .catch( error => {
          console.log( error );
          Swal.fire('Error en el login', error.message, 'error' );
          this.store.dispatch( new DesactivarLoadingAction() );
        });
  }


  logout() {
    this.router.navigate(['/login']);
    this.afAuth.auth.signOut();
    this.store.dispatch( new DesactivarLoadingAction() );
  }


  isAuth() {
    return this.afAuth.authState
        .pipe(
          map( fbUser => {
            if (fbUser == null) {
              this.router.navigate(['/login']);
            }

            return fbUser !=  null;
          })
        );
  }
}
