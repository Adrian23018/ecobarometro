// src/app/shared/pipes/time-format.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFormat'
})
export class TimeFormatPipe implements PipeTransform {

  transform(seconds: number, format: 'short' | 'long' | 'minimal' = 'short'): string {
    if (!seconds || seconds < 0) return '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    switch (format) {
      case 'minimal':
        if (hours > 0) {
          return `${hours}h ${minutes}m`;
        }
        if (minutes > 0) {
          return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;

      case 'long':
        const parts = [];
        if (hours > 0) {
          parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
        }
        if (minutes > 0) {
          parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
        }
        if (remainingSeconds > 0 || parts.length === 0) {
          parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? 'segundo' : 'segundos'}`);
        }
        return parts.join(', ');

      case 'short':
      default:
        const h = hours.toString().padStart(2, '0');
        const m = minutes.toString().padStart(2, '0');
        const s = remainingSeconds.toString().padStart(2, '0');
        
        if (hours > 0) {
          return `${h}:${m}:${s}`;
        }
        return `${m}:${s}`;
    }
  }
}