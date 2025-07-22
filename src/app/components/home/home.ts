import { Component, OnInit } from '@angular/core';
import { Card } from '../card/card';
import { AttackStyle, CardDisplay } from '../../util/card-types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [Card, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  attackStyle = AttackStyle;
  cardOwner = CardDisplay;

  // testOwners: CardOwner[] = [CardOwner.ENEMY, CardOwner.ENEMY, CardOwner.ENEMY, CardOwner.ENEMY, CardOwner.ENEMY, CardOwner.ENEMY];
  cardOwners: CardDisplay[] = [];
  attackPowers: number[] = [];
  cardArrows: number[] = [];

  ngOnInit(): void {
    this.initializeCards();
    this.createRandomBoard();
    console.log(this.cardOwners);
  }

  changeCardOwner(card: number) {
    if (this.cardOwners[card] == CardDisplay.ENEMY) {
      this.cardOwners[card] = CardDisplay.FRIEND;
    } else if (this.cardOwners[card] == CardDisplay.FRIEND) {
      this.cardOwners[card] = CardDisplay.ENEMY;
    } else if (this.cardOwners[card] == CardDisplay.EMPTY) {
      this.cardOwners[card] = CardDisplay.FRIEND;
    }
  }

  initializeCards() {
    for (let i:number = 0; i < 16; i++) {
      this.cardOwners.push(CardDisplay.EMPTY);
      this.attackPowers.push(Math.floor(Math.random() * 256));
      this.cardArrows.push(Math.floor(Math.random() * 256));
    }
  }

  createRandomBoard() {
    //First generate a random number between 0 and 6, this will represent how many slots
    //in the board are blocked off.
    const blockers = Math.floor(Math.random() * 6);

    //Randomly assign the blockers
    let assignedBlockers:number = 0b0;
    for (let i:number = 0; i < blockers; i++) {
      while (true) {
        const blockerLocation = Math.floor(Math.random() * 16);
        if (!(assignedBlockers & (1 << blockerLocation))) {
          this.cardOwners[blockerLocation] = CardDisplay.BLOCKED;
          break;
        }
      }
    }
  }

  counter(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }
}
