import { Component, EventEmitter, Output } from '@angular/core';
import { TetraMasterHttpService } from '../../services/tetra-master-http-service';
import { FormsModule } from '@angular/forms';
import { AttackStyle, CardDisplay, CardInfo, User, UserJson } from '../../util/card-types';

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

  @Output()
  loginResult = new EventEmitter<User>();

  constructor(private readonly httpService: TetraMasterHttpService) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  submit() {
    if (this.isLoginMode) {
      // Login request
      this.httpService.login(this.username, this.password).subscribe({
          next: res => this.loginResult.emit(this.convertUserInfoJson(res)),
          error: err => console.error('Login failed:', err)
        });
    } else {
      // Register request
      this.httpService.createUser(this.username, this.password).subscribe({
          next: res => this.loginResult.emit(this.convertUserInfoJson(res)),
          error: err => console.error('Registration failed:', err)
        });
    }
  }

  convertUserInfoJson(userInfoJson: UserJson): User {
    let cardInfo: CardInfo[][][] = [];

    //Create default arrays to put cards into
    for (let i:number = 0; i < 10; i++) {
      cardInfo.push([]);
      for (let j:number = 0; j < 10; j++) {
        cardInfo[i].push([]);
      }
    }

    for (let cardJson of userInfoJson.cards) {
      const card: CardInfo = {
        id: 0,
        cardStats: {
          activeArrows: cardJson.arrows,
          attackPower: cardJson.attack_power,
          attackStyle: cardJson.attack_style as AttackStyle,
          physicalDefense: cardJson.physical_defense,
          magicalDefense: cardJson.magical_defense
        },
        isSelected: false,
        cardDisplay: CardDisplay.FRIEND,
        cardText: ''
      }

      const col = Math.floor(cardJson.card_type / 10);
      const row = cardJson.card_type % 10;
      cardInfo[row][col].push(card);
    }

    return { username: userInfoJson.username, cards: cardInfo }
  }
}
