import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean | Observable<boolean> {
    const res = this.auth.guardCheck();
    if (typeof res === 'boolean') {
      if (!res) {
        this.router.navigate(['/signin']);
      }
      return res;
    }
    return res.pipe(
      tap(r => {
        if (!r) {
          this.router.navigate(['/signin']);
        }
      })
    );
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthGuardNot implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean | Observable<boolean> {
    const res = this.auth.guardCheck();
    if (typeof res === 'boolean') {
      if (res) {
        this.router.navigate(['/']);
      }
      return !res;
    }
    return res.pipe(map(r => !r));
  }
}
