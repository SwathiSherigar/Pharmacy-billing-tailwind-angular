import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorsListing } from './doctors-listing';

describe('DoctorsListing', () => {
  let component: DoctorsListing;
  let fixture: ComponentFixture<DoctorsListing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorsListing]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorsListing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
