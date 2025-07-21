import { Component, OnInit } from '@angular/core';
import { Card } from '../card/card';
import { AttackStyle, CardOwner } from '../../util/card-types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [Card, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  attackStyle = AttackStyle;
  cardOwner = CardOwner;

  // testOwners: CardOwner[] = [CardOwner.ENEMY, CardOwner.ENEMY, CardOwner.ENEMY, CardOwner.ENEMY, CardOwner.ENEMY, CardOwner.ENEMY];
  cardOwners: CardOwner[] = [];
  attackPowers: number[] = [];
  cardArrows: number[] = [];

  ngOnInit(): void {
    this.initializeCards();
    this.createRandomBoard();
    console.log(this.cardOwners);
  }

  changeCardOwner(card: number) {
    if (this.cardOwners[card] == CardOwner.ENEMY) {
      this.cardOwners[card] = CardOwner.FRIEND;
    } else if (this.cardOwners[card] == CardOwner.FRIEND) {
      this.cardOwners[card] = CardOwner.ENEMY;
    } else if (this.cardOwners[card] == CardOwner.EMPTY) {
      this.cardOwners[card] = CardOwner.FRIEND;
    }
  }

  initializeCards() {
    for (let i:number = 0; i < 16; i++) {
      this.cardOwners.push(CardOwner.EMPTY);
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
          this.cardOwners[blockerLocation] = CardOwner.BLOCKED;
          break;
        }
      }
    }
  }

  counter(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }
}
