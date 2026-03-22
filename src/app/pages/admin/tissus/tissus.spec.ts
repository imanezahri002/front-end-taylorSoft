import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tissus } from './tissus';

describe('Tissus', () => {
  let component: Tissus;
  let fixture: ComponentFixture<Tissus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tissus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tissus);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
