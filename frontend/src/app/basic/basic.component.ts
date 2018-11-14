import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  templateUrl: './basic.component.html',
  styleUrls: ['./basic.component.scss'],
})
export class BasicComponent {
  public joinCtrl = new FormControl();

  constructor(private router: Router) {}

  onJoin() {
    this.router.navigate(['/join', this.joinCtrl.value]);
  }

  onCreate() {
    this.router.navigate(['/stream']);
  }
}
