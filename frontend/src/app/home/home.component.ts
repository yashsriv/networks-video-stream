import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { UsersService } from '../users.service';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  constructor(private auth: AuthService, private users: UsersService) {}

  get user() {
    return this.users.entities[this.auth.currentUser];
  }
}
