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
  //Enum imports for data binding
  attackStyle = AttackStyle;
  cardDisplay = CardDisplay;

  //Card Arrays
  gridCards: CardInfo[] = [];
  playerCards: CardInfo[] = [];
  opponentCards: CardInfo[] = [];

  //State Variables
  gamePhase: number = 0;
  selectedCard!: CardInfo | null;

  ngOnInit(): void {
    this.createRandomBoard();
    this.createPlayerCards();
  }

  // changeCardDisplay(card: number) {
  //   if (this.cardDisplays[card] == CardDisplay.ENEMY) {
  //     this.cardDisplays[card] = CardDisplay.FRIEND;
  //   } else if (this.cardDisplays[card] == CardDisplay.FRIEND) {
  //     this.cardDisplays[card] = CardDisplay.ENEMY;
  //   } else if (this.cardDisplays[card] == CardDisplay.EMPTY) {
  //     this.cardDisplays[card] = CardDisplay.FRIEND;
  //   }
  // }

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
          // this.cardDisplays[blockerLocation] = CardDisplay.BLOCKED;
          assignedBlockers |= (1 << blockerLocation);
          break;
        }
      }
    }

    //Once blockers are assigned create cards and place them into the grid
    //array. These cards will eventually have their stats overriden by player cards.
    for (let i: number = 0; i < 16; i++) {
      this.gridCards.push({cardStats: this.createDefaultStats(),
        isSelected: false,
        cardDisplay: (assignedBlockers & (1 << i)) ? CardDisplay.BLOCKED : CardDisplay.EMPTY});
    }
  }

  createPlayerCards() {
    //Generate 10 cards with randomized stats and give them to the player and opponent
    //TODO: Eventually the player will be able to collect and choose which cards
    //      they want to play with.
    this.playerCards = []; //clear out any existing cards

    for (let i:number = 0; i < 5; i++) {
      this.playerCards.push({cardStats: this.createRandomStats(), isSelected: false, cardDisplay: CardDisplay.FRIEND });
      this.opponentCards.push({cardStats: this.createRandomStats(), isSelected: false, cardDisplay: CardDisplay.BACK });
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
        if (this.playerCards[i].isSelected) {
          this.selectedCard = this.playerCards[i];
        } else {
          this.selectedCard = null;
        }
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
  
  playSelectedCard(gridRow: number, gridColumn: number) {
    const gridIndex = 4 * gridRow + gridColumn;
    if (this.selectedCard && (this.gridCards[gridIndex]).cardDisplay == CardDisplay.EMPTY) {
      //Add the stats of the selected card to the selected empty space in the grid.
      this.gridCards[gridIndex].cardDisplay = CardDisplay.FRIEND;
      this.gridCards[gridIndex].cardStats = this.selectedCard.cardStats;
      this.gridCards[gridIndex].isSelected = false;

      //Remove the card from the player's hand

      //Initiate the battle phase against any neighboring oppenent cards
    }
  }

  counter(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }

}
