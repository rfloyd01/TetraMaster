import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CARD_TYPES, CardDisplay, CardInfo } from '../../util/card-types';
import { Card } from '../card/card';
import { createRandomStatsForCardType, randomInteger } from '../../util/card-util';
import { CommonModule } from '@angular/common';
import { counter } from '../../util/general-utils';

@Component({
  selector: 'app-home',
  imports: [Card, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  allCards: CardInfo[][][] = [];
  selectedCards: {info: CardInfo, type: number}[] = []; //selected cards appear on right side of screen, these will be used in the game

  //Fields for Highlighted cards. The highlighted cards appear in the middle of the screen when
  //the player clicks on a grid square. If there are multiple of a single type of card owned then
  //these cards can be shuffled through.
  highlightedCards: CardInfo[] = []; //highlighted cards will appear in center of screen, show clards of currently highlighted grid square
  highlightedCardType!: number | null;
  highlightedCardTypeName!: string | null;
  highlightedCardsHTML!: (HTMLElement | null);

  //Imports
  ALL_CARD_TYPES = CARD_TYPES;
  cardDisplay = CardDisplay;
  counter = counter;

  constructor(private router: Router, private route: ActivatedRoute) {

  }

  ngOnInit(): void {
    //Create the necessary arrays to hold player cards
    for (let i:number = 0; i < 10; i++) {
      this.allCards.push([]);
      for (let j:number = 0; j < 10; j++) {
        this.allCards[i].push([]);
      }
    }

    this.loadPlayerCards();
  }

  startNewGame() {
    this.router.navigate(['/game']);
  }

  loadPlayerCards() {
    //TODO: Ultimately will persist cards in a data base and grab them via http,
    //but for now just make random cards to see them displayed on the screen.

    //Randomly assign 100 cards into the grid
    for (let i:number = 0; i < 100; i++) {
      const row = randomInteger(10);
      const col = randomInteger(10);
      this.allCards[row][col].push({
        id: 10 * col + row,
        cardStats: createRandomStatsForCardType(this.ALL_CARD_TYPES[10 * col + row]), //need to transpose row and column to match grid
        isSelected: false,
        cardDisplay: CardDisplay.FRIEND,
        cardText: ''
      })
    }
  }

  highlightGridCard(row: number, col: number) {
    if (this.allCards[row][col].length > 0) {
      this.highlightedCardType = 10 * col + row; //need to transpose row and column to match grid
      this.highlightedCardTypeName = this.ALL_CARD_TYPES[this.highlightedCardType].name;

      if (this.allCards[row][col]) {
        this.highlightedCards = this.allCards[row][col];
      }

      //Apply the selected CSS class to the grid card in question, and remove it from
      //any existing selected grid card
      if (this.highlightedCardsHTML) {
        this.highlightedCardsHTML.classList.remove('selected');
      }

      this.highlightedCardsHTML = document.getElementById('grid-card-' + (10 * row + col)); //non-transposed id
      if (this.highlightedCardsHTML) {
        this.highlightedCardsHTML.classList.add('selected');
      }
    }
  }

  selectHighlightedCard(index: number) {
    //When a player clicks on the top card in the highlighted cards array
    //it will move the card into the selected cards portion of the screen.
    if (this.selectedCards.length >= 5) {
      return; //can't select more than 5 cards
    }

    if (index == 0) {
      this.selectedCards.push({
        info: {
          id: this.selectedCards.length,
          cardStats: this.highlightedCards[0].cardStats,
          isSelected: false,
          cardDisplay: CardDisplay.FRIEND,
          cardText: ''
        },
        type: this.highlightedCards[0].id
      })

      //The selected card needs to be removed from the grid, and the highlighted
      //cards array.
      const col = this.highlightedCards[0].id % 10;
      const row = Math.floor(this.highlightedCards[0].id / 10);
      this.highlightedCards = this.highlightedCards.length > 1 ? this.highlightedCards.slice(1) : [];
      this.allCards[col][row] = this.highlightedCards;

      //If there are no more of the given card type then the text in the highlighted
      //card section needs to be hidden (contains card number and name) and the image
      //for the given card in the grid needs to change to the empty slot.
      if (this.highlightedCards.length == 0) {
        this.updateBoardPieceImage(row, col);
        if (this.highlightedCardsHTML != null) {
          this.highlightedCardsHTML.classList.remove('selected');
          this.highlightedCardsHTML = null;
          this.highlightedCardType = null;
          this.highlightedCardTypeName = null;
        }
      }
    }
  }

  removeSelectedCard(index: number) {
    //removes the selected card from the player's hand and puts
    //it back into the grid and highlighted cards (if necessary).
    console.log(this.selectedCards[index].type);
  }

  getBoardPieceImage(row: number, col: number) {
    if (this.allCards[row][col].length == 0) {
      return 'assets/empty_board_piece.png';
    }

    const multi_string = this.allCards[row][col].length > 1 ? 'multi_' : '';
    const index = (10 * col + row);
    const prefix = 'assets/' + multi_string;

    if (index < 60) {
      return prefix + 'monster_board_piece.png'
    } else if (index < 80) {
      return prefix + 'eidolon_board_piece.png'
    } else {
      return prefix + 'equipment_board_piece.png'
    }
  }

  updateBoardPieceImage(row: number, col: number) {
    if (this.highlightedCardsHTML != null) {
      let imgChild = this.highlightedCardsHTML.children.item(0);
      if (imgChild != null) {
        let imgHTML: HTMLImageElement = imgChild as HTMLImageElement;
        imgHTML.src = this.getBoardPieceImage(row, col);
      }
    }
  }

}
