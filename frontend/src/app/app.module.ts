import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import {
  MatProgressSpinnerModule,
  MatAutocompleteModule,
  MatButtonModule,
  MatCardModule,
  MatIconModule,
  MatInputModule,
  MatRippleModule,
  MatToolbarModule,
  MatTooltipModule,
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ClipboardModule } from 'ngx-clipboard';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login';
import { DPPipe } from './dp-pipe/dp-pipe';
import { HomeComponent } from './home';
import { StreamComponent } from './stream';
import { JoinComponent } from './join';
import { BasicComponent } from './basic';
import { GetUserPipe } from './get-user-pipe/get-user.pipe';
import { NotFoundComponent } from './not-found';

@NgModule({
  declarations: [
    AppComponent,
    BasicComponent,
    DPPipe,
    GetUserPipe,
    HomeComponent,
    JoinComponent,
    LoginComponent,
    NotFoundComponent,
    StreamComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    HttpClientModule,
    ReactiveFormsModule,
    ClipboardModule,
    AppRoutingModule,

    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    MatToolbarModule,
    MatTooltipModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
