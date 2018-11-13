import { Component } from '@angular/core';
import { UsersService } from './users.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  loading = true;

  constructor(private users: UsersService) {}

  ngOnInit() {
    this.users.getUsers().subscribe(() => (this.loading = false));
  }
}
