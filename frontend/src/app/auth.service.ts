import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { User } from 'src/app/models/user';
import { map, tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public currentUser: string;
  private loggedIn = false;
  private loggedInChecked = false;

  constructor(private http: HttpClient) {}

  login(body: { username: string; password?: string }): Observable<void> {
    return this.http.post('/login', body, { observe: 'response' }).pipe(
      tap(resp => {
        if (resp.status === 202) {
          this.currentUser = body.username;
          this.loggedIn = true;
        }
      }),
      map(() => {})
    );
  }

  logout() {
    return this.http
      .post('/logout', {})
      .pipe(tap(() => (this.loggedIn = false)));
  }

  check(): Observable<boolean> {
    return this.http.get('/me', { observe: 'response' }).pipe(
      map(resp => {
        if (resp.status === 200) {
          this.loggedIn = true;
          this.currentUser = document.cookie.match(
            new RegExp('username=([^;]+)')
          )[1];
          return true;
        }
        return false;
      }),
      catchError(err => of(false)),
      tap(() => (this.loggedInChecked = true))
    );
  }

  guardCheck(): boolean | Observable<boolean> {
    if (!this.loggedInChecked) {
      return this.check();
    } else {
      return this.loggedIn;
    }
  }
}
