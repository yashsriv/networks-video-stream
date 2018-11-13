import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login';
import { AuthGuardNot, AuthGuard } from './auth-guard.service';
import { HomeComponent } from './home';
import { StreamComponent } from './stream';
import { JoinComponent } from './join';
import { BasicComponent } from './basic';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: BasicComponent },
      { path: 'stream', component: StreamComponent },
      { path: 'join/:id', component: JoinComponent },
    ],
  },
  { path: 'signin', component: LoginComponent, canActivate: [AuthGuardNot] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
