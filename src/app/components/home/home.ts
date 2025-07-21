import { Component } from '@angular/core';
import { Card } from '../card/card';
import { AttackStyle, CardOwner } from '../../util/card-types';

@Component({
  selector: 'app-home',
  imports: [Card],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  attackStyle = AttackStyle;
  cardOwner = CardOwner;

  testOwners: CardOwner[] = [CardOwner.ENEMY, CardOwner.ENEMY, CardOwner.ENEMY, CardOwner.ENEMY, CardOwner.ENEMY, CardOwner.ENEMY];

  changeCardOwnder(card: number) {
    if (this.testOwners[card] == CardOwner.ENEMY) {
      this.testOwners[card] = CardOwner.FRIEND;
    } else if (this.testOwners[card] == CardOwner.FRIEND) {
      this.testOwners[card] = CardOwner.ENEMY;
    }
  }
}
