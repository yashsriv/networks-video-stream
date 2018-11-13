import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

import {
  map,
  filter,
  debounceTime,
  distinctUntilChanged,
  tap,
} from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';

import { User } from 'src/app/models/user';
import { AuthService } from '../auth.service';
import { UsersService } from '../users.service';
import { Router } from '@angular/router';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  public searchResults$: Observable<User[]>;

  public loginForm = this.fb.group({
    username: ['', Validators.required],
    password: [''],
  });

  public selectedUser: User;

  @ViewChild('username')
  usernameInput: ElementRef<HTMLInputElement>;
  // @ViewChild('password')
  // passwordInput: ElementRef<HTMLInputElement>;

  constructor(
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private sanitizer: DomSanitizer,
    private users: UsersService
  ) {}

  ngOnInit() {
    const typeahead = this.loginForm.controls['username'].valueChanges.pipe(
      map((v: string) => v.trim()),
      filter(v => v.length > 3),
      debounceTime(20),
      distinctUntilChanged()
    );
    this.searchResults$ = typeahead.pipe(
      map(v =>
        this.users.users().filter(user => {
          const lcTerm = v.toLowerCase().replace(/\s\s+/g, ' ');
          const lcName = user.name.toLowerCase().replace(/\s\s+/g, ' ');
          return lcName.startsWith(lcTerm) || user.username.startsWith(lcTerm);
        })
      )
    );
  }

  url(user: User): SafeStyle {
    const iitkhome = `http://home.iitk.ac.in/~${user.username}/dp`;
    const oaimage = `https://oa.cc.iitk.ac.in/Oa/Jsp/Photo/${user.roll}_0.jpg`;
    const url = `url("${iitkhome}"), url("${oaimage}")`;
    return this.sanitizer.bypassSecurityTrustStyle(url);
  }

  selected(event: MatAutocompleteSelectedEvent) {
    this.selectedUser = this.users.entities[event.option.value];
    // this.passwordInput.nativeElement.focus();
  }

  clearSelection() {
    this.selectedUser = null;
    this.loginForm.controls['username'].setValue('');
    this.usernameInput.nativeElement.focus();
  }

  onSubmit() {
    this.auth.login(this.loginForm.value.username).subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
