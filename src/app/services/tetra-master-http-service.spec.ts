import { TestBed } from '@angular/core/testing';

import { TetraMasterHttpService } from './tetra-master-http-service';

describe('TetraMasterHttpService', () => {
  let service: TetraMasterHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TetraMasterHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
