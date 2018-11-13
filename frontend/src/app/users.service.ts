import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, of, EMPTY, concat } from 'rxjs';
import { switchMap, map, catchError, tap } from 'rxjs/operators';

import { User } from 'src/app/models/user';

interface SearchResponse {
  u: string;
  n: string;
  i: string;
  d: string;
  p: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  public entities: { [key: string]: User } = {};
  public ids: string[] = [];

  users(): User[] {
    return this.ids.map(id => this.entities[id]);
  }

  constructor(private http: HttpClient) {}

  private _getAll(): Observable<User[]> {
    let cached = false;
    let observables: Observable<User[]>[] = [];
    if (localStorage.getItem('users-data')) {
      const students = JSON.parse(localStorage.getItem('users-data')) as User[];
      cached = true;
      observables.push(of(students));
    }

    const search$ = this.http
      .get<SearchResponse[]>('https://search.pclub.in/api/students')
      .pipe(
        map(responses => {
          return responses.map(v => {
            return {
              username: v.u,
              name: v.n,
              roll: v.i,
              dept: v.d,
              prog: v.p,
            };
          });
        }),
        tap(users => {
          localStorage.setItem('users-data', JSON.stringify(users));
        }),
        catchError(err => {
          if (cached) return EMPTY;
          else return of([]);
        })
      );

    observables.push(search$);
    return concat(...observables);
  }

  public getUsers(): Observable<void> {
    return this._getAll().pipe(
      tap(users => {
        users.forEach(v => (this.entities[v.username] = v));
        this.ids = users.map(user => user.username);
      }),
      map(() => {})
    );
  }
}
