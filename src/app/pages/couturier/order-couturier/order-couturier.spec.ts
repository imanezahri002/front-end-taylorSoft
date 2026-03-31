import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderCouturier } from './order-couturier';

describe('OrderCouturier', () => {
  let component: OrderCouturier;
  let fixture: ComponentFixture<OrderCouturier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderCouturier]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderCouturier);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
