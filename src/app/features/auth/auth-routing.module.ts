// src/app/features/auth/auth-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    data: { isAdmin: false }
  },
  {
    path: 'login-admin',
    component: LoginComponent,
    data: { isAdmin: true }
  },
  {
    path: 'register',
    component: RegisterComponent,
    data: { isAdmin: false }
  },
  {
    path: 'register-admin',
    component: RegisterComponent,
    data: { isAdmin: true }
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }