import { Component, OnInit, signal, Signal } from '@angular/core';
import { Card } from '../card/card';
import { AttackStyle, CardDisplay, CardInfo, CardStats } from '../../util/card-types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [Card, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  attackStyle = AttackStyle;
  cardDisplay = CardDisplay;

  cardDisplays: CardDisplay[] = [];
  attackPowers: number[] = [];
  cardArrows: number[] = [];

  //playerCards: Signal<CardStats>[] = []; //use Angular 16+ Signals for updating info about cards
  playerCards: CardInfo[] = [];
  opponentCards: CardStats[] = [];

  gamePhase: number = 0;

  ngOnInit(): void {
    this.initializeCards();
    this.createRandomBoard();
    this.createPlayerCards();
    console.log(this.cardDisplays);
  }

  changeCardDisplay(card: number) {
    if (this.cardDisplays[card] == CardDisplay.ENEMY) {
      this.cardDisplays[card] = CardDisplay.FRIEND;
    } else if (this.cardDisplays[card] == CardDisplay.FRIEND) {
      this.cardDisplays[card] = CardDisplay.ENEMY;
    } else if (this.cardDisplays[card] == CardDisplay.EMPTY) {
      this.cardDisplays[card] = CardDisplay.FRIEND;
    }
  }

  initializeCards() {
    for (let i:number = 0; i < 16; i++) {
      this.cardDisplays.push(CardDisplay.EMPTY);
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
          this.cardDisplays[blockerLocation] = CardDisplay.BLOCKED;
          break;
        }
      }
    }
  }

  createPlayerCards() {
    //Generate 10 cards with randomized stats and give them to the player and opponent
    //TODO: Eventually the player will be able to collect and choose which cards
    //      they want to play with.
    this.playerCards = []; //clear out any existing cards

    for (let i:number = 0; i < 5; i++) {
      // this.playerCards.push(signal({
      //   activeArrows: Math.floor(Math.random() * 256),
      //   attackPower: Math.floor(Math.random() * 256),
      //   attackStyle: AttackStyle.PHYSICAL,
      //   physicalDefense: Math.floor(Math.random() * 256),
      //   magicalDefense: Math.floor(Math.random() * 256)
      // }))
      this.playerCards.push({cardStats: this.createRandomStats(), isSelected: false});
      this.opponentCards.push(this.createRandomStats());
    }
  }

  selectPlayerCard(cardId: number) {
    //The player has selected a card from their card holder, first iterate over
    //all the cards in the holder and remove the selected status from anything
    //that has it. Then apply the selected status to the given card.
    for (let i:number = 0; i < this.playerCards.length; i++) {
      if (i == cardId) {
        //flip the currently selected card from its current value
        this.playerCards[i].isSelected = !this.playerCards[i].isSelected;
      } else if (this.playerCards[i].isSelected) {
        this.playerCards[i].isSelected = false;
      }
    }
  }

  createDefaultStats() {
    return this.createStats(0, 0, AttackStyle.PHYSICAL, 0, 0);
  }

  createRandomStats() {
    //Generate the AttackStyle. There's an 90% chance for a standard attack type,
    //9% chance for the Flexible style and a 1% chance for Assault style
    let attackStyleNum = Math.floor(Math.random() * 100);
    let attackStyle: AttackStyle;

    if (attackStyleNum < 90) {
      if (attackStyleNum % 2 == 0) {
        attackStyle = AttackStyle.PHYSICAL
      } else {
        attackStyle = AttackStyle.MAGICAL;
      }
    } else if (attackStyleNum < 99) {
      attackStyle = AttackStyle.FLEXIBLE
    } else {
      attackStyle = AttackStyle.ASSUALT;
    }

    return this.createStats(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256),
              attackStyle, Math.floor(Math.random() * 256), Math.floor(Math.random() * 256));
  }

  createStats(activeArrows: number, attackPower: number, attackStyle: AttackStyle,
    physicalDefense:number, magicalDefense: number) {
    return {
        activeArrows: activeArrows,
        attackPower: attackPower,
        attackStyle: attackStyle,
        physicalDefense: physicalDefense,
        magicalDefense: magicalDefense
      }
}

  // createStatsSignal(type:number, stats?:CardStats):Signal<CardStats> {
  //   if (type == 0) {
  //     return this.createRandomStatsSignal();
  //   } else if (type == 1) {
  //     return signal(createDefaultCardStats());
  //   } else {
  //     if (stats) {
  //       return signal(stats);
  //     } else {
  //       return signal(createDefaultCardStats());
  //     }
  //   }
  // }

  // createRandomStatsSignal():Signal<CardStats> {
  //   return signal({
  //       activeArrows: Math.floor(Math.random() * 256),
  //       attackPower: Math.floor(Math.random() * 256),
  //       attackStyle: AttackStyle.PHYSICAL,
  //       physicalDefense: Math.floor(Math.random() * 256),
  //       magicalDefense: Math.floor(Math.random() * 256)
  //     });
  // }
  

  counter(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }

}
