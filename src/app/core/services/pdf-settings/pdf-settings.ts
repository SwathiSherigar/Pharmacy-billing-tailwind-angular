import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PdfSettingsService {

  private settings = {
    headingSize: 14,
    subHeadingSize: 10,
    tableSize: 7,
    normalTextSize: 7
  };

  getSettings() {
    return this.settings;
  }

  setSettings(newSettings: any) {
    this.settings = { ...this.settings, ...newSettings };
  }
}