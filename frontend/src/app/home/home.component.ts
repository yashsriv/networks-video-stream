import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { UsersService } from '../users.service';
import { Router } from '@angular/router';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  constructor(
    private auth: AuthService,
    private router: Router,
    private users: UsersService
  ) {}

  get user() {
    return this.users.entities[this.auth.currentUser];
  }

  onLogout() {
    this.auth
      .logout()
      .subscribe(null, null, () => this.router.navigate(['/signin']));
  }
}
