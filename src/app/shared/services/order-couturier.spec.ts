import { TestBed } from '@angular/core/testing';

import { OrderCouturier } from './order-couturier';

describe('OrderCouturier', () => {
  let service: OrderCouturier;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderCouturier);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
