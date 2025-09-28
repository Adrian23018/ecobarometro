import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], field: string, value: any): any[] {
    if (!items || !field) {
      return items;
    }

    return items.filter(item => {
      if (field.includes('.')) {
        // Handle nested properties
        const fields = field.split('.');
        let nestedValue = item;
        for (const f of fields) {
          nestedValue = nestedValue?.[f];
        }
        return nestedValue === value;
      } else {
        return item[field] === value;
      }
    });
  }
}