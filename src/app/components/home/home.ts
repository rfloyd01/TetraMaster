import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardDisplay, CardInfo } from '../../util/card-types';
import { Card } from '../card/card';
import { createDefaultStats, randomInteger } from '../../util/card-util';
import { CommonModule } from '@angular/common';
import { counter } from '../../util/general-utils';

@Component({
  selector: 'app-home',
  imports: [Card, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  selectedCards: CardInfo[] = [];
  highlightedCard!: CardInfo;
  allCards: (CardInfo | null)[][][] = [];

  counter = counter;

  constructor(private router: Router, private route: ActivatedRoute) {

  }

  ngOnInit(): void {
    //Regardless of what cards the player has, the grid needs a count of each type of card
    //to properly create itself, so create empty arrays for all 100 card types.
    for (let i:number = 0; i < 10; i++) {
      this.allCards.push([]);
      for (let j:number = 0; j < 10; j++) {
        this.allCards[i].push([]);
      }
    }

    //For now, generate some random cards to go into the selected
    //cards array
    for (let i: number = 0; i < 5; i++) {
      this.selectedCards.push({
        id: i,
        cardStats: createDefaultStats(),
        isSelected: false,
        cardDisplay: CardDisplay.FRIEND,
        cardText: ''
      });
    }

    this.highlightedCard = this.selectedCards[0];

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
        id: i,
        cardStats: createDefaultStats(),
        isSelected: false,
        cardDisplay: CardDisplay.FRIEND,
        cardText: ''
      })
    }
  }

  getBoardPieceImage(row: number, col: number) {
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

    // return 'assets/empty_board_piece.png'
  }

}
