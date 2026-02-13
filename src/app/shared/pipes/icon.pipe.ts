import { Pipe, PipeTransform } from '@angular/core';

const ICON_MAP: { [key: string]: string } = {
  'pi pi-bolt': '⚡',
  'pi pi-tint': '💧',
  'pi pi-refresh': '♻️',
  'pi pi-car': '🚗',
  'pi pi-home': '🏠',
  'pi pi-sun': '🌿',
  'pi pi-cog': '🏭',
  'pi pi-apple': '🍎',
  'pi pi-book': '📚',
  'pi pi-desktop': '💻',
  'pi pi-circle': '🌍'
};

@Pipe({
  name: 'icon',
  standalone: true
})
export class IconPipe implements PipeTransform {
  transform(value: string): string {
    return ICON_MAP[value] ?? value;
  }
}
