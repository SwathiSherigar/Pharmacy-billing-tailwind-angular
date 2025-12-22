import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class CustomMonthYearAdapter extends NativeDateAdapter {

  // parse from string like MM/YYYY
  override parse(value: any): Date | null {
    if (!value) return null;
    if (typeof value === 'string') {
      const parts = value.split('/');
      if (parts.length === 2) {
        const month = Number(parts[0]) - 1;
        const year = Number(parts[1]);
        return new Date(year, month, 1); // day is always 1
      }
    }
    return null;
  }

  // format Date object as MM/YYYY
  override format(date: Date, displayFormat: Object): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${year}`;
  }

  // ignore day calculations
  override getFirstDayOfWeek(): number {
    return 0; // Sunday
  }
}
