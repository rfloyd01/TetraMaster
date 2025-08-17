import { Injectable } from '@angular/core';
import { AttackStyle, CardDisplay, CardInfo, User, UserJson } from '../util/card-types';
import { TetraMasterHttpService } from './tetra-master-http-service';
import { BehaviorSubject } from 'rxjs';
import { removeCardFromHandByUserSlotId } from '../util/card-util';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly tokenKey = 'auth_token';
  user!: User | null;
  userCards: CardInfo[] = []; //represents cards that user is currently playing with

  loginResult: BehaviorSubject<number> = new BehaviorSubject<number>(-1);

  constructor(private readonly httpService: TetraMasterHttpService) {}

  getToken(): string | null {
    const tokenString = localStorage.getItem(this.tokenKey);

    if (!this.isTokenExpired(tokenString)) {
      return tokenString as string;
    } else {
      //If the token is expired and the user is still logged in
      //(user isn't null) then attempt to refresh the token in the
      //backend
    }

    return null;
  }

  isTokenExpired(tokenString: string | null): boolean {
    if (tokenString) {
      console.log(tokenString);
      const tokenValue = JSON.parse(atob(tokenString.split('.')[1]));
      const expirationInMs = tokenValue.exp * 1000;

      return Date.now() > expirationInMs;
    }

    return true;
  }

  loadUserCards() {
    if (this.user != null) {
      this.loginResult.next(1);
    } else {
      //If the jwt is present but the user object is null, make a call to the 
      //backend using the jwt to get user info
      const jwt = this.getToken();
      if (jwt) {
        this.login('', '', jwt);
      } else {
        //If there is no jwt then set the login result to false
        this.loginResult.next(0);
      }
      
    }
  }

  getUserCards() {
    return this.user?.cards;
  }

  getCurrentUserCards() {
    //return a reference to the users current hand
    return this.userCards;
  }

  addCardToCurrentHand(card: CardInfo) {
    //Update the userSlot id for the card and add it to the current card array
    card.compositeId.userSlot = 105 + this.userCards.length;
    this.userCards.push(card);
  }

  removeCardFromCurrentHand(card: CardInfo) {
    //Remove the given card from the user's current hand
    removeCardFromHandByUserSlotId(card.compositeId.userSlot, this.userCards);
  }

  login(username: string, password: string, jwt?: string) {
    this.httpService.login(username, password, jwt).subscribe(
      response => this.handleLogin(response)
    );
  }

  createNewUser(username: string, password: string) {
    this.httpService.createUser(username, password).subscribe(
      response => this.handleLogin(response)
    );
  }

  logout() {
    //remove any info about the current user, delete the existing jwt if it exists
    //and then send out a notification
    this.user = null;
    localStorage.removeItem(this.tokenKey);
    this.loginResult.next(0);
  }

  handleLogin(loginResult: {token: string, user: UserJson}) {
    if (loginResult.token) {
      //Save the jwt
      localStorage.setItem(this.tokenKey, loginResult.token);

      //convert the json object from the backend into a User object and save it
      //at the service level.
      this.user = this.convertUserInfoJson(loginResult.user);

      //Send out an update to any subsribers
      this.loginResult.next(1);
    } else {
      console.warn('Login was unsuccessful');
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
        compositeId: {
          boardLocation: 0,
          uniqueId: cardJson.card_id,
          userSlot: 0,
          cardTypeId: cardJson.card_type
        },
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

      const row = cardJson.card_type % 10;
      const col = Math.floor(cardJson.card_type / 10);
      
      cardInfo[row][col].push(card);
    }

    return { username: userInfoJson.username, cards: cardInfo }
  }
}
