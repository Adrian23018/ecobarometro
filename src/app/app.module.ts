// src/app/app.module.ts - CORREGIDO
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';

// PrimeNG Modules - Importaciones específicas
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';
import { RippleModule } from 'primeng/ripple';
import { MessageService, ConfirmationService } from 'primeng/api';

import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

// Configuración básica de rutas aquí mismo
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';

const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/auth/login', 
    pathMatch: 'full' 
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  { 
    path: '**', 
    redirectTo: '/auth/login' 
  }
];

@NgModule({
  declarations: [
    // AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes),
    
    // PrimeNG
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    ProgressBarModule,
    TableModule,
    DialogModule,
    ConfirmDialogModule,
    AvatarModule,
    BadgeModule,
    ChipModule,
    RippleModule,
    ConfirmDialogModule,
    CommonModule,
    RouterModule,
    
    // PWA
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    MessageService,
    ConfirmationService
  ],
  // bootstrap: [AppComponent],
  exports: [RouterModule,
    ToastModule,
    ConfirmDialogModule,]
})
export class AppModule { }