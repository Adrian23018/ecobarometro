// src/app/shared/pipes/score-format.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'scoreFormat'
})
export class ScoreFormatPipe implements PipeTransform {

  transform(
    score: number, 
    format: 'standard' | 'compact' | 'percentage' | 'currency' = 'standard',
    showSign: boolean = false
  ): string {
    if (score === null || score === undefined) return '0';

    const sign = showSign && score > 0 ? '+' : '';

    switch (format) {
      case 'compact':
        return this.formatCompact(score, sign);
      
      case 'percentage':
        return `${score.toFixed(1)}%`;
      
      case 'currency':
        return `${sign}${score.toLocaleString('es-ES')} 🪙`;
      
      case 'standard':
      default:
        return `${sign}${score.toLocaleString('es-ES')}`;
    }
  }

  private formatCompact(score: number, sign: string): string {
    const absScore = Math.abs(score);
    
    if (absScore >= 1000000) {
      return `${sign}${(score / 1000000).toFixed(1)}M`;
    }
    
    if (absScore >= 1000) {
      return `${sign}${(score / 1000).toFixed(1)}K`;
    }
    
    return `${sign}${score}`;
  }
}
