import { Component, OnInit } from '@angular/core';
import { Card } from '../card/card';
import { AttackStyle, CardDisplay, CardInfo } from '../../util/card-types';
import { CommonModule } from '@angular/common';
import { Gameplay } from '../../services/gameplay';
import { removeCardFromHandById } from '../../util/card-util';

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

  constructor(private gameplayService: Gameplay) {

  }

  ngOnInit(): void {
    this.createRandomBoard();
    this.createPlayerCards();
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
          assignedBlockers |= (1 << blockerLocation);
          break;
        }
      }
    }

    //Once blockers are assigned create cards and place them into the grid
    //array. These cards will eventually have their stats overriden by player cards.
    for (let i: number = 0; i < 16; i++) {
      this.gridCards.push({
        id: i,
        cardStats: this.createDefaultStats(),
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
      this.opponentCards.push({id: i + 100, cardStats: this.createRandomStats(), isSelected: false, cardDisplay: CardDisplay.BACK });
      this.playerCards.push({id: i + 105, cardStats: this.createRandomStats(), isSelected: false, cardDisplay: CardDisplay.FRIEND });
    }
  }

  selectPlayerCard(card: CardInfo) {    
    //First iterate over all other cards in the player's hand and make sure they're deselected
    for (let playerCard of this.playerCards) {
      if (playerCard.id != card.id && playerCard.isSelected) {
        playerCard.isSelected = false; //only set if current value is true
      }
    }

    //Then flip the selection status of the selected card (deselecting is an option)
    card.isSelected = !card.isSelected;
    this.selectedCard = card.isSelected ? card : null;
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
      removeCardFromHandById(this.selectedCard.id, this.playerCards);
      this.selectedCard = null;

      //Initiate the battle phase against any neighboring oppenent cards

      //TODO: For now simply make the opponent move to a random location
      this.gameplayService.randomizeOpponentsTurn(this.opponentCards, this.gridCards);
    }
  }

  counter(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }

}
