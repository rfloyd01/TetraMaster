import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user-service';

@Component({
  selector: 'app-login-signup',
  imports: [FormsModule],
  templateUrl: './login-signup.html',
  styleUrl: './login-signup.css'
})
export class LoginSignup {
  isLoginMode = true;
  username = '';
  password = '';

  constructor(private readonly userService: UserService) {}

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
  }

  setLoginMode(mode: boolean) {
    this.isLoginMode = mode;
  }

  submit() {
    if (this.isLoginMode) {
      // Login request
      this.userService.login(this.username, this.password);
    } else {
      // Register request
      this.userService.createNewUser(this.username, this.password);
    }
  }
  
}
