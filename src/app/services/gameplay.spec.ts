import { TestBed } from '@angular/core/testing';

import { Gameplay } from './gameplay';

describe('Gameplay', () => {
  let service: Gameplay;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Gameplay);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
