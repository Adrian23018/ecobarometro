// src/app/app.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

// PrimeNG (componentes usados en el template)
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RoleIndicatorComponent } from './shared/components/role-indicator/role-indicator.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    RouterOutlet,
    ToastModule,
    ConfirmDialogModule,
    RoleIndicatorComponent
  ]
})
export class AppComponent {
  currentYear = new Date().getFullYear();
}
