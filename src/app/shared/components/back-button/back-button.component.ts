import { Component, Input } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule, ButtonModule, RippleModule],
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.css']
})
export class BackButtonComponent {
  @Input() customRoute?: string; // Ruta personalizada (opcional)
  @Input() label: string = 'Atrás'; // Texto del botón (opcional)
  @Input() position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline' = 'top-left';
  @Input() showOnMobileOnly: boolean = false; // Solo mostrar en móvil

  constructor(
    private location: Location,
    private router: Router
  ) {}

  goBack(): void {
    if (this.customRoute) {
      this.router.navigate([this.customRoute]);
    } else {
      this.location.back();
    }
  }
}
