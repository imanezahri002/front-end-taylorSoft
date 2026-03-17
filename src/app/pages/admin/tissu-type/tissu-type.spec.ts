import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TissuTypeComponent } from './tissu-type';

describe('TissuTypeComponent', () => {
  let component: TissuTypeComponent;
  let fixture: ComponentFixture<TissuTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TissuTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TissuTypeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
