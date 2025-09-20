import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'scoreFormat',
  standalone: true
})
export class ScoreFormatPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
