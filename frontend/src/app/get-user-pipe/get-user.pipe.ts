import { Pipe, PipeTransform } from '@angular/core';

import { Observable } from 'rxjs';
import { User } from '../models/user';
import { UsersService } from '../users.service';

@Pipe({
  name: 'getUser',
})
export class GetUserPipe implements PipeTransform {
  constructor(private users: UsersService) {}

  transform(value: string, args?: any): User {
    return this.users.entities[value];
  }
}
