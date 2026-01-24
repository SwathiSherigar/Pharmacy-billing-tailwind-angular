import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillViewDialog } from './bill-view-dialog';

describe('BillViewDialog', () => {
  let component: BillViewDialog;
  let fixture: ComponentFixture<BillViewDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillViewDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillViewDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
