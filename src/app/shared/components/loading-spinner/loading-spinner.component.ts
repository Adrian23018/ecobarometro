// src/app/shared/components/loading-spinner/loading-spinner.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css']
})
export class LoadingSpinnerComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' = 'primary';
  @Input() variant: 'spinner' | 'dots' | 'pulse' | 'bounce' | 'eco' = 'spinner';
  @Input() message: string = '';
  @Input() overlay: boolean = false;
  @Input() fullScreen: boolean = false;

  get spinnerClasses(): string {
    const classes = [];
    
    // Tamaño
    switch (this.size) {
      case 'small':
        classes.push('w-4 h-4');
        break;
      case 'large':
        classes.push('w-12 h-12');
        break;
      default:
        classes.push('w-8 h-8');
    }
    
    // Color
    switch (this.color) {
      case 'secondary':
        classes.push('text-gray-500');
        break;
      case 'success':
        classes.push('text-green-500');
        break;
      case 'warning':
        classes.push('text-yellow-500');
        break;
      case 'danger':
        classes.push('text-red-500');
        break;
      default:
        classes.push('text-blue-500');
    }
    
    return classes.join(' ');
  }

  get containerClasses(): string {
    const classes = ['loading-container'];
    
    if (this.overlay) {
      classes.push('overlay');
    }
    
    if (this.fullScreen) {
      classes.push('full-screen');
    }
    
    return classes.join(' ');
  }

  get messageClasses(): string {
    const classes = ['loading-message'];
    
    switch (this.size) {
      case 'small':
        classes.push('text-sm');
        break;
      case 'large':
        classes.push('text-lg');
        break;
      default:
        classes.push('text-base');
    }
    
    return classes.join(' ');
  }


  getRandomEcoMessage(): string {
  const messages = [
    'Cargando conocimiento verde...',
    'Preparando el planeta...',
    'Reciclando datos...',
    'Cultivando sabiduría...',
    'Conectando con la naturaleza...',
    'Creciendo sosteniblemente...',
    'Transformando el mundo...',
    'Energizando con renovables...'
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}
}
