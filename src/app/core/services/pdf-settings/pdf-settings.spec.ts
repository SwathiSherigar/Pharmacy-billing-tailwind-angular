import { TestBed } from '@angular/core/testing';

import { PdfSettings } from './pdf-settings';

describe('PdfSettings', () => {
  let service: PdfSettings;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfSettings);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
