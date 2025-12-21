import { TestBed } from '@angular/core/testing';

import { PdfServices } from './pdf.services';

describe('PdfServices', () => {
  let service: PdfServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
