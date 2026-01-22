import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientListing } from './patient-listing';

describe('PatientListing', () => {
  let component: PatientListing;
  let fixture: ComponentFixture<PatientListing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientListing]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientListing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
