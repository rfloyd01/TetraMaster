import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestGameboardComponent } from './test-gameboard-component';

describe('TestGameboardComponent', () => {
  let component: TestGameboardComponent;
  let fixture: ComponentFixture<TestGameboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestGameboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestGameboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
