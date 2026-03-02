import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemListing } from './item-listing';

describe('ItemListing', () => {
  let component: ItemListing;
  let fixture: ComponentFixture<ItemListing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemListing]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemListing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
