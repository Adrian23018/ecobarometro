import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'levelName',
  standalone: true
})
export class LevelNamePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
