import { TestBed } from '@angular/core/testing';

import { OpponentService } from './opponent-service';

describe('OpponentService', () => {
  let service: OpponentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpponentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
