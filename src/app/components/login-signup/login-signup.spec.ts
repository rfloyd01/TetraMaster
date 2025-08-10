import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginSignup } from './login-signup';

describe('LoginSignup', () => {
  let component: LoginSignup;
  let fixture: ComponentFixture<LoginSignup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginSignup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginSignup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
