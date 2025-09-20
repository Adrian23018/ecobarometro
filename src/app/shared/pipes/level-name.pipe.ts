// src/app/shared/pipes/level-name.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'levelName'
})
export class LevelNamePipe implements PipeTransform {

  private readonly levelNames = [
    { min: 1, max: 5, name: 'Explorador Eco', icon: '🌱', color: '#22c55e' },
    { min: 6, max: 10, name: 'Guardián Verde', icon: '🌿', color: '#16a34a' },
    { min: 11, max: 15, name: 'Protector Natural', icon: '🌳', color: '#15803d' },
    { min: 16, max: 25, name: 'Eco Guerrero', icon: '🦎', color: '#166534' },
    { min: 26, max: 35, name: 'Maestro Ambiental', icon: '🦅', color: '#14532d' },
    { min: 36, max: 50, name: 'Sabio de la Tierra', icon: '🌍', color: '#052e16' },
    { min: 51, max: 75, name: 'Campeón Ecológico', icon: '🏆', color: '#fbbf24' },
    { min: 76, max: 100, name: 'Leyenda Verde', icon: '👑', color: '#f59e0b' },
    { min: 101, max: 999, name: 'Dios de la Naturaleza', icon: '⚡', color: '#d97706' }
  ];

  transform(
    level: number, 
    format: 'name' | 'icon' | 'color' | 'full' | 'badge' = 'name'
  ): string {
    if (!level || level < 1) level = 1;

    const levelData = this.levelNames.find(l => level >= l.min && level <= l.max) 
                     || this.levelNames[this.levelNames.length - 1];

    switch (format) {
      case 'icon':
        return levelData.icon;
      
      case 'color':
        return levelData.color;
      
      case 'full':
        return `${levelData.icon} ${levelData.name} (Nivel ${level})`;
      
      case 'badge':
        return `${levelData.icon} Nv.${level}`;
      
      case 'name':
      default:
        return levelData.name;
    }
  }

  // Método helper para obtener información completa del nivel
  getLevelInfo(level: number): {
    name: string;
    icon: string;
    color: string;
    range: { min: number; max: number };
    progress: number;
  } {
    if (!level || level < 1) level = 1;

    const levelData = this.levelNames.find(l => level >= l.min && level <= l.max) 
                     || this.levelNames[this.levelNames.length - 1];

    const progress = ((level - levelData.min) / (levelData.max - levelData.min)) * 100;

    return {
      name: levelData.name,
      icon: levelData.icon,
      color: levelData.color,
      range: { min: levelData.min, max: levelData.max },
      progress: Math.min(100, Math.max(0, progress))
    };
  }
}