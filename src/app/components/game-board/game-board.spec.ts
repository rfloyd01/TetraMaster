import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameBoard } from './game-board';

describe('GameBoard', () => {
  let component: GameBoard;
  let fixture: ComponentFixture<GameBoard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameBoard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameBoard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
